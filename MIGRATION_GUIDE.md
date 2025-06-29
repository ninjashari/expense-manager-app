# Migration Guide: Supabase → Local PostgreSQL

This guide explains how to migrate the Expense Manager application from Supabase to a local PostgreSQL database while maintaining all functionality.

## Overview

The migration replaces:
- **Supabase Auth** → JWT-based authentication with bcryptjs
- **Supabase Database** → Local PostgreSQL with connection pooling
- **Row Level Security (RLS)** → Application-level authorization
- **Supabase Client** → Direct PostgreSQL queries with pg driver

## Prerequisites

### 1. PostgreSQL Installation

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**macOS (Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### 2. Database Setup

1. **Create Database:**
```bash
sudo -u postgres psql
CREATE DATABASE expense_manager;
CREATE USER expense_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE expense_manager TO expense_user;
\q
```

2. **Test Connection:**
```bash
psql -h localhost -U expense_user -d expense_manager
```

## Migration Steps

### Step 1: Install Dependencies

```bash
# Remove Supabase dependencies
npm uninstall @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared

# Install PostgreSQL dependencies
npm install pg bcryptjs jsonwebtoken
npm install -D @types/pg @types/bcryptjs @types/jsonwebtoken
```

### Step 2: Environment Configuration

Create `.env.local`:
```env
DATABASE_URL=postgresql://expense_user:your_secure_password@localhost:5432/expense_manager
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
NODE_ENV=development
```

### Step 3: Database Schema Setup

Run the database setup script:
```bash
npm run db:setup
```

This will:
- Create all necessary tables
- Set up indexes for performance
- Create database functions for balance calculations
- Set up triggers for automatic updates

### Step 4: Update Service Imports

Update any remaining imports from Supabase services to the new local services:

```typescript
// Before
import { getAccounts } from '@/lib/services/supabase-account-service'

// After
import { getAccounts } from '@/lib/services/account-service'
```

## Architecture Changes

### Authentication System

**Before (Supabase):**
- Email/password managed by Supabase Auth
- Session management via Supabase client
- User data stored in `auth.users`

**After (Local):**
- JWT tokens with bcryptjs password hashing
- HTTP-only cookie-based sessions
- User data stored in local `users` table

### Database Access

**Before (Supabase):**
```typescript
const { data, error } = await supabase
  .from('accounts')
  .select('*')
  .eq('user_id', userId)
```

**After (Local PostgreSQL):**
```typescript
const accounts = await query<AccountRow>(`
  SELECT * FROM accounts 
  WHERE user_id = $1
`, [userId])
```

### Security Model

**Before:** Row Level Security (RLS) policies in Supabase
**After:** Application-level authorization checks using JWT user ID

## Key Features Maintained

✅ **User Authentication**: Email/password login and registration  
✅ **Account Management**: Full CRUD operations for financial accounts  
✅ **Transaction Management**: Deposits, withdrawals, and transfers  
✅ **Categories & Payees**: Complete management system  
✅ **Balance Calculations**: Automatic real-time balance updates  
✅ **Credit Card Support**: Bill tracking and usage calculations  
✅ **Financial Reports**: Dashboard and analytics  
✅ **Data Import/Export**: CSV import/export functionality  

## API Endpoints

The migration introduces new API endpoints for authentication:

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User authentication  
- `POST /api/auth/signout` - User logout

## Database Schema

The local PostgreSQL schema includes:

### Core Tables
- `users` - User authentication and profile data
- `accounts` - Financial accounts (savings, credit cards, etc.)
- `categories` - Transaction categories
- `payees` - Transaction payees/recipients
- `transactions` - Financial transactions
- `credit_card_bills` - Credit card billing information

### Advanced Features
- **Automatic Balance Calculation**: PostgreSQL functions and triggers
- **Credit Usage Tracking**: Real-time credit card utilization
- **Data Integrity**: Comprehensive constraints and validations
- **Performance Optimization**: Strategic indexes for fast queries

## Performance Considerations

### Connection Pooling
- PostgreSQL connection pool (max 20 connections)
- Automatic connection management
- Idle timeout and cleanup

### Query Optimization
- Indexed columns for fast lookups
- Efficient JOIN operations
- Prepared statements for security

### Caching Strategy
- Database-level calculated fields
- Minimal application-level caching needs

## Security Features

### Authentication
- JWT tokens with configurable expiration
- Bcryptjs password hashing (12 rounds)
- HTTP-only cookie storage

### Data Protection
- Parameterized queries prevent SQL injection
- User ID validation on all operations
- Role-based access control

### Environment Security
- Secure environment variable handling
- Production-ready configurations
- Database connection encryption

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists
   - Verify user permissions

2. **JWT Token Errors**
   - Check JWT_SECRET is set
   - Ensure JWT_SECRET is sufficiently long
   - Verify cookie configuration

3. **Schema Creation Errors**
   - Run `npm run db:setup` again
   - Check PostgreSQL version compatibility
   - Verify user has schema creation permissions

### Debugging Commands

```bash
# Test database connection
psql -h localhost -U expense_user -d expense_manager -c "SELECT 1;"

# Check table creation
psql -h localhost -U expense_user -d expense_manager -c "\dt"

# Verify functions exist
psql -h localhost -U expense_user -d expense_manager -c "\df"
```

## Production Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@localhost:5432/expense_manager
JWT_SECRET=production-secret-key-minimum-32-characters
NODE_ENV=production
```

### Security Checklist
- [ ] Strong JWT_SECRET (minimum 32 characters)
- [ ] Secure database password
- [ ] SSL/TLS for database connections
- [ ] Regular database backups
- [ ] Monitor connection pool usage
- [ ] Set up database logging

### Performance Tuning
- Configure PostgreSQL for your server specs
- Monitor query performance
- Set up database maintenance schedules
- Consider read replicas for high traffic

## Rollback Plan

If you need to rollback to Supabase:

1. Restore original `package.json` dependencies
2. Restore original service files
3. Update environment variables
4. Export data from PostgreSQL and import to Supabase

The data structure is compatible, making rollback straightforward if needed.

## Support

For issues or questions about the migration:
1. Check the troubleshooting section above
2. Review the console logs for specific errors
3. Verify your PostgreSQL setup and permissions
4. Ensure all environment variables are correctly set 