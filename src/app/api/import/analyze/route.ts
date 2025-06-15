import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectDB } from '@/lib/db';
import ImportHistory from '@/models/import-history.model';
import { CSVAnalyzer } from '@/lib/ai-csv-analyzer';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const { importId } = await req.json();

    console.log('🔍 AI Analysis started:', {
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
      detectedColumns: importRecord.aiAnalysis?.detectedColumns
    });

    if (importRecord.status !== 'pending') {
      console.error('❌ Import record not in pending status:', { 
        currentStatus: importRecord.status,
        importId 
      });
      return NextResponse.json({ 
        message: 'Import record is not in pending status',
        currentStatus: importRecord.status 
      }, { status: 400 });
    }

    // Update status to analyzing
    importRecord.status = 'analyzing';
    await importRecord.save();

    console.log('🔄 Status updated to analyzing');

    try {
      // Initialize AI analyzer
      const analyzer = new CSVAnalyzer();
      
      console.log('🤖 Starting CSV analysis:', {
        dataRows: importRecord.originalData.length,
        fileName: importRecord.fileName,
        sampleData: importRecord.originalData[0]
      });
      
      // Analyze the CSV data
      const analysisResult = await analyzer.analyzeCSV(
        importRecord.originalData,
        importRecord.fileName
      );

      console.log('✅ AI Analysis completed:', {
        dataType: analysisResult.dataType,
        confidence: analysisResult.confidence,
        columnMappings: analysisResult.columnMappings,
        detectedColumns: analysisResult.detectedColumns,
        suggestions: analysisResult.suggestions,
        warnings: analysisResult.warnings
      });

      // Update import record with analysis results
      importRecord.aiAnalysis = analysisResult;
      importRecord.status = 'ready';
      await importRecord.save();

      console.log('💾 Import record updated with analysis results');

      return NextResponse.json({
        success: true,
        analysis: analysisResult,
        message: 'CSV analysis completed successfully'
      });

    } catch (analysisError) {
      console.error('❌ AI analysis failed:', {
        error: analysisError,
        message: analysisError instanceof Error ? analysisError.message : 'Unknown error',
        stack: analysisError instanceof Error ? analysisError.stack : undefined
      });
      
      // Update status to failed with error
      importRecord.status = 'failed';
      importRecord.importErrors = [
        ...(importRecord.importErrors || []),
        `AI analysis failed: ${analysisError instanceof Error ? analysisError.message : 'Unknown error'}`
      ];
      await importRecord.save();

      return NextResponse.json({
        success: false,
        message: 'AI analysis failed',
        error: analysisError instanceof Error ? analysisError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Analysis API error:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 