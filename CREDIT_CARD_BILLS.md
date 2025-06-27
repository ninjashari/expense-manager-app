# Credit Card Bills Implementation

This document explains the credit card bill generation and management system implemented in the expense management application.

## Overview

The credit card bills feature provides comprehensive bill management for credit card accounts including:
- Automatic bill generation based on account settings
- Bill payment tracking
- Overdue bill notifications
- Bill period calculations following your specified requirements

## Bill Generation Logic

### Bill Period Calculation

The system follows your exact specification for bill periods:

**Rule**: If bill generation date is the 13th, then bills include transactions from the 13th of the previous month to the 12th of the current month.

**Example**:
- Bill Generation Date: 13th of every month
- Bill for January 13th includes transactions: December 13th - January 12th
- Bill for February 13th includes transactions: January 13th - February 12th

### Implementation Details

1. **Bill Period Start**: Previous month's bill generation date
2. **Bill Period End**: Current month's bill generation date minus 1 day
3. **Transaction Inclusion**: All completed transactions within the bill period

```typescript
// Example calculation for bill generation date = 13
billPeriodEnd = billGenerationDate - 1 day    // 12th
billPeriodStart = billPeriodEnd - 1 month      // Previous month's 13th
```

## Database Schema

### Credit Card Bills Table

```sql
CREATE TABLE credit_card_bills (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  account_id UUID REFERENCES accounts(id),
  
  -- Bill period
  bill_period_start DATE NOT NULL,
  bill_period_end DATE NOT NULL,
  bill_generation_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  
  -- Bill amounts
  previous_balance DECIMAL(15,2) DEFAULT 0.00,
  total_spending DECIMAL(15,2) DEFAULT 0.00,
  total_payments DECIMAL(15,2) DEFAULT 0.00,
  bill_amount DECIMAL(15,2) DEFAULT 0.00,
  minimum_payment DECIMAL(15,2) DEFAULT 0.00,
  
  -- Payment tracking
  status credit_card_bill_status DEFAULT 'generated',
  paid_amount DECIMAL(15,2) DEFAULT 0.00,
  paid_date DATE,
  
  -- Related transactions
  transaction_ids UUID[],
  payment_transaction_ids UUID[],
  
  -- Metadata
  is_auto_generated BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Bill Status Types

- `generated`: Bill created but not paid
- `partial`: Partially paid bill
- `paid`: Fully paid bill
- `overdue`: Unpaid bill past due date

## API Functions

### Core Functions

1. **`generateCreditCardBill(params, userId)`**
   - Creates a new bill for a specific period
   - Calculates spending and payments from transactions
   - Applies previous balance from last bill

2. **`autoGenerateBills(userId)`**
   - Automatically generates bills for all credit cards
   - Runs based on bill generation dates
   - Prevents duplicate bills for same period

3. **`markBillAsPaid(paymentInfo, userId)`**
   - Records bill payments
   - Updates bill status automatically
   - Links payment transactions

4. **`getCreditCardSummaries(userId)`**
   - Provides comprehensive overview of all credit cards
   - Includes current bills, usage statistics, and trends

## Bill Amount Calculation

```typescript
billAmount = previousBalance + totalSpending - totalPayments
```

Where:
- **Previous Balance**: Outstanding amount from previous bill
- **Total Spending**: All withdrawals/spending during bill period
- **Total Payments**: All deposits/payments during bill period

## Transaction Inclusion Logic

Transactions are included in bills based on:

1. **Date Range**: Transaction date within bill period (inclusive)
2. **Account Association**: Transaction involves the credit card account
3. **Status**: Only completed transactions are included
4. **Type Classification**:
   - **Spending**: Withdrawals from credit card
   - **Payments**: Deposits to credit card
   - **Transfers**: From credit card (spending) or to credit card (payment)

## Payment Tracking

### Automatic Status Updates

The system automatically updates bill status when payments are recorded:

- **Paid**: `paidAmount >= billAmount`
- **Partial**: `0 < paidAmount < billAmount` and not overdue
- **Overdue**: Unpaid or partial past due date
- **Generated**: New bill, no payments yet

### Payment Transaction Linking

- Bill payments can be linked to specific transaction records
- Multiple payments can be made against a single bill
- Payment history is maintained for audit purposes

## User Interface Features

### Credit Cards Page (`/credit-cards`)

1. **Credit Card Overview Cards**
   - Credit usage visualization with progress bars
   - Current balance and available credit
   - Next bill and payment due dates
   - Account-specific bill generation settings

2. **Bill Management Tabs**
   - **Upcoming Bills**: Bills due within next 7 days
   - **Overdue Bills**: Past due bills requiring attention
   - **All Bills**: Complete bill history by account

3. **Bill Details Display**
   - Bill period information
   - Amount breakdown (previous balance, spending, payments)
   - Payment status and history
   - Quick payment actions

### Visual Indicators

- **Color-coded bill status badges**
- **Overdue indicators** (red borders, alert icons)
- **Due soon warnings** (orange indicators)
- **Progress bars** for credit usage
- **Trend indicators** for spending patterns

## Automatic Bill Generation

### Trigger Conditions

Bills are automatically generated when:
1. Current date >= bill generation date
2. No existing bill for the calculated period
3. Credit card account is active
4. Required bill settings are configured

### Background Processing

The `autoGenerateBills()` function should be called:
- When users visit the credit cards page
- Via scheduled background jobs (recommended)
- After transaction imports or bulk operations

## Integration with Existing Features

### Dashboard Integration

Credit card information is excluded from total balance calculations as per your requirements, but bill summaries could be added to dashboard widgets.

### Transaction Integration

- Credit card transactions automatically contribute to bill calculations
- Payment transactions can be linked to specific bills
- Transaction categorization applies to credit card spending analysis

### Reporting Integration

Credit card bills provide rich data for:
- Monthly spending analysis
- Payment pattern tracking
- Credit utilization monitoring
- Category-wise spending on credit cards

## Security and Data Integrity

### Constraints and Validations

- Bill periods cannot overlap for the same account
- Payment amounts cannot exceed bill amounts (with small tolerance)
- Bill dates must follow logical sequence
- Transaction links are validated for existence and ownership

### User Data Isolation

- All bills are scoped to user accounts
- Cross-user data access is prevented
- Audit trails maintained for all bill operations

## Error Handling

The system handles various error scenarios:
- Missing credit card configuration
- Invalid date ranges
- Duplicate bill generation attempts
- Payment processing failures
- Network connectivity issues

## Future Enhancements

Potential improvements to consider:
- Email notifications for due bills
- Automated payment scheduling
- Credit utilization alerts
- Spending category analysis
- Bill export functionality
- Integration with bank APIs for automatic payment detection 