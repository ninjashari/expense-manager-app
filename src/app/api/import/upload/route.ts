import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import Papa from 'papaparse';
import { authOptions } from '@/lib/auth-config';
import { connectDB } from '@/lib/db';
import ImportHistory from '@/models/import-history.model';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['text/csv', 'application/vnd.ms-excel'];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await connectDB();

    const formData = await req.formData();
    const file = formData.get('file') as File;

    console.log('🔄 CSV Upload started:', {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type,
      userId: session.user.id
    });

    if (!file) {
      console.error('❌ No file provided in upload request');
      return NextResponse.json({ message: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type) && !file.name.toLowerCase().endsWith('.csv')) {
      console.error('❌ Invalid file type:', { type: file.type, name: file.name });
      return NextResponse.json({ 
        message: 'Invalid file type. Only CSV files are allowed.' 
      }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.error('❌ File too large:', { size: file.size, maxSize: MAX_FILE_SIZE });
      return NextResponse.json({ 
        message: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      }, { status: 400 });
    }

    // Read and parse CSV file
    const fileContent = await file.text();
    console.log('📄 File content preview:', {
      contentLength: fileContent.length,
      firstLines: fileContent.split('\n').slice(0, 3)
    });
    
    return new Promise<NextResponse>((resolve) => {
      Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: async (results) => {
          try {
            console.log('📊 CSV parsing completed:', {
              totalRows: results.data.length,
              headers: results.meta.fields,
              errors: results.errors.length,
              firstRow: results.data[0]
            });

            if (results.errors.length > 0) {
              console.error('❌ CSV parsing errors:', results.errors);
              resolve(NextResponse.json({ 
                message: 'Error parsing CSV file',
                errors: results.errors.map(e => e.message)
              }, { status: 400 }));
              return;
            }

            if (!results.data || results.data.length === 0) {
              console.error('❌ CSV file is empty');
              resolve(NextResponse.json({ 
                message: 'CSV file is empty or contains no valid data' 
              }, { status: 400 }));
              return;
            }

            // Create import history record
            const importRecord = new ImportHistory({
              userId: session.user.id,
              fileName: file.name,
              fileSize: file.size,
              originalData: results.data,
              status: 'pending',
              totalRows: results.data.length,
              previewData: results.data.slice(0, 10), // Store first 10 rows for preview
              aiAnalysis: {
                dataType: 'unknown',
                columnMappings: {},
                confidence: 0,
                suggestions: [],
                warnings: [],
                detectedColumns: results.meta.fields || [],
              }
            });

            await importRecord.save();

            console.log('✅ Import record created:', {
              importId: importRecord._id,
              fileName: file.name,
              totalRows: results.data.length,
              detectedColumns: results.meta.fields
            });

            resolve(NextResponse.json({
              success: true,
              importId: importRecord._id,
              fileName: file.name,
              fileSize: file.size,
              totalRows: results.data.length,
              detectedColumns: results.meta.fields || [],
              previewData: results.data.slice(0, 5), // Return first 5 rows for immediate preview
              message: 'File uploaded and parsed successfully'
            }, { status: 201 }));

          } catch (error) {
            console.error('❌ Error saving import record:', error);
            resolve(NextResponse.json({ 
              message: 'Error processing file' 
            }, { status: 500 }));
          }
        },
        error: (error: Error) => {
          console.error('❌ Papa Parse error:', error);
          resolve(NextResponse.json({ 
            message: 'Error parsing CSV file',
            error: error.message 
          }, { status: 400 }));
        }
      });
    });

  } catch (error) {
    console.error('❌ Upload API error:', error);
    return NextResponse.json({ 
      message: 'Internal server error' 
    }, { status: 500 });
  }
} 