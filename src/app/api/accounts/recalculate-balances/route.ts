/**
 * @file route.ts (accounts/recalculate-balances)
 * @description API endpoint to manually recalculate account balances and credit usage percentages
 */
import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth-server'
import { query } from '@/lib/database'

/**
 * POST handler for recalculating account balances and credit usage
 * @description Manually recalculates all account balances and credit usage percentages for the authenticated user
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

    try {
      // Try to use the database function that properly handles both balance and credit usage
      await query(`SELECT recalculate_user_account_balances($1)`, [userId])
      
      // Get count of updated accounts for response
      const accountsResult = await query<{ count: number }>(`
        SELECT COUNT(*) as count FROM accounts WHERE user_id = $1
      `, [userId])
      
      const updatedCount = accountsResult[0]?.count || 0
      
      return NextResponse.json({ 
        success: true,
        message: `Successfully recalculated balances and credit usage for ${updatedCount} accounts`,
        updatedCount
      }, { status: 200 })
      
    } catch (dbFunctionError) {
      console.warn('Database function not available, falling back to manual calculation:', dbFunctionError)
      
      // Fallback: manual calculation if database function doesn't exist
      const accounts = await query<{ id: string; initial_balance: number; type: string; credit_limit: number | null }>(`
        SELECT id, initial_balance, type, credit_limit FROM accounts WHERE user_id = $1
      `, [userId])
      
      let updatedCount = 0

      // For each account, calculate the balance and credit usage manually
      for (const account of accounts) {
        // Calculate new balance
        const balanceResult = await query<{ transaction_sum: number }>(`
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
        const newBalance = parseFloat(account.initial_balance.toString()) + parseFloat(transactionSum.toString())
        
        // Calculate credit usage percentage for credit cards
        let creditUsagePercentage = 0
        if (account.type === 'credit_card' && account.credit_limit && account.credit_limit > 0) {
          if (newBalance < 0) {
            const usageAmount = Math.abs(newBalance)
            creditUsagePercentage = Math.min((usageAmount / account.credit_limit) * 100, 100)
          }
        }
        
        // Update the account balance and credit usage
        await query(`
          UPDATE accounts 
          SET 
            current_balance = $1, 
            credit_usage_percentage = $2,
            updated_at = NOW()
          WHERE id = $3
        `, [newBalance, creditUsagePercentage, account.id])
        
        updatedCount++
      }
      
      return NextResponse.json({ 
        success: true,
        message: `Successfully recalculated balances and credit usage for ${updatedCount} accounts (manual calculation)`,
        updatedCount
      }, { status: 200 })
    }
    
  } catch (error) {
    console.error('Recalculate balances API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to recalculate balances and credit usage' },
      { status: 500 }
    )
  }
} 