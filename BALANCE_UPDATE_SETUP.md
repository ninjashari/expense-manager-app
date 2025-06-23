# Account Balance Update & Credit Usage System

## Overview

This update fixes the account balance calculation issue and adds credit usage percentage tracking for credit card accounts. The system now automatically maintains accurate account balances based on transactions and provides real-time credit utilization tracking.

## Key Features

### 1. Automatic Balance Calculation
- Account balances are now automatically calculated based on transactions
- Database triggers ensure balances are updated whenever transactions are added, modified, or deleted
- Initial balance + sum of all completed transactions = current balance

### 2. Credit Usage Percentage
- New field `credit_usage_percentage` added to accounts table
- Automatically calculated for credit card accounts
- Shows percentage of credit limit used (0-100%)
- Visual indicators in UI (green/yellow/red based on usage level)

### 3. Real-time Updates
- Balances update automatically when transactions change
- Manual refresh option available in accounts page
- Fresh balance calculation on page load

## Database Changes

### New Column
```sql
ALTER TABLE accounts ADD COLUMN credit_usage_percentage DECIMAL(5,2) DEFAULT 0.00 
CHECK (credit_usage_percentage >= 0 AND credit_usage_percentage <= 100);
```

### New Functions
1. `calculate_account_balance(account_uuid)` - Calculates current balance based on transactions
2. `calculate_credit_usage_percentage(account_uuid)` - Calculates credit usage for credit cards
3. `update_account_balances_and_credit_usage()` - Trigger function to update balances
4. `recalculate_user_account_balances(user_uuid)` - Recalculates all user account balances

### New Triggers
- `update_account_balances_on_transaction_insert`
- `update_account_balances_on_transaction_update`
- `update_account_balances_on_transaction_delete`

## Transaction Impact on Balances

### Deposit Transactions
- **Effect**: Increases account balance
- **Formula**: `current_balance += transaction_amount`

### Withdrawal Transactions
- **Effect**: Decreases account balance
- **Formula**: `current_balance -= transaction_amount`

### Transfer Transactions
- **From Account**: `current_balance -= transaction_amount`
- **To Account**: `current_balance += transaction_amount`

## Credit Usage Calculation

For credit card accounts:
```
Credit Usage % = (|negative_balance| / credit_limit) * 100
```

### Visual Indicators
- **Green** (0-60%): Safe usage level
- **Yellow** (60-80%): Moderate usage level
- **Red** (80-100%): High usage level

## UI Enhancements

### Accounts List
- Credit usage percentage display for credit cards
- Progress bar visual indicator
- Refresh balances button

### Account Details
- Enhanced credit utilization display
- Progress bar with color coding
- Accurate available credit calculation

## API Changes

### New Service Functions
- `getAccountsWithFreshBalances(userId)` - Gets accounts with recalculated balances
- `recalculateAccountBalances(userId)` - Manually recalculates all user balances

### Updated Types
- `Account` interface now includes `creditUsagePercentage`
- `CreditCardInfo` interface includes `creditUsagePercentage`
- `AccountFormData` interface includes `creditUsagePercentage`

## Migration

The system includes automatic migration scripts that:
1. Add the new column to existing accounts tables
2. Update database constraints
3. Recalculate balances for all existing accounts

## Usage

### For Users
1. Account balances now automatically reflect transaction history
2. Credit card usage is visually displayed with percentages
3. Use "Refresh Balances" button if manual recalculation is needed

### For Developers
1. Balances are maintained automatically via database triggers
2. Use `getAccountsWithFreshBalances()` for guaranteed current balances
3. Credit usage is calculated and stored automatically

## Error Handling

- Failed balance calculations default to initial balance
- Credit usage defaults to 0% for non-credit card accounts
- Triggers handle edge cases (account changes, transaction modifications)
- Manual refresh option available for recovery

## Performance Considerations

- Database functions are optimized for performance
- Triggers only update affected accounts
- Batch updates available via `recalculate_user_account_balances()`
- Indexing on transaction relationships for fast calculations 