# 💰 Expense Manager App

A modern, full-featured personal expense management application built with Next.js, TypeScript, and PostgreSQL. Track your income, expenses, and transfers across multiple accounts with powerful filtering, categorization, and advanced analytics features.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Latest-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1.10-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.19.2-green?style=flat-square&logo=node.js)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **🚀 Recently Migrated:** Successfully migrated from Supabase to PostgreSQL with enhanced performance and security

## Table of Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Technology Stack](#️-technology-stack)
- [Project Structure](#-project-structure)
- [Usage Guide](#-usage-guide)
- [Available Scripts](#-available-scripts)
- [Environment Variables](#-environment-variables)
- [Database Setup](#-database-setup)
- [API Routes](#-api-routes)
- [Deployment](#-deployment)
- [Recent Updates](#-recent-updates)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

## ✨ Features

### 🏦 Account Management
- **Multiple Account Types**: Support for savings, checking, credit cards, investments, cash, loans, and other account types
- **Multi-Currency Support**: Track accounts in INR, USD, EUR, and GBP with automatic currency formatting
- **Advanced Credit Card Management**: 
  - Credit limit tracking with usage percentage calculations
  - Bill generation and payment due dates
  - Current bill status tracking (paid/unpaid)
  - Credit usage visualization with progress bars
- **Real-time Balance Updates**: Automatic balance calculations with transaction processing
- **Smart Sorting**: Accounts are automatically sorted by type first, then alphabetically by name
- **Account Status Management**: Active, inactive, and closed account states
- **Fixed Date Handling**: Resolved timezone issues for accurate account opening dates

### 💸 Transaction Management
- **Three Transaction Types**: 
  - **Deposits**: Income and money received
  - **Withdrawals**: Expenses and money spent
  - **Transfers**: Money moved between your accounts with dual-account tracking
- **Smart Categorization**: Organize expenses with custom categories and auto-creation during import
- **Payee Management**: Track who you pay or receive money from with detailed payee profiles
- **Transaction Status Tracking**: Pending, completed, and cancelled transaction states
- **Advanced Filtering & Search**: 
  - Multi-select accounts filter for viewing specific account transactions
  - Filter by transaction type, status, and date ranges
  - Full-text search across transaction notes and payee names
- **Bulk CSV Import**: Import transactions from CSV files with intelligent parsing and validation
- **Auto-Entity Creation**: Automatically create missing categories and payees during import

### 💳 Credit Card Bill Management
- **Comprehensive Bill Tracking**: 
  - Automatic bill generation based on billing cycles
  - Bill status tracking (generated, paid, overdue, partial)
  - Payment tracking with partial payment support
- **Credit Card Dashboard**: 
  - Credit usage visualization with progress indicators
  - Available credit calculations
  - Next bill generation and payment due date notifications
- **Bill History & Analytics**: 
  - Complete bill history with payment records
  - Overdue and upcoming bill alerts
  - Credit utilization trends and insights
- **Payment Integration**: Mark bills as paid with transaction linking

### 📊 Advanced Reports & Analytics
- **Interactive Dashboard**: 
  - Real-time income vs expense tracking for current financial year
  - Monthly and yearly trend analysis
  - Account balance summaries with change indicators
  - Visual charts with responsive design
- **Custom Report Builder**: 
  - Advanced filtering by accounts, categories, payees, and date ranges
  - Multiple chart types (bar, line, pie, area charts)
  - Export capabilities for reports and data
- **Performance Metrics**: 
  - Net income calculations
  - Spending pattern analysis by category
  - Account performance tracking

### 🔄 CSV Import & Export Features
- **Transaction Import**: 
  - Support for complex CSV formats with multiple columns
  - Intelligent date parsing (DD-MM-YYYY format)
  - Transfer transaction detection and processing
  - Validation with detailed error reporting
- **Category & Payee Bulk Import**: 
  - CSV import for categories and payees
  - Duplicate detection and prevention
  - Progress tracking with real-time updates
  - Sample CSV template downloads
- **Error Handling & Validation**: 
  - Comprehensive validation for all imported data
  - Preview mode before final import
  - Detailed error messages for failed entries
  - Batch processing with progress indicators

### 🔐 Security & Authentication
- **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
- **Password Security**: bcryptjs encryption for secure password storage
- **Protected Routes**: Comprehensive route protection for all sensitive data
- **Session Management**: Automatic session handling with secure token refresh
- **Server-side Validation**: All inputs validated on both client and server
- **Error Boundaries**: Graceful error handling throughout the application

### 🎨 Modern UI/UX
- **Responsive Design**: Seamless experience on desktop, tablet, and mobile devices
- **Accessible Design**: Built with accessibility best practices and ARIA support
- **Intuitive Interface**: Clean, modern design with excellent user experience
- **Enhanced Calendar**: Month and year selection with keyboard navigation
- **Loading States**: Smooth loading indicators and skeleton UI
- **Toast Notifications**: Real-time feedback for all user actions
- **Form Validation**: Advanced form validation with Zod schemas and real-time feedback

### 🛠️ Advanced Technical Features
- **PostgreSQL Integration**: High-performance database with custom functions
- **API Layer**: Complete RESTful API with proper error handling
- **Real-time Updates**: Automatic balance recalculation on transaction changes
- **Database Functions**: Custom PostgreSQL functions for complex calculations
- **Optimized Queries**: Efficient database queries with proper indexing
- **Type Safety**: Full TypeScript implementation with comprehensive type definitions
- **Connection Pooling**: Optimized database connections for better performance

## 📸 Screenshots

### Dashboard
![Dashboard](screens/dashboard.jpg)

### Accounts Management
![Accounts](screens/accounts.jpg)
![Add Account](screens/add_account.jpg)
![Credit Card Account](screens/credit_card.jpg)

### Transaction Management
![Transactions](screens/transactions.jpg)
![Add Transaction](screens/add_transaction.jpg)
![Import Transactions](screens/import_transactions.jpg)

### Categories & Payees
![Categories](screens/categories.jpg)
![Payees](screens/payees.jpg)

### Reports & Analytics
![Report 1](screens/report_1.jpg)
![Report 2](screens/report_2.jpg)

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.19.2 or higher
- **npm** or **yarn** package manager
- **PostgreSQL** 12+ database server

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/expense-manager-app.git
   cd expense-manager-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL database**
   ```bash
   # Create database and user
   sudo -u postgres psql
   CREATE DATABASE expense_manager;
   CREATE USER expense_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expense_manager TO expense_user;
   ```

4. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=postgresql://expense_user:your_secure_password@localhost:5432/expense_manager
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   NODE_ENV=development
   ```

5. **Initialize database schema**
   ```bash
   npm run db:setup
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠️ Technology Stack

### Frontend
- **[Next.js 15.3.4](https://nextjs.org/)** - React framework with App Router
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript with comprehensive type definitions
- **[Tailwind CSS 4.1.10](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Shadcn/ui](https://ui.shadcn.com/)** - Beautiful, customizable component library

### Backend & Database
- **[PostgreSQL](https://www.postgresql.org/)** - Advanced relational database with custom functions
- **[Node.js](https://nodejs.org/)** - JavaScript runtime with connection pooling
- **[pg](https://node-postgres.com/)** - PostgreSQL client for Node.js

### Authentication & Security
- **[JSON Web Tokens](https://jwt.io/)** - Secure token-based authentication
- **[bcryptjs](https://github.com/dcodeIO/bcrypt.js/)** - Password hashing and security
- **HTTP-only Cookies** - Secure token storage

### Form Management & Validation
- **[React Hook Form](https://react-hook-form.com/)** - Performant forms with easy validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Validation resolver integration

### Data Visualization & Analytics
- **[Recharts](https://recharts.org/)** - Powerful chart library for React
- **[date-fns](https://date-fns.org/)** - Modern JavaScript date utility library
- **Custom Report Builder** - Advanced reporting with interactive charts

### UI Components & Icons
- **[Lucide React](https://lucide.dev/)** - Beautiful & consistent icon set
- **[cmdk](https://cmdk.paco.me/)** - Command palette component
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[React Day Picker](https://react-day-picker.js.org/)** - Date picker component

### File Processing
- **[XLSX](https://sheetjs.com/)** - Excel and CSV file processing library
- **CSV Parser** - Custom CSV parsing with validation and error handling

## 📁 Project Structure

```
expense-manager-app/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── accounts/          # Account management page
│   │   ├── categories/        # Category management with CSV import
│   │   ├── credit-cards/      # Credit card bill management
│   │   ├── dashboard/         # Main dashboard with analytics
│   │   ├── payees/           # Payee management with CSV import
│   │   ├── reports/          # Advanced reports and analytics
│   │   ├── transactions/     # Transaction management with import
│   │   └── api/              # API routes for all entities
│   │       ├── accounts/     # Account CRUD operations
│   │       ├── auth/         # Authentication endpoints
│   │       ├── categories/   # Category management API
│   │       ├── credit-card-bills/ # Credit card bill API
│   │       ├── payees/       # Payee management API
│   │       └── transactions/ # Transaction CRUD operations
│   ├── components/            # Reusable React components
│   │   ├── accounts/         # Account-specific components
│   │   ├── auth/             # Authentication components
│   │   ├── categories/       # Category components with CSV import
│   │   ├── dashboard/        # Dashboard summary cards and charts
│   │   ├── layout/           # Layout components with navigation
│   │   ├── payees/           # Payee components with CSV import
│   │   ├── reports/          # Advanced report builder components
│   │   ├── transactions/     # Transaction components with import
│   │   └── ui/               # Base UI components (shadcn/ui)
│   ├── hooks/                # Custom React hooks for data management
│   ├── lib/                  # Utility libraries and configurations
│   │   ├── services/         # API service functions for all entities
│   │   ├── validations/      # Zod validation schemas
│   │   ├── auth-client.ts    # Client-side authentication utilities
│   │   ├── auth-server.ts    # Server-side authentication
│   │   ├── database.ts       # PostgreSQL connection and utilities
│   │   └── utils.ts          # General utility functions
│   └── types/                # TypeScript type definitions
│       ├── account.ts        # Account and credit card types
│       ├── category.ts       # Category management types
│       ├── credit-card.ts    # Credit card bill management types
│       ├── payee.ts          # Payee management types
│       ├── report.ts         # Report and analytics types
│       └── transaction.ts    # Transaction types with import support
├── scripts/                  # Database setup and utility scripts
│   └── setup-database.js    # Database schema initialization
├── public/                   # Static assets and sample files
├── screens/                  # Screenshot images for documentation
└── docs/                     # Additional documentation files
```

## 🎯 Usage Guide

### Account Management
1. Navigate to **Accounts** page
2. Click **Add Account** to create new accounts
3. Configure account type, currency, and initial balance
4. For **credit cards**, set credit limits, bill generation dates, and payment due dates
5. View real-time credit usage with visual progress indicators
6. **Fixed Issue**: Account opening dates now save correctly without timezone-related date shifts

### Transaction Management
1. Go to **Transactions** page
2. Click **Add Transaction**
3. Choose transaction type:
   - **Deposit**: Money coming in (income, refunds, etc.)
   - **Withdrawal**: Money going out (expenses, purchases, etc.)
   - **Transfer**: Moving money between your accounts
4. Fill in details including payee, category, and notes
5. Use advanced filtering to find specific transactions

### CSV Import Features
- **Transaction Import**: Support for complex CSV formats with intelligent parsing
- **Category/Payee Import**: Bulk creation with validation and duplicate detection
- **Progress Tracking**: Real-time import progress with detailed error reporting
- **Sample Templates**: Download CSV templates for proper formatting

### Credit Card Management
1. Create credit card accounts with proper limits and billing cycles
2. View **Credit Cards** page for comprehensive bill management
3. Track credit usage, upcoming bills, and payment due dates
4. Mark bills as paid and view payment history

### Reports & Analytics
1. Navigate to **Reports** page for advanced analytics
2. Use **Dashboard** for quick financial overview
3. Create custom reports with multiple chart types
4. Filter by date ranges, accounts, categories, and payees

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build optimized production bundle
npm run start        # Start production server
npm run lint         # Run ESLint for code quality

# Database
npm run db:setup     # Initialize database schema

# Type checking
npx tsc --noEmit     # Check TypeScript types without compilation
```

## 🌐 Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database Configuration (Required)
DATABASE_URL=postgresql://username:password@localhost:5432/expense_manager

# Authentication (Required)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Environment
NODE_ENV=development

# Optional: Custom configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 🗄️ Database Setup

### Manual Setup

1. **Install PostgreSQL** (if not already installed)
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS with Homebrew
   brew install postgresql
   brew services start postgresql
   
   # Windows - Download from postgresql.org
   ```

2. **Create Database and User**
   ```bash
   sudo -u postgres psql
   ```
   ```sql
   CREATE DATABASE expense_manager;
   CREATE USER expense_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE expense_manager TO expense_user;
   \q
   ```

3. **Run Database Setup Script**
   ```bash
   npm run db:setup
   ```

### Docker Setup (Alternative)

```bash
# Run PostgreSQL in Docker
docker run --name expense-postgres \
  -e POSTGRES_DB=expense_manager \
  -e POSTGRES_USER=expense_user \
  -e POSTGRES_PASSWORD=your_secure_password \
  -p 5432:5432 -d postgres:14

# Initialize schema
npm run db:setup
```

## 🌐 API Routes

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/session` - Get current session

### Accounts
- `GET /api/accounts` - List all accounts
- `POST /api/accounts` - Create new account
- `PUT /api/accounts/[id]` - Update account
- `DELETE /api/accounts/[id]` - Delete account
- `POST /api/accounts/recalculate-balances` - Recalculate account balances

### Transactions
- `GET /api/transactions` - List transactions with filtering
- `POST /api/transactions` - Create new transaction
- `PUT /api/transactions/[id]` - Update transaction
- `DELETE /api/transactions/[id]` - Delete transaction

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/[id]` - Update category
- `DELETE /api/categories/[id]` - Delete category

### Payees
- `GET /api/payees` - List all payees
- `POST /api/payees` - Create new payee
- `PUT /api/payees/[id]` - Update payee
- `DELETE /api/payees/[id]` - Delete payee

### Credit Card Bills
- `GET /api/credit-card-bills` - List credit card bills
- `POST /api/credit-card-bills` - Create new bill
- `PUT /api/credit-card-bills/[id]` - Update bill
- `POST /api/credit-card-bills/[id]/payment` - Mark bill as paid

### Health Check
- `GET /api/health` - Application health status

## 🚀 Deployment

### Production Environment Setup

1. **Database Configuration**
   ```env
   DATABASE_URL=postgresql://user:password@your-db-host:5432/expense_manager
   JWT_SECRET=your-production-jwt-secret-key
   NODE_ENV=production
   ```

2. **Build Application**
   ```bash
   npm run build
   ```

3. **Start Production Server**
   ```bash
   npm run start
   ```

### Deploy on Vercel

1. Push your code to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Set environment variables in Vercel dashboard
4. Configure PostgreSQL database (Vercel Postgres, Railway, etc.)
5. Deploy automatically on every push

### Deploy on Railway

1. Connect to [Railway](https://railway.app)
2. Create PostgreSQL database service
3. Deploy Next.js application
4. Configure environment variables
5. Set up custom domain if needed

### Self-Hosted Deployment

1. Set up PostgreSQL server
2. Configure reverse proxy (nginx/Apache)
3. Set up SSL certificates
4. Deploy with PM2 or Docker
5. Configure automatic backups

## 🆕 Recent Updates & Features

### Version 2.0 - PostgreSQL Migration ✅
- **Complete Migration**: Successfully migrated from Supabase to PostgreSQL
- **Enhanced Performance**: Connection pooling and optimized queries
- **Improved Security**: JWT authentication with HTTP-only cookies
- **API Layer**: Complete RESTful API with proper error handling
- **Build Optimization**: Zero build errors, optimized bundle sizes

### Bug Fixes & Improvements
- **Fixed Date Handling**: Resolved account opening date timezone issues
- **Enhanced Validation**: Improved date parsing and validation
- **Real-time Updates**: Fixed transaction creation with complete data fetching
- **Performance**: Optimized database queries and connection management

### New Features
- **Credit Card Bill Management**: Complete bill tracking and payment system
- **Advanced Analytics**: Enhanced dashboard with financial year data
- **Improved CSV Import**: Better error handling and progress tracking
- **Enhanced Security**: Server-side validation and protected routes

### Technical Improvements
- **Type Safety**: Complete TypeScript implementation
- **Error Handling**: Comprehensive error boundaries and validation
- **Code Quality**: ESLint compliance and clean architecture
- **Documentation**: Updated README and comprehensive inline documentation

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow TypeScript best practices
   - Add comprehensive comments and documentation
   - Include proper error handling
4. **Test your changes**
   ```bash
   npm run build  # Ensure build succeeds
   npm run lint   # Check code quality
   ```
5. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature with detailed description'
   ```
6. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
7. **Open a Pull Request**

### Development Guidelines

- **TypeScript**: Strict type checking with comprehensive type definitions
- **Code Style**: Follow existing patterns and ESLint configuration
- **Documentation**: Add inline comments and update README as needed
- **Testing**: Ensure all functionality works before submitting
- **Security**: Follow security best practices for authentication and validation

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, issues, or feature requests:

- **GitHub Issues**: [Create an issue](https://github.com/your-username/expense-manager-app/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/expense-manager-app/discussions)
- **Documentation**: Check inline code comments and this README

### Common Issues & Solutions

- **Database Connection**: Verify PostgreSQL is running and credentials are correct
- **Date Issues**: Ensure timezone settings are properly configured
- **CSV Import**: Check file format matches expected columns and data types
- **Build Errors**: Run `npm run lint` and fix any TypeScript/ESLint issues

---

<div align="center">
  <p>Made with ❤️ for better financial management</p>
  <p>⭐ Star this repo if you find it helpful!</p>
  <p><strong>Built with modern technologies for reliable expense tracking</strong></p>
</div>
