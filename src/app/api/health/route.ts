/**
 * @file route.ts (health)
 * @description This file contains the API route for health checks.
 * It verifies database connectivity and system readiness.
 */
import { NextResponse } from 'next/server'
import { testConnection } from '@/lib/database'

/**
 * GET handler for health check
 * @description Checks database connectivity and system health
 * @param request - Next.js request object
 * @returns Response with health status
 */
export async function GET() {
  try {
    // Test database connection
    const dbReady = await testConnection()
    
    const health = {
      status: dbReady ? 'healthy' : 'unhealthy',
      database: dbReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(health, { 
      status: dbReady ? 200 : 503 
    })
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 })
  }
} 