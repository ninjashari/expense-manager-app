# Supabase Database Setup Guide

This guide will help you set up Supabase database for the Expense Manager application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Node.js and npm installed
3. The expense manager application code

## Step 1: Create a New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New project"
3. Choose your organization
4. Enter project details:
   - **Name**: `expense-manager` (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Configure Environment Variables

1. In your project root directory, create a `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Replace the placeholder values with your actual Supabase credentials
3. Make sure `.env.local` is added to your `.gitignore` file (it should be by default)

## Step 4: Set Up Database Schema

1. In your Supabase project dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `src/lib/database-schema.sql` from this project
4. Paste it into the SQL editor
5. Click "Run" to execute the schema

The schema will create:
- `accounts` table with all necessary fields
- Enum types for account types, statuses, and currencies
- Indexes for better performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

## Step 5: Enable Authentication

1. In your Supabase project dashboard, go to **Authentication** → **Settings**
2. Under "Site URL", add your application URL:
   - For development: `http://localhost:3000`
   - For production: your actual domain
3. Under "Redirect URLs", add:
   - `http://localhost:3000/auth/callback` (for development)
   - `https://yourdomain.com/auth/callback` (for production)

## Step 6: Configure Email Authentication (Optional)

If you want to use email authentication:

1. Go to **Authentication** → **Providers**
2. Enable "Email" provider
3. Configure email templates if desired
4. For production, configure a custom SMTP provider

## Step 7: Test the Connection

1. Start your development server:
```bash
npm run dev
```

2. Open your browser and go to `http://localhost:3000`
3. Try to sign up/sign in
4. If successful, try creating an account to test database operations

## Step 8: Insert Sample Data (Optional)

If you want to add sample data for testing:

1. Go to **SQL Editor** in Supabase
2. First, create a test user by signing up through your application
3. Get your user ID from **Authentication** → **Users**
4. Run this SQL query (replace `your-user-id` with your actual user ID):

```sql
-- Insert sample accounts
INSERT INTO accounts (user_id, name, type, status, initial_balance, current_balance, currency, account_opening_date, notes) VALUES
  ('your-user-id', 'HDFC Savings Account', 'savings', 'active', 50000.00, 75000.00, 'INR', '2020-01-15', 'Primary savings account for salary and investments'),
  ('your-user-id', 'Cash Wallet', 'cash', 'active', 5000.00, 3500.00, 'INR', '2024-01-01', 'Physical cash and wallet money');

-- Insert sample credit card account
INSERT INTO accounts (user_id, name, type, status, initial_balance, current_balance, currency, account_opening_date, notes, credit_limit, payment_due_date, bill_generation_date, current_bill_paid) VALUES
  ('your-user-id', 'ICICI Credit Card', 'credit_card', 'active', 0.00, -25000.00, 'INR', '2021-06-10', 'Primary credit card for online purchases and EMIs', 200000.00, 15, 20, false);
```

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**
   - Double-check your environment variables
   - Ensure you're using the correct anon key (not the service role key)
   - Restart your development server after changing environment variables

2. **"Row Level Security violation" error**
   - Make sure you're authenticated when trying to access data
   - Verify that RLS policies are correctly set up

3. **Database connection issues**
   - Check your Supabase project URL
   - Ensure your project is not paused (free tier projects pause after inactivity)

4. **Authentication not working**
   - Verify your site URL and redirect URLs are correctly configured
   - Check browser console for detailed error messages

### Getting Help:

- Check the [Supabase Documentation](https://supabase.com/docs)
- Visit the [Supabase Discord community](https://discord.supabase.com)
- Review the application logs in your browser's developer console

## Production Deployment

When deploying to production:

1. Update environment variables with production Supabase credentials
2. Configure custom domain for authentication
3. Set up proper email templates
4. Consider upgrading to a paid Supabase plan for better performance
5. Set up database backups
6. Configure monitoring and alerts

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use Row Level Security (RLS) for all tables
3. Regularly rotate your database passwords
4. Monitor authentication logs for suspicious activity
5. Keep your Supabase project updated

---

**Note**: This application is configured to work with Indian Rupees (INR) as the default currency. You can modify the currency settings in `src/lib/supabase.ts` if needed. 