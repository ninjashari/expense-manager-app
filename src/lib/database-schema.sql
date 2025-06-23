-- Database Schema for Expense Manager App
-- This file contains the SQL schema for setting up the database tables in Supabase

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_credit_card_fields CHECK (
    (type = 'credit_card' AND credit_limit IS NOT NULL AND payment_due_date IS NOT NULL AND bill_generation_date IS NOT NULL) OR
    (type != 'credit_card' AND credit_limit IS NULL AND payment_due_date IS NULL AND bill_generation_date IS NULL AND current_bill_paid IS NULL)
  ),
  CONSTRAINT positive_credit_limit CHECK (credit_limit IS NULL OR credit_limit > 0),
  CONSTRAINT valid_balance_range CHECK (current_balance >= -999999999999.99 AND current_balance <= 999999999999.99)
);

-- Create indexes for better performance
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_type ON accounts(type);
CREATE INDEX idx_accounts_status ON accounts(status);
CREATE INDEX idx_accounts_created_at ON accounts(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts"
  ON accounts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own accounts
CREATE POLICY "Users can insert own accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts"
  ON accounts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own accounts
CREATE POLICY "Users can delete own accounts"
  ON accounts FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable Row Level Security (RLS) for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for categories
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at for categories
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create payees table
CREATE TABLE payees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable Row Level Security (RLS) for payees
ALTER TABLE payees ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for payees
CREATE POLICY "Users can view own payees"
  ON payees FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payees"
  ON payees FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own payees"
  ON payees FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own payees"
  ON payees FOR DELETE
  USING (auth.uid() = user_id);

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
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
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

-- Enable Row Level Security (RLS) for transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at for transactions
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - for development)
-- Note: Replace 'your-user-id' with actual user ID from auth.users
/*
INSERT INTO accounts (user_id, name, type, status, initial_balance, current_balance, currency, account_opening_date, notes) VALUES
  ('your-user-id', 'HDFC Savings Account', 'savings', 'active', 50000.00, 75000.00, 'INR', '2020-01-15', 'Primary savings account for salary and investments'),
  ('your-user-id', 'Cash Wallet', 'cash', 'active', 5000.00, 3500.00, 'INR', '2024-01-01', 'Physical cash and wallet money');

INSERT INTO accounts (user_id, name, type, status, initial_balance, current_balance, currency, account_opening_date, notes, credit_limit, payment_due_date, bill_generation_date, current_bill_paid) VALUES
  ('your-user-id', 'ICICI Credit Card', 'credit_card', 'active', 0.00, -25000.00, 'INR', '2021-06-10', 'Primary credit card for online purchases and EMIs', 200000.00, 15, 20, false);

INSERT INTO categories (user_id, name, display_name, description, is_active) VALUES
  ('your-user-id', 'groceries', 'Groceries', 'Food and household items', true),
  ('your-user-id', 'transportation', 'Transportation', 'Vehicle fuel, public transport, taxi', true),
  ('your-user-id', 'utilities', 'Utilities', 'Electricity, water, internet, phone bills', true),
  ('your-user-id', 'entertainment', 'Entertainment', 'Movies, dining out, subscriptions', true),
  ('your-user-id', 'healthcare', 'Healthcare', 'Medical expenses, medicines, insurance', true);

INSERT INTO payees (user_id, name, display_name, description, category, is_active) VALUES
  ('your-user-id', 'big-bazaar', 'Big Bazaar', 'Large retail chain for groceries and household items', 'retail', true),
  ('your-user-id', 'uber', 'Uber', 'Ride-sharing service for transportation', 'transportation', true),
  ('your-user-id', 'adani-electricity', 'Adani Electricity', 'Monthly electricity bill payment', 'utilities', true),
  ('your-user-id', 'netflix', 'Netflix', 'Monthly streaming subscription', 'entertainment', true),
  ('your-user-id', 'apollo-pharmacy', 'Apollo Pharmacy', 'Medicine and healthcare products', 'healthcare', true),
  ('your-user-id', 'zomato', 'Zomato', 'Food delivery service', 'dining', true),
  ('your-user-id', 'amazon', 'Amazon', 'Online shopping and retail', 'retail', true),
  ('your-user-id', 'indian-oil', 'Indian Oil', 'Fuel station for vehicle refueling', 'transportation', true);
*/ 