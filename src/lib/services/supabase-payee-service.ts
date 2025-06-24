/**
 * @file supabase-payee-service.ts
 * @description This file contains the Supabase-based payee service functions.
 * It provides CRUD operations for payees using Supabase database.
 */

import { supabase } from '@/lib/supabase'
import { Payee, PayeeFormData, generatePayeeName } from '@/types/payee'

/**
 * Database row interface for payees table
 * @description Maps to the payees table structure in Supabase
 */
interface PayeeRow {
  id: string
  user_id: string
  name: string
  display_name: string
  description: string | null
  category: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

/**
 * Transform database row to Payee object
 * @description Converts database row format to application Payee interface
 * @param row - Database row from payees table
 * @returns Payee object
 */
function transformRowToPayee(row: PayeeRow): Payee {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    displayName: row.display_name,
    description: row.description || undefined,
    category: row.category || undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  }
}

/**
 * Transform Payee form data to database insert format
 * @description Converts form data to database row format for insertion
 * @param formData - Payee form data
 * @param userId - User ID for the payee
 * @returns Database insert object
 */
function transformFormDataToRow(formData: PayeeFormData, userId: string) {
  const generatedName = generatePayeeName(formData.displayName)
  
  return {
    user_id: userId,
    name: generatedName,
    display_name: formData.displayName,
    description: formData.description || null,
    category: formData.category || null,
    is_active: formData.isActive !== undefined ? formData.isActive : true,
  }
}

/**
 * Get all payees for a user
 * @description Retrieves all payees belonging to the authenticated user from Supabase
 * @param userId - User ID to filter payees
 * @returns Promise resolving to array of payees
 */
export async function getPayees(userId: string): Promise<Payee[]> {
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .eq('user_id', userId)
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching payees:', error)
    throw new Error(`Failed to fetch payees: ${error.message}`)
  }

  return data.map(transformRowToPayee)
}

/**
 * Get active payees for a user
 * @description Retrieves only active payees belonging to the authenticated user
 * @param userId - User ID to filter payees
 * @returns Promise resolving to array of active payees
 */
export async function getActivePayees(userId: string): Promise<Payee[]> {
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching active payees:', error)
    throw new Error(`Failed to fetch active payees: ${error.message}`)
  }

  return data.map(transformRowToPayee)
}

/**
 * Get payees by category
 * @description Retrieves payees filtered by category
 * @param userId - User ID to filter payees
 * @param category - Category to filter by
 * @returns Promise resolving to array of payees in the category
 */
export async function getPayeesByCategory(userId: string, category: string): Promise<Payee[]> {
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('display_name', { ascending: true })

  if (error) {
    console.error('Error fetching payees by category:', error)
    throw new Error(`Failed to fetch payees by category: ${error.message}`)
  }

  return data.map(transformRowToPayee)
}

/**
 * Get payee by ID
 * @description Retrieves a specific payee by its ID from Supabase
 * @param payeeId - Payee ID to retrieve
 * @param userId - User ID for authorization
 * @returns Promise resolving to payee or null if not found
 */
export async function getPayeeById(payeeId: string, userId: string): Promise<Payee | null> {
  const { data, error } = await supabase
    .from('payees')
    .select('*')
    .eq('id', payeeId)
    .eq('user_id', userId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching payee:', error)
    throw new Error(`Failed to fetch payee: ${error.message}`)
  }

  return transformRowToPayee(data)
}

/**
 * Check if payee name already exists for user
 * @description Checks if a generated payee name already exists for the user
 * @param displayName - Display name to check (will be converted to name)
 * @param userId - User ID to check against
 * @param excludeId - Optional payee ID to exclude from check (for updates)
 * @returns Promise resolving to boolean indicating if name exists
 */
