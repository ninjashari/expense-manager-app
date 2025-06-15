import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectDB } from '@/lib/db';
import ImportHistory from '@/models/import-history.model';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const { importId, columnMappings } = await req.json();

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
        message: 'Import record is not ready for preview',
        currentStatus: importRecord.status 
      }, { status: 400 });
    }

    // Update user-confirmed mappings if provided
    if (columnMappings) {
      importRecord.userConfirmedMappings = columnMappings;
      await importRecord.save();
    }

    // Use user mappings if available, otherwise fall back to AI mappings
    const finalMappings = importRecord.userConfirmedMappings || importRecord.aiAnalysis.columnMappings;

    // Generate preview data with mapped fields
    const previewData = importRecord.originalData.slice(0, 10).map((row: Record<string, unknown>) => {
      const mappedRow: Record<string, unknown> = {};
      
      // Apply column mappings
      Object.entries(finalMappings).forEach(([csvColumn, dbField]) => {
        if (row[csvColumn] !== undefined) {
          mappedRow[dbField as string] = row[csvColumn];
        }
      });

      // Keep original data for comparison
      mappedRow._original = row;
      
      return mappedRow;
    });

    // Validate the mapped data
    const validationResults = validateMappedData(previewData, importRecord.aiAnalysis.dataType);

    return NextResponse.json({
      success: true,
      preview: {
        mappedData: previewData,
        columnMappings: finalMappings,
        validation: validationResults,
        totalRows: importRecord.totalRows,
        dataType: importRecord.aiAnalysis.dataType,
        fileName: importRecord.fileName
      }
    });

  } catch (error) {
    console.error('Preview API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const importId = searchParams.get('importId');

    if (!importId) {
      return NextResponse.json({ message: 'Import ID is required' }, { status: 400 });
    }

    const importRecord = await ImportHistory.findOne({
      _id: importId,
      userId: session.user.id
    });

    if (!importRecord) {
      return NextResponse.json({ message: 'Import record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      importRecord: {
        _id: importRecord._id,
        fileName: importRecord.fileName,
        status: importRecord.status,
        totalRows: importRecord.totalRows,
        aiAnalysis: importRecord.aiAnalysis,
        userConfirmedMappings: importRecord.userConfirmedMappings,
        previewData: importRecord.previewData
      }
    });

  } catch (error) {
    console.error('Preview GET API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Validation helper function
function validateMappedData(data: Record<string, unknown>[], dataType: string) {
  const results = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    stats: {
      validRows: 0,
      invalidRows: 0,
      missingRequired: 0
    }
  };

  if (dataType === 'transactions') {
    const requiredFields = ['date', 'amount', 'payee', 'account'];
    
    data.forEach((row, index) => {
      let rowValid = true;
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          results.errors.push(`Row ${index + 1}: Missing required field '${field}'`);
          results.stats.missingRequired++;
          rowValid = false;
        }
      });

      // Validate amount is numeric
      if (row.amount && isNaN(parseFloat(row.amount.toString()))) {
        results.errors.push(`Row ${index + 1}: Amount '${row.amount}' is not a valid number`);
        rowValid = false;
      }

      // Validate date format
      if (row.date && isNaN(Date.parse(row.date.toString()))) {
        results.warnings.push(`Row ${index + 1}: Date '${row.date}' may not be in a standard format`);
      }

      if (rowValid) {
        results.stats.validRows++;
      } else {
        results.stats.invalidRows++;
        results.isValid = false;
      }
    });
  } else if (dataType === 'accounts') {
    const requiredFields = ['name', 'type', 'currency'];
    const validAccountTypes = ['Checking', 'Savings', 'Credit Card', 'Cash', 'Investment'];
    
    data.forEach((row, index) => {
      let rowValid = true;
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          results.errors.push(`Row ${index + 1}: Missing required field '${field}'`);
          results.stats.missingRequired++;
          rowValid = false;
        }
      });

      // Validate account type
      if (row.type) {
        const typeStr = row.type.toString().toLowerCase().trim();
        const isValidType = validAccountTypes.some(validType => 
          validType.toLowerCase() === typeStr || 
          typeStr.includes(validType.toLowerCase().split(' ')[0])
        );
        if (!isValidType) {
          results.warnings.push(`Row ${index + 1}: Account type '${row.type}' will be normalized. Valid types: ${validAccountTypes.join(', ')}`);
        }
      }

      // Validate balance is numeric if provided
      if (row.balance && row.balance.toString().trim() !== '' && isNaN(parseFloat(row.balance.toString()))) {
        results.errors.push(`Row ${index + 1}: Balance '${row.balance}' is not a valid number`);
        rowValid = false;
      }

      if (rowValid) {
        results.stats.validRows++;
      } else {
        results.stats.invalidRows++;
        results.isValid = false;
      }
    });
  } else if (dataType === 'categories') {
    const requiredFields = ['name', 'type'];
    const validCategoryTypes = ['Income', 'Expense'];
    
    data.forEach((row, index) => {
      let rowValid = true;
      
      // Check required fields
      requiredFields.forEach(field => {
        if (!row[field] || row[field].toString().trim() === '') {
          results.errors.push(`Row ${index + 1}: Missing required field '${field}'`);
          results.stats.missingRequired++;
          rowValid = false;
        }
      });

      // Validate category type
      if (row.type) {
        const typeStr = row.type.toString().toLowerCase().trim();
        const isValidType = validCategoryTypes.some(validType => 
          validType.toLowerCase() === typeStr || typeStr.includes(validType.toLowerCase())
        );
        if (!isValidType) {
          results.warnings.push(`Row ${index + 1}: Category type '${row.type}' will be normalized. Valid types: ${validCategoryTypes.join(', ')}`);
        }
      }

      if (rowValid) {
        results.stats.validRows++;
      } else {
        results.stats.invalidRows++;
        results.isValid = false;
      }
    });
  }

  return results;
} 