/**
 * @file setup-database.js
 * @description This script sets up the PostgreSQL database by running the schema file.
 * It creates all necessary tables, indexes, functions, and triggers.
 */
const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

/**
 * Database configuration
 * @description Load database configuration from environment variables
 */
require('dotenv').config({ path: '.env.local' })

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL environment variable is required')
  console.error('Please set DATABASE_URL in your .env.local file')
  console.error('Expected format: postgresql://username:password@localhost:5432/database_name')
  process.exit(1)
}

console.log('🔗 Using DATABASE_URL:', databaseUrl.replace(/:[^:@]*@/, ':****@'))
console.log('🔍 Raw DATABASE_URL length:', databaseUrl.length)
console.log('🔍 Raw DATABASE_URL starts with:', databaseUrl.substring(0, 20))

// Validate URL format
try {
  const url = new URL(databaseUrl)
  if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') {
    throw new Error('DATABASE_URL must use postgresql:// or postgres:// protocol')
  }
} catch (error) {
  console.error('❌ Invalid DATABASE_URL format:', error.message)
  console.error('Expected format: postgresql://username:password@localhost:5432/database_name')
  process.exit(1)
}

/**
 * Create database connection pool
 */
const pool = new Pool({
  connectionString: databaseUrl,
})

/**
 * Setup database schema
 * @description Reads and executes the SQL schema file
 */
async function setupDatabase() {
  try {
    console.log('🚀 Setting up database...')

    // Read the schema file
    const schemaPath = path.join(__dirname, '..', 'src', 'lib', 'database-schema-local.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    // Execute the schema
    await pool.query(schema)

    console.log('✅ Database schema created successfully!')
    console.log('📊 Tables created:')
    console.log('   - users (authentication)')
    console.log('   - accounts (financial accounts)')
    console.log('   - categories (transaction categories)')
    console.log('   - payees (transaction payees)')
    console.log('   - transactions (financial transactions)')
    console.log('   - credit_card_bills (credit card billing)')
    console.log('')
    console.log('🔧 Functions and triggers created for automatic balance calculation')
    console.log('')
    console.log('🎉 Database setup complete! You can now start the application.')

  } catch (error) {
    console.error('❌ Error setting up database:', error.message)
    console.error('')
    console.error('💡 Common solutions:')
    console.error('   1. Make sure PostgreSQL is running')
    console.error('   2. Verify your DATABASE_URL is correct')
    console.error('   3. Ensure the database exists')
    console.error('   4. Check user permissions')
    process.exit(1)
  } finally {
    await pool.end()
  }
}

/**
 * Test database connection
 * @description Tests the database connection before setup
 */
async function testConnection() {
  try {
    console.log('🔍 Testing database connection...')
    await pool.query('SELECT 1')
    console.log('✅ Database connection successful')
    return true
  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }
}

/**
 * Main function
 * @description Executes the database setup process
 */
async function main() {
  console.log('===============================================')
  console.log('📦 Expense Manager Database Setup')
  console.log('===============================================')
  console.log('')

  // Test connection first
  const connectionOk = await testConnection()
  if (!connectionOk) {
    process.exit(1)
  }

  // Setup database
  await setupDatabase()
}

// Run the script
main().catch(console.error) 