export async function payeeNameExists(
  displayName: string, 
  userId: string, 
  excludeId?: string
): Promise<boolean> {
  const generatedName = generatePayeeName(displayName)
  
  let query = supabase
    .from('payees')
    .select('id')
    .eq('user_id', userId)
    .or(`name.eq.${generatedName},display_name.eq.${displayName}`)

  if (excludeId) {
    query = query.neq('id', excludeId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error checking payee name:', error)
    throw new Error(`Failed to check payee name: ${error.message}`)
  }

  return data.length > 0
}

/**
 * Create new payee
 * @description Creates a new payee in Supabase with the provided data
 * @param payeeData - Payee form data
 * @param userId - User ID for the payee owner
 * @returns Promise resolving to the created payee
 */
export async function createPayee(payeeData: PayeeFormData, userId: string): Promise<Payee> {
  // Check if payee with same display name or generated name already exists
  const exists = await payeeNameExists(payeeData.displayName, userId)
  if (exists) {
    throw new Error('A payee with this name already exists')
  }

  const insertData = transformFormDataToRow(payeeData, userId)

  const { data, error } = await supabase
    .from('payees')
    .insert([insertData])
    .select()
    .single()

  if (error) {
    console.error('Error creating payee:', error)
    throw new Error(`Failed to create payee: ${error.message}`)
  }

  return transformRowToPayee(data)
}

/**
 * Update existing payee
 * @description Updates an existing payee in Supabase with new data
 * @param payeeId - ID of payee to update
 * @param payeeData - Updated payee data
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated payee or null if not found
 */
export async function updatePayee(
  payeeId: string, 
  payeeData: PayeeFormData, 
  userId: string
): Promise<Payee | null> {
  // Check if payee with same display name already exists (excluding current payee)
  const exists = await payeeNameExists(payeeData.displayName, userId, payeeId)
  if (exists) {
    throw new Error('A payee with this name already exists')
  }

  const generatedName = generatePayeeName(payeeData.displayName)
  
  const updateData = {
    name: generatedName,
    display_name: payeeData.displayName,
    description: payeeData.description || null,
    category: payeeData.category || null,
    is_active: payeeData.isActive !== undefined ? payeeData.isActive : true,
  }

  const { data, error } = await supabase
    .from('payees')
    .update(updateData)
    .eq('id', payeeId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error updating payee:', error)
    throw new Error(`Failed to update payee: ${error.message}`)
  }

  return transformRowToPayee(data)
}

/**
 * Delete payee
 * @description Deletes a payee from Supabase
 * @param payeeId - ID of payee to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deletePayee(payeeId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('payees')
    .delete()
    .eq('id', payeeId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error deleting payee:', error)
    throw new Error(`Failed to delete payee: ${error.message}`)
  }

  return true
}

/**
 * Toggle payee active status
 * @description Toggles the active status of a payee
 * @param payeeId - ID of payee to toggle
 * @param userId - User ID for authorization
 * @returns Promise resolving to updated payee or null if not found
 */
export async function togglePayeeStatus(payeeId: string, userId: string): Promise<Payee | null> {
  // First get the current payee
  const payee = await getPayeeById(payeeId, userId)
  if (!payee) {
    return null
  }

  // Toggle the active status
  const { data, error } = await supabase
    .from('payees')
    .update({ is_active: !payee.isActive })
    .eq('id', payeeId)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) {
    console.error('Error toggling payee status:', error)
    throw new Error(`Failed to toggle payee status: ${error.message}`)
  }

  return transformRowToPayee(data)
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

/**
 * Import result interface for bulk operations
 * @description Structure for tracking bulk import results
 */
export interface PayeeImportResult {
  displayName: string
  success: boolean
  error?: string
  isDuplicate?: boolean
}

/**
 * Import payees from a list of display names
 * @description Bulk creates payees from an array of display names with progress tracking
 * @param displayNames - Array of payee display names to import
 * @param userId - User ID for payee ownership
 * @param onProgress - Optional callback for progress updates (0-100)
 * @returns Promise resolving to array of import results
 */
export async function importPayeesFromList(
  displayNames: string[],
  userId: string,
  onProgress?: (progress: number) => void
): Promise<PayeeImportResult[]> {
  const results: PayeeImportResult[] = []
  const total = displayNames.length
  
  if (total === 0) {
    return results
  }

  // Process payees in batches to avoid overwhelming the database
  const batchSize = 10
  const batches = []
  
  for (let i = 0; i < displayNames.length; i += batchSize) {
    batches.push(displayNames.slice(i, i + batchSize))
  }

  let processed = 0

  for (const batch of batches) {
    const batchPromises = batch.map(async (displayName) => {
      try {
        // Validate display name
        if (!displayName || displayName.trim().length < 2) {
          return {
            displayName,
            success: false,
            error: 'Display name must be at least 2 characters'
          }
        }

        if (displayName.trim().length > 100) {
          return {
            displayName,
            success: false,
            error: 'Display name must not exceed 100 characters'
          }
        }

        // Check for duplicates
        const exists = await payeeNameExists(displayName.trim(), userId)
        if (exists) {
          return {
            displayName,
            success: false,
            error: 'Payee already exists',
            isDuplicate: true
          }
        }

        // Create the payee
        const payeeData: PayeeFormData = {
          displayName: displayName.trim(),
          isActive: true
        }

        await createPayee(payeeData, userId)
        
        return {
          displayName,
          success: true
        }
      } catch (error) {
        console.error(`Error importing payee "${displayName}":`, error)
        return {
          displayName,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    })

    const batchResults = await Promise.all(batchPromises)
    results.push(...batchResults)
    
    processed += batch.length
    
    // Update progress
    if (onProgress) {
      const progress = Math.round((processed / total) * 100)
      onProgress(progress)
    }
  }

  return results
}

/**
 * Check if multiple payee names exist for user
 * @description Batch checks if payee names already exist for the user
 * @param displayNames - Array of display names to check
 * @param userId - User ID to check against
 * @returns Promise resolving to array of boolean results
 */
export async function checkMultiplePayeeNames(
  displayNames: string[],
  userId: string
): Promise<{ displayName: string; exists: boolean }[]> {
  const results = await Promise.all(
    displayNames.map(async (displayName) => ({
      displayName,
      exists: await payeeNameExists(displayName, userId)
    }))
  )
  
  return results
} 