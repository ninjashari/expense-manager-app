# Date Input Fix Documentation

## Issue Description

The transaction and account forms were experiencing a date offset issue where selected dates were being saved as one day earlier than expected. This was happening due to timezone conversion problems in the date handling logic.

## Root Cause

The issue was caused by using `toISOString().split('T')[0]` to convert Date objects to database format. This method:

1. Converts the local date to UTC timezone
2. In some timezones (like IST), this can shift the date backward by one day
3. For example: A date selected as "2024-01-15" in IST would become "2024-01-14" when converted to UTC

### Example of the Problem
```javascript
// User selects January 15, 2024 in IST (UTC+5:30)
const selectedDate = new Date(2024, 0, 15) // Local time: 2024-01-15 00:00:00 IST

// Using toISOString().split('T')[0]
const dbDate = selectedDate.toISOString().split('T')[0]
// Result: "2024-01-14" (because UTC is 5:30 hours behind IST)
```

## Solution

Created timezone-safe date formatting utilities in `src/lib/utils.ts`:

### New Utility Functions

```typescript
/**
 * Format date for database storage without timezone issues
 * @param date - Date object to format
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForDatabase(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse date from database string
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object in local timezone
 */
export function parseDateFromDatabase(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number)
  return new Date(year, month - 1, day)
}
```

## Changes Made

### 1. Updated Transaction Service (`src/lib/services/supabase-transaction-service.ts`)
- Replaced `transactionData.date.toISOString().split('T')[0]` with `formatDateForDatabase(transactionData.date)`
- Updated date parsing in `transformRowToTransaction` to use `parseDateFromDatabase(row.date)`

### 2. Updated Account Service (`src/lib/services/supabase-account-service.ts`)
- Replaced `formData.accountOpeningDate.toISOString().split('T')[0]` with `formatDateForDatabase(formData.accountOpeningDate)`
- Updated date parsing in `transformRowToAccount` to use `parseDateFromDatabase(row.account_opening_date)`

### 3. Added Utility Functions (`src/lib/utils.ts`)
- Added `formatDateForDatabase()` function for safe date storage
- Added `parseDateFromDatabase()` function for safe date retrieval

## How It Works

### Date Storage (Form → Database)
```typescript
// User selects January 15, 2024
const userDate = new Date(2024, 0, 15)

// Old method (problematic)
const oldFormat = userDate.toISOString().split('T')[0] // "2024-01-14"

// New method (correct)
const newFormat = formatDateForDatabase(userDate) // "2024-01-15"
```

### Date Retrieval (Database → Form)
```typescript
// Database stores "2024-01-15"
const dbDateString = "2024-01-15"

// Old method (problematic)
const oldParse = new Date(dbDateString) // Might have timezone issues

// New method (correct)
const newParse = parseDateFromDatabase(dbDateString) // Always correct local date
```

## Benefits

1. **Timezone Independence**: Dates are now handled in local timezone consistently
2. **User Experience**: Selected dates match saved dates exactly
3. **Data Integrity**: No more date shifts due to timezone conversion
4. **Consistency**: Same date handling across all forms and services

## Testing

To verify the fix:

1. **Transaction Form**:
   - Create a new transaction with today's date
   - Verify the saved transaction shows the correct date
   - Edit the transaction and verify the date field shows correctly

2. **Account Form**:
   - Create a new account with a specific opening date
   - Verify the saved account shows the correct opening date
   - Edit the account and verify the date field shows correctly

## Affected Components

- ✅ Transaction Form (create/edit)
- ✅ Account Form (create/edit)
- ✅ Transaction Service
- ✅ Account Service
- ✅ Date display in lists and details

## Migration

No database migration is required as this only affects the application layer date handling. Existing data will be correctly parsed using the new `parseDateFromDatabase` function. 