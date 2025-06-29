-- Database Schema for Expense Manager App (Local PostgreSQL)
-- This file contains the SQL schema for setting up the database tables in local PostgreSQL

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (replaces Supabase auth.users)
CREATE TABLE users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Create index for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Create enum types
CREATE TYPE account_type AS ENUM (
  'savings',
  'checking', 
  'credit_card',
  'investment',
  'cash',
  'loan',
  'other'
);

CREATE TYPE account_status AS ENUM (
  'active',
  'inactive', 
  'closed'
);

CREATE TYPE currency_type AS ENUM (
  'INR',
  'USD',
  'EUR',
  'GBP'
);

-- Create accounts table
CREATE TABLE accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type account_type NOT NULL,
  status account_status DEFAULT 'active' NOT NULL,
  initial_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  current_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  currency currency_type DEFAULT 'INR' NOT NULL,
  account_opening_date DATE NOT NULL,
  notes TEXT,
  
  -- Credit card specific fields
  credit_limit DECIMAL(15,2),
  payment_due_date INTEGER CHECK (payment_due_date >= 1 AND payment_due_date <= 31),
  bill_generation_date INTEGER CHECK (bill_generation_date >= 1 AND bill_generation_date <= 31),
  current_bill_paid BOOLEAN DEFAULT FALSE,
  credit_usage_percentage DECIMAL(5,2) DEFAULT 0.00 CHECK (credit_usage_percentage >= 0 AND credit_usage_percentage <= 100),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_credit_card_fields CHECK (
    (type = 'credit_card' AND credit_limit IS NOT NULL AND payment_due_date IS NOT NULL AND bill_generation_date IS NOT NULL) OR
    (type != 'credit_card' AND credit_limit IS NULL AND payment_due_date IS NULL AND bill_generation_date IS NULL AND current_bill_paid IS NULL AND credit_usage_percentage = 0.00)
  ),
  CONSTRAINT positive_credit_limit CHECK (credit_limit IS NULL OR credit_limit > 0),
  CONSTRAINT valid_balance_range CHECK (current_balance >= -999999999999.99 AND current_balance <= 999999999999.99)
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically update updated_at for accounts
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(100) NOT NULL, -- Auto-generated backend name (slug-like)
  display_name VARCHAR(50) NOT NULL, -- User-provided display name
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_category_name_per_user UNIQUE(user_id, name),
  CONSTRAINT unique_display_name_per_user UNIQUE(user_id, display_name),
  CONSTRAINT valid_name_format CHECK (name ~ '^[a-z0-9-]+$' AND length(name) >= 2),
  CONSTRAINT valid_display_name CHECK (length(trim(display_name)) >= 2)
);

-- Create indexes for categories
CREATE INDEX idx_categories_user_id ON categories(user_id);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_is_active ON categories(is_active);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Create trigger to automatically update updated_at for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create payees table
CREATE TABLE payees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(150) NOT NULL, -- Auto-generated backend name (slug-like)
  display_name VARCHAR(100) NOT NULL, -- User-provided display name
  description TEXT,
  category VARCHAR(50), -- Optional category for grouping payees
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT unique_payee_name_per_user UNIQUE(user_id, name),
  CONSTRAINT unique_display_name_per_user_payee UNIQUE(user_id, display_name),
  CONSTRAINT valid_payee_name_format CHECK (name ~ '^[a-z0-9-]+$' AND length(name) >= 2),
  CONSTRAINT valid_payee_display_name CHECK (length(trim(display_name)) >= 2)
);

-- Create indexes for payees
CREATE INDEX idx_payees_user_id ON payees(user_id);
CREATE INDEX idx_payees_name ON payees(name);
CREATE INDEX idx_payees_category ON payees(category);
CREATE INDEX idx_payees_is_active ON payees(is_active);
CREATE INDEX idx_payees_created_at ON payees(created_at);

-- Create trigger to automatically update updated_at for payees
CREATE TRIGGER update_payees_updated_at
  BEFORE UPDATE ON payees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create transaction types enum
CREATE TYPE transaction_type AS ENUM (
  'deposit',
  'withdrawal',
  'transfer'
);

CREATE TYPE transaction_status AS ENUM (
  'pending',
  'completed',
  'cancelled'
);

