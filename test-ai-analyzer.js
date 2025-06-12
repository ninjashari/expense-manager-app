// Test script to demonstrate the new AI CSV analyzer
// This works without any API keys using enhanced pattern matching

const { CSVAnalyzer } = require('./src/lib/ai-csv-analyzer.ts');

// Sample CSV data for testing
const sampleTransactionData = [
  {
    'Date': '2024-01-15',
    'Amount': '25.50',
    'Description': 'Coffee Shop',
    'Account': 'Checking',
    'Category': 'Food & Dining'
  },
  {
    'Date': '2024-01-16',
    'Amount': '1200.00',
    'Description': 'Salary',
    'Account': 'Checking',
    'Category': 'Income'
  }
];

const sampleAccountData = [
  {
    'Account Name': 'Main Checking',
    'Account Type': 'Checking',
    'Currency': 'USD',
    'Balance': '5000.00'
  },
  {
    'Account Name': 'Savings Account',
    'Account Type': 'Savings',
    'Currency': 'USD',
    'Balance': '15000.00'
  }
];

async function testAnalyzer() {
  console.log('🧪 Testing AI CSV Analyzer (No API Keys Required)\n');
  
  const analyzer = new CSVAnalyzer();
  
  // Test transaction data
  console.log('📊 Testing Transaction Data:');
  console.log('Sample data:', JSON.stringify(sampleTransactionData[0], null, 2));
  
  const transactionResult = await analyzer.analyzeCSV(sampleTransactionData, 'transactions.csv');
  console.log('\n✅ Analysis Result:');
  console.log(`Data Type: ${transactionResult.dataType}`);
  console.log(`Confidence: ${transactionResult.confidence}%`);
  console.log('Column Mappings:', transactionResult.columnMappings);
  console.log('Suggestions:', transactionResult.suggestions);
  console.log('Warnings:', transactionResult.warnings);
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Test account data
  console.log('🏦 Testing Account Data:');
  console.log('Sample data:', JSON.stringify(sampleAccountData[0], null, 2));
  
  const accountResult = await analyzer.analyzeCSV(sampleAccountData, 'accounts.csv');
  console.log('\n✅ Analysis Result:');
  console.log(`Data Type: ${accountResult.dataType}`);
  console.log(`Confidence: ${accountResult.confidence}%`);
  console.log('Column Mappings:', accountResult.columnMappings);
  console.log('Suggestions:', accountResult.suggestions);
  console.log('Warnings:', accountResult.warnings);
  
  console.log('\n🎉 Test completed! The analyzer works without any API keys.');
  console.log('💡 For enhanced AI analysis, you can optionally add a Hugging Face API key.');
}

// Run the test
testAnalyzer().catch(console.error); 