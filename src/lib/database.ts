/**
 * @file database.ts
 * @description This file contains the PostgreSQL database client configuration.
 * It provides the connection to PostgreSQL for all database operations.
 */

// Runtime check to prevent client-side execution
if (typeof window !== 'undefined') {
  throw new Error('Database operations cannot be performed on the client side. Use API routes instead.')
}

import { Pool, PoolClient } from 'pg'

/**
 * Database configuration
 * @description Environment variables for PostgreSQL connection
 */
const databaseUrl = process.env.DATABASE_URL || ''

/**
 * Check if database is properly configured
 * @description Validates that required environment variables are set
 */
const isDatabaseConfigured = databaseUrl && databaseUrl !== 'postgresql://username:password@localhost:5432/expense_manager'

/**
 * PostgreSQL connection pool
 * @description Creates and exports the PostgreSQL pool for use throughout the application
 */
export const pool = isDatabaseConfigured 
  ? new Pool({
      connectionString: databaseUrl,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    })
  : new Pool({
      host: 'localhost',
      port: 5432,
      database: 'expense_manager',
      user: 'postgres',
      password: 'password',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

/**
 * Database query helper function
 * @description Executes a database query with proper error handling and connection management
 * @param query - SQL query string
 * @param params - Query parameters
 * @returns Promise resolving to query result
 */
export async function query<T = unknown>(query: string, params?: unknown[]): Promise<T[]> {
  let client: PoolClient | undefined

  try {
    client = await pool.connect()
    const result = await client.query(query, params)
    return result.rows
  } catch (error) {
    console.error('Database query error:', error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * Database query helper function that returns a single row
 * @description Executes a database query and returns the first row or null
 * @param queryText - SQL query string
 * @param params - Query parameters
 * @returns Promise resolving to single row or null
 */
export async function queryOne<T = unknown>(queryText: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(queryText, params)
  return rows.length > 0 ? rows[0] : null
}

/**
 * Execute a transaction with multiple queries
 * @description Executes multiple queries within a database transaction
 * @param callback - Function containing queries to execute
 * @returns Promise resolving to transaction result
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  let client: PoolClient | undefined

  try {
    client = await pool.connect()
    await client.query('BEGIN')
    
    const result = await callback(client)
    
    await client.query('COMMIT')
    return result
  } catch (error) {
    if (client) {
      await client.query('ROLLBACK')
    }
    console.error('Transaction error:', error)
    throw error
  } finally {
    if (client) {
      client.release()
    }
  }
}

/**
 * Check if database is ready for use
 * @description Returns whether database connection is properly configured
 */
export const isDatabaseReady = () => isDatabaseConfigured

/**
 * Test database connection
 * @description Tests the database connection
 * @returns Promise resolving to connection status
 */
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1 as test')
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

/**
 * Close database connection pool
 * @description Closes all connections in the pool
 */
export async function closePool(): Promise<void> {
  await pool.end()
} 