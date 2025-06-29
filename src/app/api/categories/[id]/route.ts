/**
 * @file route.ts (categories/[id])
 * @description This file contains the API route for individual category operations.
 * It provides endpoints for updating, deleting, and toggling category status.
 */
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { 
  updateCategory, 
  deleteCategory,
  toggleCategoryStatus
} from '@/lib/services/category-service'

/**
 * PUT handler for updating categories
 * @description Updates an existing category
 * @param request - Request object
 * @param params - Route parameters containing category ID
 * @returns Response with updated category data
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const category = await updateCategory(id, body, session.user.id)
    
    return NextResponse.json({ category }, { status: 200 })
  } catch (error) {
    console.error('Update category API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update category' },
      { status: 500 }
    )
  }
}

/**
 * DELETE handler for categories
 * @description Deletes a category
 * @param request - Request object
 * @param params - Route parameters containing category ID
 * @returns Response confirming deletion
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    await deleteCategory(id, session.user.id)
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Delete category API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete category' },
      { status: 500 }
    )
  }
}

/**
 * PATCH handler for toggling category status
 * @description Toggles the active status of a category
 * @param request - Request object
 * @param params - Route parameters containing category ID
 * @returns Response with updated category data
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params
    const category = await toggleCategoryStatus(id, session.user.id)
    
    return NextResponse.json({ category }, { status: 200 })
  } catch (error) {
    console.error('Toggle category status API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to toggle category status' },
      { status: 500 }
    )
  }
} 