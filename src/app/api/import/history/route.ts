import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { connectDB } from '@/lib/db';
import ImportHistory from '@/models/import-history.model';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    // Build query
    const query: any = { userId: session.user.id };
    if (status) {
      query.status = status;
    }

    // Get total count for pagination
    const totalCount = await ImportHistory.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limit);

    // Get import history with pagination
    const imports = await ImportHistory.find(query)
      .select({
        fileName: 1,
        status: 1,
        totalRows: 1,
        importedRows: 1,
        failedRows: 1,
        createdAt: 1,
        completedAt: 1,
        'aiAnalysis.dataType': 1,
        'aiAnalysis.confidence': 1,
        importErrors: 1
      })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: {
        imports,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('History API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

    // Find and delete the import record
    const importRecord = await ImportHistory.findOneAndDelete({
      _id: importId,
      userId: session.user.id
    });

    if (!importRecord) {
      return NextResponse.json({ message: 'Import record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Import record deleted successfully'
    });

  } catch (error) {
    console.error('Delete import history error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
}

// Get detailed information about a specific import
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

    const importRecord = await ImportHistory.findOne({
      _id: importId,
      userId: session.user.id
    });

    if (!importRecord) {
      return NextResponse.json({ message: 'Import record not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: importRecord._id,
        fileName: importRecord.fileName,
        fileSize: importRecord.fileSize,
        status: importRecord.status,
        totalRows: importRecord.totalRows,
        importedRows: importRecord.importedRows,
        failedRows: importRecord.failedRows,
        createdAt: importRecord.createdAt,
        completedAt: importRecord.completedAt,
        aiAnalysis: importRecord.aiAnalysis,
        userConfirmedMappings: importRecord.userConfirmedMappings,
        importErrors: importRecord.importErrors,
        previewData: importRecord.previewData.slice(0, 5) // Only return first 5 rows for preview
      }
    });

  } catch (error) {
    console.error('Get import details error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 