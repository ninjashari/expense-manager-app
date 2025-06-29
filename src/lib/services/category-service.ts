/**
 * @file category-service.ts
 * @description This file contains the PostgreSQL-based category service functions.
 * It provides CRUD operations for categories using direct PostgreSQL queries.
 */

import { query, queryOne } from '@/lib/database'
import { Category, CategoryFormData, generateCategoryName } from '@/types/category'

/**
 * Database row interface for categories table
 * @description Maps to the categories table structure in PostgreSQL
 */
interface CategoryRow {
  id: string
  user_id: string
  name: string
  display_name: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Transform database row to Category object
 * @description Converts database row format to application Category interface
 * @param row - Database row from categories table
 * @returns Category object
 */
function transformRowToCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    displayName: row.display_name,
    description: row.description || undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Transform Category form data to database insert format
 * @description Converts form data to database row format for insertion
 * @param formData - Category form data
 * @param userId - User ID for the category
 * @returns Database insert object
 */
function transformFormDataToRow(formData: CategoryFormData, userId: string) {
  const generatedName = generateCategoryName(formData.displayName)
  
  return {
    user_id: userId,
    name: generatedName,
    display_name: formData.displayName,
    description: formData.description || null,
    is_active: formData.isActive !== undefined ? formData.isActive : true,
  }
}

/**
 * Get all categories for a user
 * @description Retrieves all categories belonging to the authenticated user
 * @param userId - User ID to filter categories
 * @returns Promise resolving to array of categories
 */
export async function getCategories(userId: string): Promise<Category[]> {
  try {
    const rows = await query<CategoryRow>(`
      SELECT * FROM categories 
      WHERE user_id = $1 
      ORDER BY display_name ASC
    `, [userId])

    return rows.map(transformRowToCategory)
  } catch (error) {
    console.error('Error fetching categories:', error)
    throw new Error(`Failed to fetch categories: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get active categories for a user
 * @description Retrieves only active categories belonging to the authenticated user
 * @param userId - User ID to filter categories
 * @returns Promise resolving to array of active categories
 */
export async function getActiveCategories(userId: string): Promise<Category[]> {
  try {
    const rows = await query<CategoryRow>(`
      SELECT * FROM categories 
      WHERE user_id = $1 AND is_active = true 
      ORDER BY display_name ASC
    `, [userId])

    return rows.map(transformRowToCategory)
  } catch (error) {
    console.error('Error fetching active categories:', error)
    throw new Error(`Failed to fetch active categories: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get category by ID
 * @description Retrieves a specific category by ID and user ID
 * @param categoryId - Category ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to category or null if not found
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
  try {
    const row = await queryOne<CategoryRow>(`
      SELECT * FROM categories 
      WHERE id = $1 AND user_id = $2
    `, [categoryId, userId])

    return row ? transformRowToCategory(row) : null
  } catch (error) {
    console.error('Error fetching category by ID:', error)
    throw new Error(`Failed to fetch category: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if category name exists
 * @description Checks if a category with the given display name or generated name already exists
 * @param displayName - Display name to check
 * @param userId - User ID to scope the check
 * @param excludeId - Optional category ID to exclude from check (for updates)
 * @returns Promise resolving to boolean indicating if name exists
 */
export async function categoryNameExists(displayName: string, userId: string, excludeId?: string): Promise<boolean> {
  try {
    const generatedName = generateCategoryName(displayName)
    
    let sql = `
      SELECT COUNT(*) as count FROM categories 
      WHERE user_id = $1 AND (display_name = $2 OR name = $3)
    `
    const params = [userId, displayName, generatedName]
    
    if (excludeId) {
      sql += ` AND id != $4`
      params.push(excludeId)
    }

    const result = await queryOne<{ count: string }>(sql, params)
    return parseInt(result?.count || '0') > 0
  } catch (error) {
    console.error('Error checking category name:', error)
    throw new Error(`Failed to check category name: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create new category
 * @description Creates a new category with the provided data
 * @param categoryData - Category form data
 * @param userId - User ID for the category owner
 * @returns Promise resolving to the created category
 */
export async function createCategory(categoryData: CategoryFormData, userId: string): Promise<Category> {
  try {
    // Check if category with same display name or generated name already exists
    const exists = await categoryNameExists(categoryData.displayName, userId)
    if (exists) {
      throw new Error('A category with this name already exists')
    }

    const insertData = transformFormDataToRow(categoryData, userId)

    const row = await queryOne<CategoryRow>(`
      INSERT INTO categories (user_id, name, display_name, description, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [
      insertData.user_id,
      insertData.name,
      insertData.display_name,
      insertData.description,
      insertData.is_active
    ])

    if (!row) {
      throw new Error('Failed to create category')
    }

    return transformRowToCategory(row)
  } catch (error) {
    console.error('Error creating category:', error)
    throw new Error(`Failed to create category: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update category
 * @description Updates an existing category with new data
 * @param categoryId - ID of category to update
 * @param categoryData - Updated category form data
 * @param userId - User ID for authorization
 * @returns Promise resolving to the updated category
 */
export async function updateCategory(categoryId: string, categoryData: CategoryFormData, userId: string): Promise<Category> {
  try {
    // Check if category with same display name already exists (excluding current category)
    const exists = await categoryNameExists(categoryData.displayName, userId, categoryId)
    if (exists) {
      throw new Error('A category with this name already exists')
    }

    const updateData = transformFormDataToRow(categoryData, userId)

    const row = await queryOne<CategoryRow>(`
      UPDATE categories 
      SET name = $3, display_name = $4, description = $5, is_active = $6, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [
      categoryId,
      userId,
      updateData.name,
      updateData.display_name,
      updateData.description,
      updateData.is_active
    ])

    if (!row) {
      throw new Error('Category not found or you do not have permission to update it')
    }

    return transformRowToCategory(row)
  } catch (error) {
    console.error('Error updating category:', error)
    throw new Error(`Failed to update category: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete category
 * @description Deletes a category
 * @param categoryId - ID of category to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<boolean> {
  try {
    const result = await query(`
      DELETE FROM categories 
      WHERE id = $1 AND user_id = $2
    `, [categoryId, userId])

    return Array.isArray(result) && result.length > 0
  } catch (error) {
    console.error('Error deleting category:', error)
    throw new Error(`Failed to delete category: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Toggle category active status
 * @description Toggles the active status of a category
 * @param categoryId - ID of category to toggle
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated category
 */
export async function toggleCategoryStatus(categoryId: string, userId: string): Promise<Category> {
  try {
    // First get the current category
    const category = await getCategoryById(categoryId, userId)
    if (!category) {
      throw new Error('Category not found')
    }

    // Toggle the active status
    const row = await queryOne<CategoryRow>(`
      UPDATE categories 
      SET is_active = $1, updated_at = NOW()
      WHERE id = $2 AND user_id = $3
      RETURNING *
    `, [!category.isActive, categoryId, userId])

    if (!row) {
      throw new Error('Failed to toggle category status')
    }

    return transformRowToCategory(row)
  } catch (error) {
    console.error('Error toggling category status:', error)
    throw new Error(`Failed to toggle category status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Bulk import result interface
 * @description Structure for tracking individual import results
 */
interface ImportCategoryResult {
  displayName: string
  success: boolean
  error?: string
  categoryId?: string
}

/**
 * Import categories from list
 * @description Bulk imports categories from an array of display names
 * @param displayNames - Array of category display names to import
 * @param userId - User ID for the categories
 * @param onProgress - Optional progress callback function
 * @returns Promise resolving to array of import results
 */
export async function importCategoriesFromList(
  displayNames: string[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<ImportCategoryResult[]> {
  const results: ImportCategoryResult[] = []
  const total = displayNames.length

  for (let i = 0; i < displayNames.length; i++) {
    const displayName = displayNames[i].trim()
    
    try {
      // Check if category already exists
      const exists = await categoryNameExists(displayName, userId)
      if (exists) {
        results.push({
          displayName,
          success: false,
          error: 'Category already exists'
        })
      } else {
        // Create the category
        const category = await createCategory(
          { displayName, isActive: true },
          userId
        )
        results.push({
          displayName,
          success: true,
          categoryId: category.id
        })
      }
    } catch (error) {
      results.push({
        displayName,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Update progress
    if (onProgress) {
      const progress = ((i + 1) / total) * 100
      onProgress(progress)
    }

    // Add small delay to prevent overwhelming the database
    if (i < displayNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  return results
} 