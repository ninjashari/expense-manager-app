import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectDB } from '@/lib/db';
import ImportHistory from '@/models/import-history.model';
import Transaction from '@/models/transaction.model';
import Account from '@/models/account.model';
import Category from '@/models/category.model';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const { importId } = await req.json();

    console.log('🚀 Import execution started:', {
      importId,
      userId: session.user.id
    });

    if (!importId) {
      console.error('❌ Import ID is required');
      return NextResponse.json({ message: 'Import ID is required' }, { status: 400 });
    }

    // Find the import record
    const importRecord = await ImportHistory.findOne({
      _id: importId,
      userId: session.user.id
    });

    if (!importRecord) {
      console.error('❌ Import record not found:', { importId, userId: session.user.id });
      return NextResponse.json({ message: 'Import record not found' }, { status: 404 });
    }

    console.log('📋 Import record found:', {
      fileName: importRecord.fileName,
      status: importRecord.status,
      totalRows: importRecord.totalRows,
      dataType: importRecord.aiAnalysis?.dataType,
      columnMappings: importRecord.aiAnalysis?.columnMappings,
      userConfirmedMappings: importRecord.userConfirmedMappings
    });

    if (importRecord.status !== 'ready') {
      console.error('❌ Import record not ready for execution:', { 
        currentStatus: importRecord.status,
        importId 
      });
      return NextResponse.json({ 
        message: 'Import record is not ready for execution',
        currentStatus: importRecord.status 
      }, { status: 400 });
    }

    // Update status to importing
    importRecord.status = 'importing';
    importRecord.importedRows = 0;
    importRecord.failedRows = 0;
    importRecord.importErrors = [];
    await importRecord.save();

    console.log('🔄 Status updated to importing');

    try {
      const mappings = importRecord.userConfirmedMappings || importRecord.aiAnalysis.columnMappings;
      const dataType = importRecord.aiAnalysis.dataType;

      console.log('📊 Starting import with:', {
        dataType,
        mappings,
        totalRows: importRecord.originalData.length,
        sampleData: importRecord.originalData[0]
      });

      let importResults;

      switch (dataType) {
        case 'transactions':
          console.log('💳 Importing transactions...');
          importResults = await importTransactions(importRecord.originalData, mappings, session.user.id);
          break;
        case 'accounts':
          console.log('🏦 Importing accounts...');
          importResults = await importAccounts(importRecord.originalData, mappings, session.user.id);
          break;
        case 'categories':
          console.log('📂 Importing categories...');
          importResults = await importCategories(importRecord.originalData, mappings, session.user.id);
          break;
        default:
          console.error('❌ Unsupported data type:', dataType);
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      console.log('✅ Import completed:', importResults);

      // Update import record with results
      importRecord.status = 'completed';
      importRecord.importedRows = importResults.successCount;
      importRecord.failedRows = importResults.errorCount;
      importRecord.importErrors = importResults.errors;
      importRecord.completedAt = new Date();
      await importRecord.save();

      console.log('💾 Import record updated with results');

      return NextResponse.json({
        success: true,
        results: {
          importedRows: importResults.successCount,
          failedRows: importResults.errorCount,
          errors: importResults.errors,
          message: `Successfully imported ${importResults.successCount} ${dataType}`
        }
      });

    } catch (error) {
      console.error('❌ Import execution failed:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Update status to failed
      importRecord.status = 'failed';
      importRecord.importErrors = [
        ...(importRecord.importErrors || []),
        `Import execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ];
      await importRecord.save();

      return NextResponse.json({
        success: false,
        message: 'Import execution failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Execute API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Import transactions
async function importTransactions(data: Record<string, unknown>[], mappings: Record<string, string>, userId: string) {
  const results = { successCount: 0, errorCount: 0, errors: [] as string[] };
  
  // Get all user accounts and categories for reference
  const accounts = await Account.find({ userId });
  const categories = await Category.find({ userId });
  
  const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc._id]));
  const categoryMap = new Map(categories.map(cat => [cat.name.toLowerCase(), cat._id]));

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      // Map CSV data to transaction fields
      const transactionData: Record<string, unknown> = {};
      
      Object.entries(mappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          transactionData[dbField] = row[csvColumn];
        }
      });

      // Validate required fields
      if (!transactionData.date || !transactionData.amount || !transactionData.payee || !transactionData.account) {
        results.errors.push(`Row ${i + 1}: Missing required fields`);
        results.errorCount++;
        continue;
      }

      // Parse and validate amount
      const amount = parseFloat(transactionData.amount.toString());
      if (isNaN(amount)) {
        results.errors.push(`Row ${i + 1}: Invalid amount: ${transactionData.amount}`);
        results.errorCount++;
        continue;
      }

      // Parse date
      const date = new Date(transactionData.date as string);
      if (isNaN(date.getTime())) {
        results.errors.push(`Row ${i + 1}: Invalid date: ${transactionData.date}`);
        results.errorCount++;
        continue;
      }

      // Find account by name (with fuzzy matching)
      const accountName = transactionData.account.toString().toLowerCase().trim();
      let accountId = accountMap.get(accountName);
      
      // If exact match not found, try fuzzy matching
      if (!accountId) {
        for (const [dbAccountName, dbAccountId] of accountMap.entries()) {
          // Check if CSV account name is contained in DB account name or vice versa
          if (dbAccountName.includes(accountName) || accountName.includes(dbAccountName)) {
            accountId = dbAccountId;
            console.log(`🔍 Fuzzy match found: "${transactionData.account}" → "${dbAccountName}"`);
            break;
          }
        }
      }
      
      if (!accountId) {
        const availableAccounts = Array.from(accountMap.keys()).join(', ');
        results.errors.push(`Row ${i + 1}: Account '${transactionData.account}' not found. Available accounts: ${availableAccounts}`);
        results.errorCount++;
        continue;
      }

      // Find category by name (optional, with fuzzy matching)
      let categoryId = null;
      if (transactionData.category) {
        const categoryName = transactionData.category.toString().toLowerCase().trim();
        categoryId = categoryMap.get(categoryName);
        
        // If exact match not found, try fuzzy matching
        if (!categoryId) {
          for (const [dbCategoryName, dbCategoryId] of categoryMap.entries()) {
            // Check if CSV category name is contained in DB category name or vice versa
            if (dbCategoryName.includes(categoryName) || categoryName.includes(dbCategoryName)) {
              categoryId = dbCategoryId;
              console.log(`🔍 Fuzzy category match found: "${transactionData.category}" → "${dbCategoryName}"`);
              break;
            }
          }
        }
        
        if (!categoryId) {
          const availableCategories = Array.from(categoryMap.keys()).join(', ');
          results.errors.push(`Row ${i + 1}: Warning - Category '${transactionData.category}' not found. Available categories: ${availableCategories}. Transaction will be uncategorized`);
        }
      }

      // Determine transaction type based on amount or explicit type
      let type = amount >= 0 ? 'Income' : 'Expense';
      if (transactionData.type) {
        const explicitType = transactionData.type.toString().toLowerCase();
        if (explicitType.includes('income') || explicitType.includes('credit')) {
          type = 'Income';
        } else if (explicitType.includes('expense') || explicitType.includes('debit')) {
          type = 'Expense';
        }
      }
      const absoluteAmount = Math.abs(amount) * 100; // Convert to cents

      // Create transaction
      const transaction = new Transaction({
        userId,
        date,
        type,
        amount: absoluteAmount,
        payee: transactionData.payee,
        account: accountId,
        category: categoryId,
        notes: transactionData.notes || '',
      });

      await transaction.save();
      results.successCount++;

    } catch (error) {
      console.error(`Error importing row ${i + 1}:`, error);
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.errorCount++;
    }
  }

  return results;
}

// Import accounts
async function importAccounts(data: Record<string, unknown>[], mappings: Record<string, string>, userId: string) {
  const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

  console.log('🏦 Starting account import:', {
    totalRows: data.length,
    mappings,
    userId,
    sampleRow: data[0]
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    console.log(`🔍 Processing account row ${i + 1}:`, row);
    
    try {
      const accountData: Record<string, unknown> = {};
      
      Object.entries(mappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          accountData[dbField] = row[csvColumn];
        }
      });

      console.log(`📊 Mapped account data for row ${i + 1}:`, accountData);

      // Validate required fields
      if (!accountData.name || !accountData.type) {
        const error = `Row ${i + 1}: Missing required fields (name, type)`;
        console.error(`❌ ${error}`, { accountData });
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      // Currency is required for accounts
      if (!accountData.currency) {
        const error = `Row ${i + 1}: Missing required field 'currency' for account`;
        console.error(`❌ ${error}`, { accountData });
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      // Normalize account type to match enum values
      const normalizeAccountType = (type: string): string => {
        const typeStr = type.toString().toLowerCase().trim();
        if (typeStr.includes('check')) return 'Checking';
        if (typeStr.includes('saving')) return 'Savings';
        if (typeStr.includes('credit')) return 'Credit Card';
        if (typeStr.includes('cash')) return 'Cash';
        if (typeStr.includes('invest')) return 'Investment';
        
        // Return original if it matches exactly (case insensitive)
        const validTypes = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'];
        const exactMatch = validTypes.find(valid => valid.toLowerCase() === typeStr);
        return exactMatch || type.toString();
      };

      const normalizedType = normalizeAccountType(accountData.type.toString());
      
      console.log(`🔄 Account type normalized: "${accountData.type}" → "${normalizedType}"`);
      
      // Validate account type
      const validTypes = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'];
      if (!validTypes.includes(normalizedType)) {
        const error = `Row ${i + 1}: Invalid account type '${accountData.type}'. Valid types: ${validTypes.join(', ')}`;
        console.error(`❌ ${error}`);
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      // Parse balance if provided
      let balance = 0;
      if (accountData.balance) {
        balance = parseFloat(accountData.balance.toString()) * 100; // Convert to cents
        if (isNaN(balance)) {
          const error = `Row ${i + 1}: Invalid balance: ${accountData.balance}`;
          console.error(`❌ ${error}`);
          results.errors.push(error);
          results.errorCount++;
          continue;
        }
        console.log(`💰 Balance parsed: ${accountData.balance} → ${balance} cents`);
      }

      // Check if account already exists
      const existingAccount = await Account.findOne({ 
        userId, 
        name: accountData.name 
      });
      
      if (existingAccount) {
        const error = `Row ${i + 1}: Account '${accountData.name}' already exists`;
        console.error(`❌ ${error}`);
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      const account = new Account({
        userId,
        name: accountData.name,
        type: normalizedType,
        currency: accountData.currency,
        balance,
      });

      console.log(`💾 Saving account:`, {
        name: accountData.name,
        type: normalizedType,
        currency: accountData.currency,
        balance
      });

      await account.save();
      results.successCount++;
      console.log(`✅ Account saved successfully: ${accountData.name}`);

    } catch (error) {
      console.error(`❌ Error importing account row ${i + 1}:`, {
        error,
        row,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.errorCount++;
    }
  }

  return results;
}

// Import categories
async function importCategories(data: Record<string, unknown>[], mappings: Record<string, string>, userId: string) {
  const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

  console.log('📂 Starting category import:', {
    totalRows: data.length,
    mappings,
    userId,
    sampleRow: data[0]
  });

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    console.log(`🔍 Processing category row ${i + 1}:`, row);
    
    try {
      const categoryData: Record<string, unknown> = {};
      
      Object.entries(mappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          categoryData[dbField] = row[csvColumn];
        }
      });

      console.log(`📊 Mapped category data for row ${i + 1}:`, categoryData);

      // Validate required fields
      if (!categoryData.name || !categoryData.type) {
        const error = `Row ${i + 1}: Missing required fields (name, type)`;
        console.error(`❌ ${error}`, { categoryData });
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      // Normalize category type to match enum values
      const normalizeCategoryType = (type: string): string => {
        const typeStr = type.toString().toLowerCase().trim();
        if (typeStr.includes('income')) return 'Income';
        if (typeStr.includes('expense')) return 'Expense';
        
        // Return original if it matches exactly (case insensitive)
        const validTypes = ['Income', 'Expense'];
        const exactMatch = validTypes.find(valid => valid.toLowerCase() === typeStr);
        return exactMatch || type.toString();
      };

      const normalizedType = normalizeCategoryType(categoryData.type.toString());
      
      console.log(`🔄 Category type normalized: "${categoryData.type}" → "${normalizedType}"`);
      
      // Validate category type
      const validTypes = ['Income', 'Expense'];
      if (!validTypes.includes(normalizedType)) {
        const error = `Row ${i + 1}: Invalid category type '${categoryData.type}'. Valid types: ${validTypes.join(', ')}`;
        console.error(`❌ ${error}`);
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({ 
        userId, 
        name: categoryData.name 
      });
      
      if (existingCategory) {
        const error = `Row ${i + 1}: Category '${categoryData.name}' already exists`;
        console.error(`❌ ${error}`);
        results.errors.push(error);
        results.errorCount++;
        continue;
      }

      const category = new Category({
        userId,
        name: categoryData.name,
        type: normalizedType,
      });

      console.log(`💾 Saving category:`, {
        name: categoryData.name,
        type: normalizedType
      });

      await category.save();
      results.successCount++;
      console.log(`✅ Category saved successfully: ${categoryData.name}`);

    } catch (error) {
      console.error(`❌ Error importing category row ${i + 1}:`, {
        error,
        row,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.errorCount++;
    }
  }

  return results;
} 