-- Create transactions table
CREATE TABLE transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status transaction_status DEFAULT 'completed' NOT NULL,
  type transaction_type NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  
  -- For deposit/withdrawal transactions
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  payee_id UUID REFERENCES payees(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- For transfer transactions
  from_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  to_account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT valid_transaction_fields CHECK (
    -- For transfer transactions
    (type = 'transfer' AND from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id AND account_id IS NULL AND payee_id IS NULL) OR
    -- For deposit/withdrawal transactions
    (type IN ('deposit', 'withdrawal') AND account_id IS NOT NULL AND from_account_id IS NULL AND to_account_id IS NULL)
  )
);

-- Create indexes for transactions
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_from_account_id ON transactions(from_account_id);
CREATE INDEX idx_transactions_to_account_id ON transactions(to_account_id);
CREATE INDEX idx_transactions_payee_id ON transactions(payee_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);

-- Create trigger to automatically update updated_at for transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate account balance based on transactions
CREATE OR REPLACE FUNCTION calculate_account_balance(account_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  initial_bal DECIMAL(15,2);
  transaction_sum DECIMAL(15,2) := 0;
  account_type_val account_type;
BEGIN
  -- Get initial balance and account type
  SELECT initial_balance, type INTO initial_bal, account_type_val
  FROM accounts 
  WHERE id = account_uuid;
  
  IF NOT FOUND THEN
    RETURN 0;
  END IF;
  
  -- Calculate sum from transactions where this account is involved
  -- For deposits: add amount
  -- For withdrawals: subtract amount  
  -- For transfers: add if to_account, subtract if from_account
  SELECT COALESCE(
    SUM(
      CASE 
        WHEN type = 'deposit' AND account_id = account_uuid THEN amount
        WHEN type = 'withdrawal' AND account_id = account_uuid THEN -amount
        WHEN type = 'transfer' AND to_account_id = account_uuid THEN amount
        WHEN type = 'transfer' AND from_account_id = account_uuid THEN -amount
        ELSE 0
      END
    ), 0
  ) INTO transaction_sum
  FROM transactions 
  WHERE status = 'completed' 
    AND (account_id = account_uuid OR from_account_id = account_uuid OR to_account_id = account_uuid);
  
  RETURN initial_bal + transaction_sum;
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate credit usage percentage
CREATE OR REPLACE FUNCTION calculate_credit_usage_percentage(account_uuid UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  current_bal DECIMAL(15,2);
  credit_lim DECIMAL(15,2);
  usage_amount DECIMAL(15,2);
  usage_percentage DECIMAL(5,2) := 0.00;
BEGIN
  -- Get current balance and credit limit for credit card accounts
  SELECT current_balance, credit_limit INTO current_bal, credit_lim
  FROM accounts 
  WHERE id = account_uuid AND type = 'credit_card';
  
  IF NOT FOUND OR credit_lim IS NULL OR credit_lim <= 0 THEN
    RETURN 0.00;
  END IF;
  
  -- For credit cards, negative balance means money owed (used credit)
  -- Calculate usage as absolute value of negative balance
  IF current_bal < 0 THEN
    usage_amount := ABS(current_bal);
    usage_percentage := (usage_amount / credit_lim) * 100;
    
    -- Cap at 100%
    IF usage_percentage > 100 THEN
      usage_percentage := 100.00;
    END IF;
  END IF;
  
  RETURN usage_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create function to update account balances and credit usage
CREATE OR REPLACE FUNCTION update_account_balances_and_credit_usage()
RETURNS TRIGGER AS $$
DECLARE
  affected_accounts UUID[];
  account_id_to_update UUID;
BEGIN
  -- Collect all affected account IDs
  affected_accounts := ARRAY[]::UUID[];
  
  -- Handle different trigger scenarios
  IF TG_OP = 'DELETE' THEN
    -- For DELETE, use OLD values
    IF OLD.account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, OLD.account_id);
    END IF;
    IF OLD.from_account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, OLD.from_account_id);
    END IF;
    IF OLD.to_account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, OLD.to_account_id);
    END IF;
  ELSE
    -- For INSERT and UPDATE, use NEW values
    IF NEW.account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, NEW.account_id);
    END IF;
    IF NEW.from_account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, NEW.from_account_id);
    END IF;
    IF NEW.to_account_id IS NOT NULL THEN
      affected_accounts := array_append(affected_accounts, NEW.to_account_id);
    END IF;
    
    -- For UPDATE, also include OLD account IDs if they changed
    IF TG_OP = 'UPDATE' THEN
      IF OLD.account_id IS NOT NULL AND OLD.account_id != COALESCE(NEW.account_id, OLD.account_id) THEN
        affected_accounts := array_append(affected_accounts, OLD.account_id);
      END IF;
      IF OLD.from_account_id IS NOT NULL AND OLD.from_account_id != COALESCE(NEW.from_account_id, OLD.from_account_id) THEN
        affected_accounts := array_append(affected_accounts, OLD.from_account_id);
      END IF;
      IF OLD.to_account_id IS NOT NULL AND OLD.to_account_id != COALESCE(NEW.to_account_id, OLD.to_account_id) THEN
        affected_accounts := array_append(affected_accounts, OLD.to_account_id);
      END IF;
    END IF;
  END IF;
  
  -- Update balances and credit usage for all affected accounts
  FOREACH account_id_to_update IN ARRAY affected_accounts
  LOOP
    UPDATE accounts 
    SET 
      current_balance = calculate_account_balance(account_id_to_update),
      credit_usage_percentage = calculate_credit_usage_percentage(account_id_to_update)
    WHERE id = account_id_to_update;
  END LOOP;
  
  -- Return appropriate record based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update balances when transactions change
