/**
 * MongoDB Database Connection Module
 * 
 * This module handles MongoDB connection management with optimized settings,
 * connection pooling, error handling, and monitoring capabilities.
 * It implements the singleton pattern to ensure efficient connection reuse.
 */

import mongoose from 'mongoose';

// MongoDB connection URI from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

// Global type declaration for mongoose caching
declare global {
  // eslint-disable-next-line no-var
  var mongoose: {
    conn: mongoose.Connection | null;
    promise: Promise<mongoose.Connection> | null;
  };
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage and ensures optimal performance.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Establishes and manages MongoDB connection with optimized settings
 * @returns Promise<mongoose.Connection> - The MongoDB connection instance
 */
async function dbConnect(): Promise<mongoose.Connection> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection if no promise exists
  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      // Connection pool settings for optimal performance
      maxPoolSize: 10, // Maximum number of connections in the pool
      minPoolSize: 2,  // Minimum number of connections in the pool
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long to wait for a response
      
      // Buffer settings
      bufferCommands: false, // Disable mongoose buffering
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Compression
      compressors: ['zlib'],
      
      // Read preference
      readPreference: 'primary',
      
      // Write concern
      writeConcern: {
        w: 'majority',
        j: true, // Wait for journal acknowledgment
        wtimeout: 10000, // Timeout after 10 seconds
      },
    };

    // Create connection promise with enhanced error handling
    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB connected successfully');
        
        // Set up connection event listeners for monitoring
        const connection = mongoose.connection;
        
        connection.on('error', (error) => {
          console.error('❌ MongoDB connection error:', error);
        });
        
        connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
        });
        
        connection.on('reconnected', () => {
          console.log('🔄 MongoDB reconnected');
        });
        
        // Graceful shutdown handling
        process.on('SIGINT', async () => {
          await connection.close();
          console.log('🛑 MongoDB connection closed due to app termination');
          process.exit(0);
        });
        
        return connection;
      })
      .catch((error) => {
        console.error('❌ MongoDB connection failed:', error);
        // Reset the promise so we can try again
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    // Reset both promise and connection on error
    cached.promise = null;
    cached.conn = null;
    throw error;
  }
}

/**
 * Checks if the database connection is healthy
 * @returns Promise<boolean> - True if connection is healthy
 */
export async function isDbHealthy(): Promise<boolean> {
  try {
    const connection = await dbConnect();
    return connection.readyState === 1; // 1 = connected
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Gets database connection statistics
 * @returns Object containing connection stats
 */
export function getDbStats() {
  if (!cached.conn) {
    return { status: 'disconnected', readyState: 0 };
  }
  
  return {
    status: cached.conn.readyState === 1 ? 'connected' : 'disconnected',
    readyState: cached.conn.readyState,
    host: cached.conn.host,
    port: cached.conn.port,
    name: cached.conn.name,
  };
}

/**
 * Gracefully closes the database connection
 * @returns Promise<void>
 */
export async function closeDbConnection(): Promise<void> {
  if (cached.conn) {
    await cached.conn.close();
    cached.conn = null;
    cached.promise = null;
    console.log('🔌 Database connection closed');
  }
}

// Export the main connection function
export { dbConnect as connectDB }; 