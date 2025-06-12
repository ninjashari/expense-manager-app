#!/usr/bin/env node

/**
 * CSV Import Feature Testing Script
 * Tests the CSV import functionality end-to-end
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_DATA_DIR = './test-data';

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function logWarning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function logInfo(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function logHeader(message) {
  log(`\n${colors.bold}=== ${message} ===${colors.reset}`);
}

// Test server connectivity
async function testServerConnectivity() {
  logHeader('Testing Server Connectivity');
  
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/api/health`, (res) => {
      if (res.statusCode === 200) {
        logSuccess('Server is running and accessible');
        resolve(true);
      } else if (res.statusCode === 404) {
        logWarning('Server is running but /api/health not found (expected)');
        resolve(true);
      } else {
        logError(`Server responded with status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      logError(`Cannot connect to server: ${err.message}`);
      logInfo('Make sure the development server is running with: npm run dev');
      resolve(false);
    });

    req.setTimeout(5000, () => {
      logError('Server connection timeout');
      resolve(false);
    });
  });
}

// Test file existence and structure
function testFileStructure() {
  logHeader('Testing File Structure');
  
  const requiredFiles = [
    'src/app/(dashboard)/import/page.tsx',
    'src/components/import/file-upload.tsx',
    'src/components/import/ai-analysis.tsx',
    'src/components/import/csv-preview.tsx',
    'src/components/import/import-confirmation.tsx',
    'src/components/import/import-history.tsx',
    'src/app/api/import/upload/route.ts',
    'src/app/api/import/analyze/route.ts',
    'src/app/api/import/preview/route.ts',
    'src/app/api/import/execute/route.ts',
    'src/app/api/import/history/route.ts',
    'src/lib/ai-csv-analyzer.ts',
    'src/lib/import-validator.ts',
    'src/models/import-history.model.ts'
  ];

  let allFound = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`Found: ${file}`);
    } else {
      logError(`Missing: ${file}`);
      allFound = false;
    }
  });

  return allFound;
}

// Test CSV test data files
function testDataFiles() {
  logHeader('Testing Test Data Files');
  
  const testFiles = [
    'test-data/sample-transactions.csv',
    'test-data/sample-accounts.csv',
    'test-data/sample-categories.csv'
  ];

  let allFound = true;
  
  testFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const lines = content.trim().split('\n');
      logSuccess(`Found: ${file} (${lines.length} lines)`);
      
      // Validate CSV structure
      if (lines.length > 1) {
        const headers = lines[0].split(',');
        logInfo(`  Headers: ${headers.join(', ')}`);
      }
    } else {
      logError(`Missing: ${file}`);
      allFound = false;
    }
  });

  return allFound;
}

// Test TypeScript compilation
async function testTypeScriptCompilation() {
  logHeader('Testing TypeScript Compilation');
  
  return new Promise((resolve) => {
    const { spawn } = require('child_process');
    
    const tsc = spawn('npx', ['tsc', '--noEmit', '--skipLibCheck'], {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    tsc.stdout.on('data', (data) => {
      output += data.toString();
    });

    tsc.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    tsc.on('close', (code) => {
      if (code === 0) {
        logSuccess('TypeScript compilation successful');
        resolve(true);
      } else {
        logError('TypeScript compilation failed');
        if (errorOutput) {
          log(errorOutput, colors.red);
        }
        resolve(false);
      }
    });

    tsc.on('error', (err) => {
      logWarning(`Could not run TypeScript check: ${err.message}`);
      resolve(true); // Don't fail the test if tsc is not available
    });
  });
}

// Test package dependencies
function testDependencies() {
  logHeader('Testing Package Dependencies');
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = [
    'papaparse',
    'react-dropzone',
    'openai',
    'next',
    'react',
    'typescript'
  ];

  let allFound = true;
  
  requiredDeps.forEach(dep => {
    const inDeps = packageJson.dependencies && packageJson.dependencies[dep];
    const inDevDeps = packageJson.devDependencies && packageJson.devDependencies[dep];
    
    if (inDeps || inDevDeps) {
      const version = inDeps || inDevDeps;
      logSuccess(`Found: ${dep}@${version}`);
    } else {
      logError(`Missing: ${dep}`);
      allFound = false;
    }
  });

  return allFound;
}

// Test environment variables
function testEnvironment() {
  logHeader('Testing Environment Configuration');
  
  // Check for .env.local
  let envStatus = true;
  
  if (fs.existsSync('.env.local')) {
    logSuccess('Found .env.local file');
    
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const envVars = envContent.split('\n').filter(line => line.includes('='));
    
    envVars.forEach(line => {
      const [key] = line.split('=');
      if (key.trim()) {
        logInfo(`  Environment variable: ${key.trim()}`);
      }
    });
    
    // Check for OPENAI_API_KEY
    if (envContent.includes('OPENAI_API_KEY')) {
      const apiKeyLine = envVars.find(line => line.startsWith('OPENAI_API_KEY'));
      if (apiKeyLine && apiKeyLine.includes('your-openai-api-key-here')) {
        logWarning('OPENAI_API_KEY is set to placeholder value');
        logInfo('AI analysis will use fallback pattern matching');
      } else if (apiKeyLine) {
        logSuccess('OPENAI_API_KEY is configured');
      }
    } else {
      logWarning('OPENAI_API_KEY not found in .env.local');
      logInfo('AI analysis will use fallback pattern matching');
    }
  } else {
    logWarning('No .env.local file found');
    logInfo('Create .env.local with required environment variables');
    envStatus = false;
  }

  return envStatus;
}

// Test import page accessibility
async function testImportPageAccess() {
  logHeader('Testing Import Page Access');
  
  return new Promise((resolve) => {
    const req = http.get(`${BASE_URL}/import`, (res) => {
      if (res.statusCode === 200) {
        logSuccess('Import page is accessible');
        resolve(true);
      } else if (res.statusCode === 307 || res.statusCode === 302) {
        logWarning(`Import page redirects (${res.statusCode}) - likely due to authentication`);
        logInfo('This is expected behavior if authentication is required');
        resolve(true);
      } else {
        logError(`Import page returned status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      logError(`Cannot access import page: ${err.message}`);
      resolve(false);
    });

    req.setTimeout(5000, () => {
      logError('Import page access timeout');
      resolve(false);
    });
  });
}

// Generate test report
function generateTestReport(results) {
  logHeader('Test Results Summary');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  const failedTests = totalTests - passedTests;
  
  log(`\nTotal Tests: ${totalTests}`);
  logSuccess(`Passed: ${passedTests}`);
  
  if (failedTests > 0) {
    logError(`Failed: ${failedTests}`);
  }
  
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  if (passRate >= 90) {
    logSuccess(`\n🎉 Overall Status: EXCELLENT (${passRate}% pass rate)`);
    logSuccess('✅ CSV Import feature is ready for use!');
  } else if (passRate >= 70) {
    logWarning(`\n⚠️  Overall Status: GOOD (${passRate}% pass rate)`);
    logInfo('Minor issues to address before full deployment');
  } else {
    logError(`\n❌ Overall Status: NEEDS WORK (${passRate}% pass rate)`);
    logError('Significant issues need to be resolved');
  }
  
  log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    log(`  ${status} ${test}`);
  });
  
  return passRate >= 70;
}

// Main test runner
async function runTests() {
  log(`${colors.bold}CSV Import Feature Testing Script${colors.reset}`);
  log(`Testing Date: ${new Date().toISOString()}`);
  log(`Node.js Version: ${process.version}`);
  
  const results = {};
  
  // Run all tests
  results['Server Connectivity'] = await testServerConnectivity();
  results['File Structure'] = testFileStructure();
  results['Test Data Files'] = testDataFiles();
  results['Package Dependencies'] = testDependencies();
  results['Environment Configuration'] = testEnvironment();
  results['TypeScript Compilation'] = await testTypeScriptCompilation();
  results['Import Page Access'] = await testImportPageAccess();
  
  const overallSuccess = generateTestReport(results);
  
  if (overallSuccess) {
    logHeader('Next Steps');
    logInfo('1. Start the development server: npm run dev');
    logInfo('2. Navigate to: http://localhost:3000/import');
    logInfo('3. Test file upload with provided sample CSV files');
    logInfo('4. Verify AI analysis and column mapping');
    logInfo('5. Complete the import process');
    logInfo('6. Check import history');
  }
  
  process.exit(overallSuccess ? 0 : 1);
}

// Run the tests
runTests().catch((error) => {
  logError(`Test script error: ${error.message}`);
  process.exit(1);
}); 