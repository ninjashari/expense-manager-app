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

    if (!importId) {
      return NextResponse.json({ message: 'Import ID is required' }, { status: 400 });
    }

    // Find the import record
    const importRecord = await ImportHistory.findOne({
      _id: importId,
      userId: session.user.id
    });

    if (!importRecord) {
      return NextResponse.json({ message: 'Import record not found' }, { status: 404 });
    }

    if (importRecord.status !== 'ready') {
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

    try {
      const mappings = importRecord.userConfirmedMappings || importRecord.aiAnalysis.columnMappings;
      const dataType = importRecord.aiAnalysis.dataType;

      let importResults;

      switch (dataType) {
        case 'transactions':
          importResults = await importTransactions(importRecord.originalData, mappings, session.user.id);
          break;
        case 'accounts':
          importResults = await importAccounts(importRecord.originalData, mappings, session.user.id);
          break;
        case 'categories':
          importResults = await importCategories(importRecord.originalData, mappings, session.user.id);
          break;
        default:
          throw new Error(`Unsupported data type: ${dataType}`);
      }

      // Update import record with results
      importRecord.status = 'completed';
      importRecord.importedRows = importResults.successCount;
      importRecord.failedRows = importResults.errorCount;
      importRecord.importErrors = importResults.errors;
      importRecord.completedAt = new Date();
      await importRecord.save();

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
      console.error('Import execution failed:', error);
      
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
    console.error('Execute API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Import transactions
async function importTransactions(data: any[], mappings: Record<string, string>, userId: string) {
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
      const transactionData: any = {};
      
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
      const date = new Date(transactionData.date);
      if (isNaN(date.getTime())) {
        results.errors.push(`Row ${i + 1}: Invalid date: ${transactionData.date}`);
        results.errorCount++;
        continue;
      }

      // Find account by name
      const accountName = transactionData.account.toString().toLowerCase();
      const accountId = accountMap.get(accountName);
      if (!accountId) {
        results.errors.push(`Row ${i + 1}: Account '${transactionData.account}' not found`);
        results.errorCount++;
        continue;
      }

      // Find category by name (optional)
      let categoryId = null;
      if (transactionData.category) {
        const categoryName = transactionData.category.toString().toLowerCase();
        categoryId = categoryMap.get(categoryName);
        if (!categoryId) {
          results.errors.push(`Row ${i + 1}: Warning - Category '${transactionData.category}' not found, transaction will be uncategorized`);
        }
      }

      // Determine transaction type based on amount
      const type = amount >= 0 ? 'Income' : 'Expense';
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
async function importAccounts(data: any[], mappings: Record<string, string>, userId: string) {
  const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      const accountData: any = {};
      
      Object.entries(mappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          accountData[dbField] = row[csvColumn];
        }
      });

      // Validate required fields
      if (!accountData.name || !accountData.type || !accountData.currency) {
        results.errors.push(`Row ${i + 1}: Missing required fields (name, type, currency)`);
        results.errorCount++;
        continue;
      }

      // Check if account already exists
      const existingAccount = await Account.findOne({ 
        userId, 
        name: accountData.name 
      });
      
      if (existingAccount) {
        results.errors.push(`Row ${i + 1}: Account '${accountData.name}' already exists`);
        results.errorCount++;
        continue;
      }

      // Parse balance if provided
      let balance = 0;
      if (accountData.balance) {
        balance = parseFloat(accountData.balance.toString()) * 100; // Convert to cents
        if (isNaN(balance)) {
          results.errors.push(`Row ${i + 1}: Invalid balance: ${accountData.balance}`);
          results.errorCount++;
          continue;
        }
      }

      const account = new Account({
        userId,
        name: accountData.name,
        type: accountData.type,
        currency: accountData.currency,
        balance,
      });

      await account.save();
      results.successCount++;

    } catch (error) {
      console.error(`Error importing account row ${i + 1}:`, error);
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.errorCount++;
    }
  }

  return results;
}

// Import categories
async function importCategories(data: any[], mappings: Record<string, string>, userId: string) {
  const results = { successCount: 0, errorCount: 0, errors: [] as string[] };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    
    try {
      const categoryData: any = {};
      
      Object.entries(mappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          categoryData[dbField] = row[csvColumn];
        }
      });

      // Validate required fields
      if (!categoryData.name || !categoryData.type) {
        results.errors.push(`Row ${i + 1}: Missing required fields (name, type)`);
        results.errorCount++;
        continue;
      }

      // Check if category already exists
      const existingCategory = await Category.findOne({ 
        userId, 
        name: categoryData.name 
      });
      
      if (existingCategory) {
        results.errors.push(`Row ${i + 1}: Category '${categoryData.name}' already exists`);
        results.errorCount++;
        continue;
      }

      const category = new Category({
        userId,
        name: categoryData.name,
        type: categoryData.type,
      });

      await category.save();
      results.successCount++;

    } catch (error) {
      console.error(`Error importing category row ${i + 1}:`, error);
      results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      results.errorCount++;
    }
  }

  return results;
} 