CREATE TRIGGER update_account_balances_on_transaction_insert
  AFTER INSERT ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances_and_credit_usage();

CREATE TRIGGER update_account_balances_on_transaction_update
  AFTER UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances_and_credit_usage();

CREATE TRIGGER update_account_balances_on_transaction_delete
  AFTER DELETE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_account_balances_and_credit_usage();

-- Create function to recalculate balances for all accounts of a user
CREATE OR REPLACE FUNCTION recalculate_user_account_balances(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
  account_record RECORD;
BEGIN
  -- Loop through all accounts for the user and update their balances
  FOR account_record IN 
    SELECT id FROM accounts WHERE user_id = user_uuid
  LOOP
    UPDATE accounts 
    SET 
      current_balance = calculate_account_balance(account_record.id),
      credit_usage_percentage = calculate_credit_usage_percentage(account_record.id)
    WHERE id = account_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create enum type for credit card bill status
CREATE TYPE credit_card_bill_status AS ENUM (
  'generated',
  'paid', 
  'overdue',
  'partial'
);

-- Create credit card bills table
CREATE TABLE credit_card_bills (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE NOT NULL,
  
  -- Bill period information
  bill_period_start DATE NOT NULL,
  bill_period_end DATE NOT NULL,
  bill_generation_date DATE NOT NULL,
  payment_due_date DATE NOT NULL,
  
  -- Bill amounts
  previous_balance DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_spending DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  total_payments DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  bill_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  minimum_payment DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  
  -- Payment tracking
  status credit_card_bill_status DEFAULT 'generated' NOT NULL,
  paid_amount DECIMAL(15,2) DEFAULT 0.00 NOT NULL,
  paid_date DATE,
  
  -- Related transaction tracking
  transaction_ids UUID[] DEFAULT ARRAY[]::UUID[] NOT NULL,
  payment_transaction_ids UUID[] DEFAULT ARRAY[]::UUID[] NOT NULL,
  
  -- Metadata
  is_auto_generated BOOLEAN DEFAULT TRUE NOT NULL,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_bill_period CHECK (bill_period_start <= bill_period_end),
  CONSTRAINT valid_bill_dates CHECK (bill_generation_date >= bill_period_end),
  CONSTRAINT valid_payment_due_date CHECK (payment_due_date > bill_generation_date),
  CONSTRAINT valid_paid_amount CHECK (paid_amount >= 0 AND paid_amount <= bill_amount + 1000), -- Allow small overpayment
  CONSTRAINT valid_bill_amounts CHECK (
    previous_balance >= 0 AND 
    total_spending >= 0 AND 
    total_payments >= 0 AND
    minimum_payment >= 0
  )
);

-- Create indexes for credit card bills
CREATE INDEX idx_credit_card_bills_user_id ON credit_card_bills(user_id);
CREATE INDEX idx_credit_card_bills_account_id ON credit_card_bills(account_id);
CREATE INDEX idx_credit_card_bills_status ON credit_card_bills(status);
CREATE INDEX idx_credit_card_bills_bill_generation_date ON credit_card_bills(bill_generation_date);
CREATE INDEX idx_credit_card_bills_payment_due_date ON credit_card_bills(payment_due_date);
CREATE INDEX idx_credit_card_bills_created_at ON credit_card_bills(created_at);

-- Create unique constraint to prevent duplicate bills for same period
CREATE UNIQUE INDEX idx_credit_card_bills_unique_period 
ON credit_card_bills(account_id, bill_period_start, bill_period_end);

-- Create trigger to update updated_at timestamp for credit card bills
CREATE TRIGGER update_credit_card_bills_updated_at
  BEFORE UPDATE ON credit_card_bills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column(); 