/**
 * @file supabase-category-service.ts
 * @description This file contains the Supabase-based category service functions.
 * It provides CRUD operations for categories using Supabase database.
 */

import { supabase } from '@/lib/supabase'
import { Category, CategoryFormData, generateCategoryName } from '@/types/category'

/**
 * Database row interface for categories table
 * @description Maps to the categories table structure in Supabase
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
 * @description Retrieves all categories belonging to the authenticated user from Supabase
 * @param userId - User ID to filter categories
 * @returns Promise resolving to array of categories
 */
export async function getCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching categories:', error)
    throw new Error(`Failed to fetch categories: ${error.message}`)
  }

  return data.map(transformRowToCategory)
}

/**
 * Get active categories for a user
 * @description Retrieves only active categories belonging to the authenticated user
 * @param userId - User ID to filter categories
 * @returns Promise resolving to array of active categories
 */
export async function getActiveCategories(userId: string): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching active categories:', error)
    throw new Error(`Failed to fetch active categories: ${error.message}`)
  }

  return data.map(transformRowToCategory)
}

/**
 * Get category by ID
 * @description Retrieves a specific category by its ID from Supabase
 * @param categoryId - Category ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to category or null if not found
 */
export async function getCategoryById(categoryId: string, userId: string): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', categoryId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching category:', error)
    throw new Error(`Failed to fetch category: ${error.message}`)
  }

  return transformRowToCategory(data)
}

/**
 * Check if category name already exists for user
 * @description Checks if a generated category name already exists for the user
 * @param displayName - Display name to check (will be converted to name)
 * @param userId - User ID to check against
 * @param excludeId - Optional category ID to exclude from check (for updates)
 * @returns Promise resolving to boolean indicating if name exists
 */
export async function categoryNameExists(
  displayName: string, 
  userId: string, 
  excludeId?: string
): Promise<boolean> {
  const generatedName = generateCategoryName(displayName)
  
  let query = supabase
    .from('categories')
    .select('id')
    .eq('user_id', userId)
    .or(`name.eq.${generatedName},display_name.eq.${displayName}`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking category name:', error)
    throw new Error(`Failed to check category name: ${error.message}`)
  }

  return data.length > 0
}

/**
 * Create new category
 * @description Creates a new category in Supabase with the provided data
 * @param categoryData - Category form data
 * @param userId - User ID for the category owner
 * @returns Promise resolving to the created category
 */
export async function createCategory(categoryData: CategoryFormData, userId: string): Promise<Category> {
  // Check if category with same display name or generated name already exists
  const exists = await categoryNameExists(categoryData.displayName, userId)
  if (exists) {
    throw new Error('A category with this name already exists')
  }

  const insertData = transformFormDataToRow(categoryData, userId)

  const { data, error } = await supabase
    .from('categories')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('Error creating category:', error)
    throw new Error(`Failed to create category: ${error.message}`)
  }

  return transformRowToCategory(data)
}

/**
 * Update existing category
 * @description Updates an existing category in Supabase with new data
 * @param categoryId - ID of category to update
 * @param categoryData - Updated category data
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated category or null if not found
 */
export async function updateCategory(
  categoryId: string, 
  categoryData: CategoryFormData, 
  userId: string
): Promise<Category | null> {
  // Check if category with same display name already exists (excluding current category)
  const exists = await categoryNameExists(categoryData.displayName, userId, categoryId)
  if (exists) {
    throw new Error('A category with this name already exists')
  }

  const generatedName = generateCategoryName(categoryData.displayName)
  
  const updateData = {
    name: generatedName,
    display_name: categoryData.displayName,
    description: categoryData.description || null,
    is_active: categoryData.isActive !== undefined ? categoryData.isActive : true,
  }

  const { data, error } = await supabase
    .from('categories')
    .update(updateData)
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error updating category:', error)
    throw new Error(`Failed to update category: ${error.message}`)
  }

  return transformRowToCategory(data)
}

/**
 * Delete category
 * @description Deletes a category from Supabase
 * @param categoryId - ID of category to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deleteCategory(categoryId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting category:', error)
    throw new Error(`Failed to delete category: ${error.message}`)
  }

  return true
}

/**
 * Toggle category active status
 * @description Toggles the active status of a category
 * @param categoryId - ID of category to toggle
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated category or null if not found
 */
export async function toggleCategoryStatus(categoryId: string, userId: string): Promise<Category | null> {
  // First get the current category
  const category = await getCategoryById(categoryId, userId)
  if (!category) {
    return null
  }

  // Toggle the active status
  const { data, error } = await supabase
    .from('categories')
    .update({ is_active: !category.isActive })
    .eq('id', categoryId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling category status:', error)
    throw new Error(`Failed to toggle category status: ${error.message}`)
  }

  return transformRowToCategory(data)
}

/**
 * Get current user ID from Supabase auth
 * @description Retrieves the current authenticated user's ID
 * @returns Promise resolving to user ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id || null
} 