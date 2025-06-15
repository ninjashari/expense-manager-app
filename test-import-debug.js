const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// Test configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'password123';

// Sample CSV files to test
const TEST_FILES = [
  {
    name: 'sample-accounts.csv',
    path: './test-data/sample-accounts.csv',
    expectedType: 'accounts'
  },
  {
    name: 'sample-categories.csv', 
    path: './test-data/sample-categories.csv',
    expectedType: 'categories'
  }
];

async function testImport() {
  console.log('🚀 Starting import debug test...\n');

  // Test each file
  for (const testFile of TEST_FILES) {
    console.log(`\n📁 Testing ${testFile.name} (expected: ${testFile.expectedType})`);
    console.log('='.repeat(60));

    try {
      // Check if file exists
      if (!fs.existsSync(testFile.path)) {
        console.error(`❌ File not found: ${testFile.path}`);
        continue;
      }

      // Read file content
      const fileContent = fs.readFileSync(testFile.path, 'utf8');
      console.log('📄 File content:');
      console.log(fileContent);
      console.log('');

      // Step 1: Upload CSV
      console.log('📤 Step 1: Uploading CSV...');
      const formData = new FormData();
      formData.append('file', fs.createReadStream(testFile.path), {
        filename: testFile.name,
        contentType: 'text/csv'
      });

      const uploadResponse = await fetch(`${BASE_URL}/api/import/upload`, {
        method: 'POST',
        body: formData,
        headers: {
          // Add any auth headers if needed
        }
      });

      const uploadResult = await uploadResponse.json();
      console.log('📤 Upload result:', JSON.stringify(uploadResult, null, 2));

      if (!uploadResult.success) {
        console.error('❌ Upload failed:', uploadResult.message);
        continue;
      }

      const importId = uploadResult.importId;
      console.log(`✅ Upload successful, importId: ${importId}\n`);

      // Step 2: AI Analysis
      console.log('🤖 Step 2: Running AI analysis...');
      const analysisResponse = await fetch(`${BASE_URL}/api/import/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ importId })
      });

      const analysisResult = await analysisResponse.json();
      console.log('🤖 Analysis result:', JSON.stringify(analysisResult, null, 2));

      if (!analysisResult.success) {
        console.error('❌ Analysis failed:', analysisResult.message);
        continue;
      }

      const analysis = analysisResult.analysis;
      console.log(`✅ Analysis successful:`);
      console.log(`   Data Type: ${analysis.dataType}`);
      console.log(`   Confidence: ${analysis.confidence}%`);
      console.log(`   Column Mappings:`, analysis.columnMappings);
      console.log(`   Warnings:`, analysis.warnings);
      console.log('');

      // Step 3: Preview (optional)
      console.log('👁️ Step 3: Generating preview...');
      const previewResponse = await fetch(`${BASE_URL}/api/import/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          importId,
          columnMappings: analysis.columnMappings 
        })
      });

      const previewResult = await previewResponse.json();
      console.log('👁️ Preview result:', JSON.stringify(previewResult, null, 2));

      if (!previewResult.success) {
        console.error('❌ Preview failed:', previewResult.message);
        continue;
      }

      console.log('✅ Preview successful\n');

      // Step 4: Execute Import
      console.log('⚡ Step 4: Executing import...');
      const executeResponse = await fetch(`${BASE_URL}/api/import/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ importId })
      });

      const executeResult = await executeResponse.json();
      console.log('⚡ Execute result:', JSON.stringify(executeResult, null, 2));

      if (executeResult.success) {
        console.log('✅ Import executed successfully!');
        console.log(`   Imported: ${executeResult.results.importedRows} rows`);
        console.log(`   Failed: ${executeResult.results.failedRows} rows`);
        if (executeResult.results.errors.length > 0) {
          console.log(`   Errors:`, executeResult.results.errors);
        }
      } else {
        console.error('❌ Import execution failed:', executeResult.message);
        if (executeResult.error) {
          console.error('   Error details:', executeResult.error);
        }
      }

    } catch (error) {
      console.error(`❌ Test failed for ${testFile.name}:`, error.message);
      console.error('Stack trace:', error.stack);
    }

    console.log('\n' + '='.repeat(60) + '\n');
  }

  console.log('🏁 Import debug test completed!');
}

// Run the test
testImport().catch(error => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
}); 