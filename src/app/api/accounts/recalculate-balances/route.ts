/**
 * @file route.ts (accounts/recalculate-balances)
 * @description API endpoint to manually recalculate account balances
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { query } from '@/lib/database'

/**
 * POST handler for recalculating account balances
 * @description Manually recalculates all account balances for the authenticated user
 * @returns Response with success status
 */
export async function POST() {
  try {
    const session = await getSession()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Get all accounts for the user
    const accounts = await query(`
      SELECT id, initial_balance FROM accounts WHERE user_id = $1
    `, [userId])
    
    let updatedCount = 0

    // For each account, calculate the balance manually
    for (const account of accounts) {
      const balanceResult = await query(`
        SELECT COALESCE(
          SUM(
            CASE 
              WHEN type = 'deposit' AND account_id = $1 THEN amount
              WHEN type = 'withdrawal' AND account_id = $1 THEN -amount
              WHEN type = 'transfer' AND to_account_id = $1 THEN amount
              WHEN type = 'transfer' AND from_account_id = $1 THEN -amount
              ELSE 0
            END
          ), 0
        ) as transaction_sum
        FROM transactions 
        WHERE status = 'completed' 
          AND (account_id = $1 OR from_account_id = $1 OR to_account_id = $1)
      `, [account.id])
      
      const transactionSum = balanceResult[0]?.transaction_sum || 0
      const newBalance = parseFloat(account.initial_balance) + parseFloat(transactionSum)
      
      // Update the account balance
      await query(`
        UPDATE accounts 
        SET current_balance = $1, updated_at = NOW()
        WHERE id = $2
      `, [newBalance, account.id])
      
      updatedCount++
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully recalculated balances for ${updatedCount} accounts`,
      updatedCount
    }, { status: 200 })
    
  } catch (error) {
    console.error('Recalculate balances API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recalculate balances' },
      { status: 500 }
    )
  }
} 