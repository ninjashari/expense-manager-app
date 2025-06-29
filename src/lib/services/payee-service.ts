/**
 * @file payee-service.ts
 * @description This file contains the PostgreSQL-based payee service functions.
 * It provides CRUD operations for payees using direct PostgreSQL queries.
 */

import { query, queryOne } from '@/lib/database'
import { Payee, PayeeFormData, generatePayeeName } from '@/types/payee'

/**
 * Database row interface for payees table
 * @description Maps to the payees table structure in PostgreSQL
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
 * @description Retrieves all payees belonging to the authenticated user
 * @param userId - User ID to filter payees
 * @returns Promise resolving to array of payees
 */
export async function getPayees(userId: string): Promise<Payee[]> {
  try {
    const rows = await query<PayeeRow>(`
      SELECT * FROM payees 
      WHERE user_id = $1 
      ORDER BY display_name ASC
    `, [userId])

    return rows.map(transformRowToPayee)
  } catch (error) {
    console.error('Error fetching payees:', error)
    throw new Error(`Failed to fetch payees: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get active payees for a user
 * @description Retrieves only active payees belonging to the authenticated user
 * @param userId - User ID to filter payees
 * @returns Promise resolving to array of active payees
 */
export async function getActivePayees(userId: string): Promise<Payee[]> {
  try {
    const rows = await query<PayeeRow>(`
      SELECT * FROM payees 
      WHERE user_id = $1 AND is_active = true 
      ORDER BY display_name ASC
    `, [userId])

    return rows.map(transformRowToPayee)
  } catch (error) {
    console.error('Error fetching active payees:', error)
    throw new Error(`Failed to fetch active payees: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Get payee by ID
 * @description Retrieves a specific payee by ID and user ID
 * @param payeeId - Payee ID
 * @param userId - User ID for authorization
 * @returns Promise resolving to payee or null if not found
 */
export async function getPayeeById(payeeId: string, userId: string): Promise<Payee | null> {
  try {
    const row = await queryOne<PayeeRow>(`
      SELECT * FROM payees 
      WHERE id = $1 AND user_id = $2
    `, [payeeId, userId])

    return row ? transformRowToPayee(row) : null
  } catch (error) {
    console.error('Error fetching payee by ID:', error)
    throw new Error(`Failed to fetch payee: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Check if payee name exists
 * @description Checks if a payee with the given display name or generated name already exists
 * @param displayName - Display name to check
 * @param userId - User ID to scope the check
 * @param excludeId - Optional payee ID to exclude from check (for updates)
 * @returns Promise resolving to boolean indicating if name exists
 */
export async function payeeNameExists(displayName: string, userId: string, excludeId?: string): Promise<boolean> {
  try {
    const generatedName = generatePayeeName(displayName)
    
    let sql = `
      SELECT COUNT(*) as count FROM payees 
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
    console.error('Error checking payee name:', error)
    throw new Error(`Failed to check payee name: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create new payee
 * @description Creates a new payee with the provided data
 * @param payeeData - Payee form data
 * @param userId - User ID for the payee owner
 * @returns Promise resolving to the created payee
 */
export async function createPayee(payeeData: PayeeFormData, userId: string): Promise<Payee> {
  try {
    // Check if payee with same display name or generated name already exists
    const exists = await payeeNameExists(payeeData.displayName, userId)
    if (exists) {
      throw new Error('A payee with this name already exists')
    }

    const insertData = transformFormDataToRow(payeeData, userId)

    const row = await queryOne<PayeeRow>(`
      INSERT INTO payees (user_id, name, display_name, description, category, is_active, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [
      insertData.user_id,
      insertData.name,
      insertData.display_name,
      insertData.description,
      insertData.category,
      insertData.is_active
    ])

    if (!row) {
      throw new Error('Failed to create payee')
    }

    return transformRowToPayee(row)
  } catch (error) {
    console.error('Error creating payee:', error)
    throw new Error(`Failed to create payee: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update payee
 * @description Updates an existing payee with new data
 * @param payeeId - ID of payee to update
 * @param payeeData - Updated payee form data
 * @param userId - User ID for authorization
 * @returns Promise resolving to the updated payee
 */
export async function updatePayee(payeeId: string, payeeData: PayeeFormData, userId: string): Promise<Payee> {
  try {
    // Check if payee with same display name already exists (excluding current payee)
    const exists = await payeeNameExists(payeeData.displayName, userId, payeeId)
    if (exists) {
      throw new Error('A payee with this name already exists')
    }

    const updateData = transformFormDataToRow(payeeData, userId)

    const row = await queryOne<PayeeRow>(`
      UPDATE payees 
      SET name = $3, display_name = $4, description = $5, category = $6, is_active = $7, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [
      payeeId,
      userId,
      updateData.name,
      updateData.display_name,
      updateData.description,
      updateData.category,
      updateData.is_active
    ])

    if (!row) {
      throw new Error('Payee not found or you do not have permission to update it')
    }

    return transformRowToPayee(row)
  } catch (error) {
    console.error('Error updating payee:', error)
    throw new Error(`Failed to update payee: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Delete payee
 * @description Deletes a payee
 * @param payeeId - ID of payee to delete
 * @param userId - User ID for authorization
 * @returns Promise resolving to boolean indicating success
 */
export async function deletePayee(payeeId: string, userId: string): Promise<boolean> {
  try {
    const result = await query(`
      DELETE FROM payees 
      WHERE id = $1 AND user_id = $2
    `, [payeeId, userId])

    return Array.isArray(result) && result.length > 0
  } catch (error) {
    console.error('Error deleting payee:', error)
    throw new Error(`Failed to delete payee: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Toggle payee status
 * @description Toggles the active status of a payee
 * @param payeeId - ID of payee to toggle
 * @param userId - User ID for authorization
 * @returns Promise resolving to the updated payee
 */
export async function togglePayeeStatus(payeeId: string, userId: string): Promise<Payee> {
  try {
    const row = await queryOne<PayeeRow>(`
      UPDATE payees 
      SET is_active = NOT is_active, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [payeeId, userId])

    if (!row) {
      throw new Error('Payee not found or you do not have permission to update it')
    }

    return transformRowToPayee(row)
  } catch (error) {
    console.error('Error toggling payee status:', error)
    throw new Error(`Failed to toggle payee status: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
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