# Expense Manager Setup Guide

## Quick Start

1. **Install dependencies**: `npm install`
2. **Start development server**: `npm run dev`
3. **Open**: [http://localhost:3000](http://localhost:3000)

The app will show a setup screen with instructions if Supabase is not configured.

## Supabase Configuration (Required for Authentication)

To enable authentication and database functionality, you need to set up Supabase:

### 1. Create a Supabase Project
- Go to [https://supabase.com](https://supabase.com)
- Create a new account or sign in
- Click "New Project"
- Choose your organization and create the project

### 2. Get Your Credentials
- Go to your Supabase project dashboard
- Navigate to **Settings > API**
- Copy the following values:
  - **Project URL** (looks like: `https://your-project-id.supabase.co`)
  - **anon/public key** (starts with `eyJhbGciOiJIUzI1NI...`)

### 3. Create Environment File
Create a `.env.local` file in the root directory:

```env
# Replace with your actual Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Enable Email Authentication
- In your Supabase dashboard, go to **Authentication > Settings**
- Ensure "Enable email confirmations" is enabled
- Configure your site URL to `http://localhost:3000` for development

## Currency Configuration

The application is configured to use **Indian Rupees (₹)** as the default currency. All amounts throughout the application will be displayed in INR format using the Indian numbering system.

## Application Features

### Authentication Flow
- **Homepage**: Shows login/signup form for unauthenticated users
- **Setup Screen**: Displays configuration instructions if Supabase is not set up
- **Protected Pages**: Dashboard, Accounts, Transactions, Categories, and Reports require authentication
- **User Menu**: Available in the top-right corner for authenticated users with logout option

### Navigation
- **Responsive Sidebar**: Collapsible navigation that works on desktop and mobile
- **Keyboard Shortcut**: Press `Ctrl/Cmd + B` to toggle the sidebar
- **Active States**: Current page is highlighted in the navigation

## Troubleshooting

### "Setup Required" Screen
If you see a setup screen instead of the login form:
1. Check that `.env.local` file exists in the root directory
2. Verify that both environment variables are set correctly
3. Ensure the Supabase URL is valid (starts with `https://`)
4. Restart the development server after adding environment variables

### Authentication Errors
- **Invalid credentials**: Check your Supabase anon key
- **Email not confirmed**: Check your email for confirmation link
- **Network errors**: Verify your Supabase URL is correct

### Build Errors
- Run `npm run build` to check for TypeScript and ESLint errors
- All errors should be resolved in the current version

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Library**: shadcn/ui with Tailwind CSS
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Currency**: Indian Rupees (INR) with proper formatting

## Next Steps

Once authentication is working:

1. **Database Schema**: Create tables for accounts, transactions, categories
2. **CRUD Operations**: Add/edit/delete functionality
3. **Data Visualization**: Charts and reports with real data
4. **Advanced Features**: Budgets, recurring transactions, export functionality

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify your Supabase configuration
3. Ensure all environment variables are set correctly
4. Restart the development server after configuration changes 