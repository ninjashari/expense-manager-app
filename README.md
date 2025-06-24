# 💰 Expense Manager App

A modern, full-featured personal expense management application built with Next.js, TypeScript, and Supabase. Track your income, expenses, and transfers across multiple accounts with powerful filtering and categorization features.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.10-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

## ✨ Features

### 🏦 Account Management
- **Multiple Account Types**: Support for savings, checking, credit cards, investments, cash, loans, and more
- **Multi-Currency Support**: Track accounts in INR, USD, EUR, and GBP
- **Credit Card Management**: Specialized features for credit limit tracking, due dates, and usage monitoring
- **Real-time Balance Updates**: Automatic balance calculations with transaction processing
- **Smart Sorting**: Accounts are automatically sorted by type first, then alphabetically by name for organized navigation

### 💸 Transaction Management
- **Three Transaction Types**: 
  - **Deposits**: Income and money received
  - **Withdrawals**: Expenses and money spent
  - **Transfers**: Money moved between your accounts
- **Smart Categorization**: Organize expenses with custom categories
- **Payee Management**: Track who you pay or receive money from
- **Advanced Filtering**: Filter by accounts (multi-select), transaction type, status, and search
- **Bulk Operations**: Edit and manage multiple transactions efficiently

### 📊 Reporting & Analytics
- **Transaction History**: Comprehensive view of all financial activities
- **Account Balances**: Real-time balance tracking across all accounts
- **Category Insights**: Understand spending patterns by category
- **Date Range Filtering**: Analyze transactions over specific periods

### 🔐 Security & Privacy
- **User Authentication**: Secure login with Supabase Auth
- **Row Level Security**: Data isolation between users
- **Protected Routes**: Secure access to sensitive financial data
- **Data Encryption**: All sensitive data encrypted at rest

### 🎨 Modern UI/UX
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode**: Comfortable viewing in any lighting condition
- **Accessible**: Built with accessibility best practices
- **Intuitive Interface**: Clean, modern design with excellent user experience
- **Enhanced Calendar**: Month and year selection with keyboard navigation and accessibility features

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.19.2 or higher
- **npm** or **yarn** package manager
- **Supabase** account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/expense-manager-app.git
   cd expense-manager-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   
   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy the contents of src/lib/database-schema.sql
   # and execute it in your Supabase project's SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend
- **[Next.js 15.3.4](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Shadcn/ui](https://ui.shadcn.com/)** - Beautiful component library

### Backend & Database
- **[Supabase](https://supabase.com/)** - Backend-as-a-Service with PostgreSQL
- **[PostgreSQL](https://www.postgresql.org/)** - Robust relational database
- **Row Level Security** - Database-level security policies

### Form & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Validation resolver for React Hook Form

### UI & Icons
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon set
- **[date-fns](https://date-fns.org/)** - Modern JavaScript date utility library
- **[cmdk](https://cmdk.paco.me/)** - Command palette component
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications

## 📁 Project Structure

```
expense-manager-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── accounts/          # Account management page
│   │   ├── categories/        # Category management page  
│   │   ├── dashboard/         # Main dashboard
│   │   ├── payees/           # Payee management page
│   │   ├── reports/          # Reports and analytics
│   │   └── transactions/     # Transaction management page
│   ├── components/            # Reusable React components
│   │   ├── accounts/         # Account-specific components
│   │   ├── auth/             # Authentication components
│   │   ├── categories/       # Category components (includes CSV import)
│   │   ├── layout/           # Layout components
│   │   ├── payees/           # Payee components (includes CSV import)
│   │   ├── transactions/     # Transaction components
│   │   └── ui/               # Base UI components (shadcn/ui)
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility libraries and configurations
│   │   ├── services/         # API service functions
│   │   └── validations/      # Zod validation schemas
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
└── docs/                     # Documentation files
```

## 🎯 Usage

### Managing Accounts
1. Navigate to **Accounts** page
2. Click **Add Account** to create new accounts
3. Configure account type, currency, and initial balance
4. For credit cards, set credit limits and payment dates
5. Accounts are automatically sorted by type, then alphabetically by name for organized browsing

### Recording Transactions
1. Go to **Transactions** page
2. Click **Add Transaction**
3. Choose transaction type:
   - **Deposit**: Money coming in
   - **Withdrawal**: Money going out  
   - **Transfer**: Moving money between accounts
4. Fill in details and save

### Filtering & Search
- Use the **search bar** to find specific transactions
- Filter by **transaction type** (deposit, withdrawal, transfer)
- Filter by **status** (completed, pending, cancelled)
- Use **multi-select accounts filter** to view transactions from specific accounts

### Categories & Payees
- Create **categories** to organize your expenses
- Add **payees** to track who you transact with
- Categories and payees can be created on-the-fly when adding transactions

### CSV Import
1. Navigate to **Categories** or **Payees** page
2. Click **Import CSV** button
3. Select your CSV file (must have .csv extension)
4. Review the import preview showing:
   - Valid entries to be imported
   - Duplicate entries (will be skipped)
   - Invalid entries with error messages
5. Click **Import** to process the file
6. Monitor progress with real-time progress bar
7. Review import results summary

**CSV Format Requirements:**
- One name per line (categories or payees)
- Optional header row
- Names must be 2-50 characters (categories) or 2-100 characters (payees)
- Allowed characters: letters, numbers, spaces, and common punctuation

### CSV Import Features
- **Bulk Import**: Import multiple categories or payees at once from CSV files
- **Progress Tracking**: Real-time progress bars during import operations
- **Error Handling**: Detailed error messages for failed imports with validation
- **Duplicate Detection**: Automatic detection and skipping of duplicate entries
- **Sample Downloads**: One-click download of sample CSV templates
- **Batch Processing**: Efficient processing of large CSV files with performance optimization

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npx tsc --noEmit     # Check TypeScript types
```

## 🌐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Custom configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🚀 Deployment

### Deploy on Vercel

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Deploy automatically on every push

### Deploy on Netlify

1. Build the application: `npm run build`
2. Deploy the `out` folder to Netlify
3. Configure environment variables
4. Set up continuous deployment

### Self-Hosted

1. Build the application: `npm run build`
2. Start the production server: `npm run start`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add some amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Next.js](https://nextjs.org/)** for the amazing React framework
- **[Supabase](https://supabase.com/)** for the backend infrastructure
- **[Shadcn/ui](https://ui.shadcn.com/)** for the beautiful component library
- **[Vercel](https://vercel.com/)** for hosting and deployment platform

## 🆕 Recent Updates

### Latest Features
- **CSV Import for Categories & Payees**: Bulk import functionality with progress tracking and error handling
- **Enhanced Calendar Widget**: Month and year selection with improved accessibility
- **Smart Account Sorting**: Accounts are now sorted by type first, then alphabetically by name
- **Multi-Select Account Filtering**: Advanced filtering for transactions by multiple accounts
- **Transaction Form Improvements**: Better validation and user experience

### Performance Improvements
- Optimized batch processing for large CSV imports
- Enhanced database queries with proper indexing
- Improved form validation and error handling
- Better responsive design for mobile devices

## 📞 Support

If you have any questions or need help:

- 📧 **Email**: your-email@example.com
- 💬 **Issues**: [GitHub Issues](https://github.com/your-username/expense-manager-app/issues)
- 📖 **Documentation**: [Wiki](https://github.com/your-username/expense-manager-app/wiki)

---

<div align="center">
  <p>Made with ❤️ for better financial management</p>
  <p>⭐ Star this repo if you find it helpful!</p>
</div>
