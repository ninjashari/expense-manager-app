/**
 * @file route.ts (categories)
 * @description This file contains the API route for category operations.
 * It provides endpoints for fetching, creating, updating, and deleting categories.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  getCategories, 
  createCategory,
  getActiveCategories
} from '@/lib/services/category-service'

/**
 * GET handler for categories
 * @description Retrieves categories for the authenticated user
 * @returns Response with categories data
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') === 'true'

    const categories = activeOnly 
      ? await getActiveCategories(session.user.id)
      : await getCategories(session.user.id)
    
    return NextResponse.json({ categories }, { status: 200 })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

/**
 * POST handler for creating categories
 * @description Creates a new category for the authenticated user
 * @returns Response with created category data
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const category = await createCategory(body, session.user.id)
    
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Create category API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create category' },
      { status: 500 }
    )
  }
} 