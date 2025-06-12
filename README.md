# Personal Expense Management App

This is a web application for personal expense management, built with the Next.js framework. It is inspired by the functionality of [Money Manager EX](https://github.com/moneymanagerex/moneymanagerex).

## Features

- **Dashboard:** A summary view of your financial health, including balances and recent activity with multi-currency support.
- **Accounts:** Manage multiple accounts (Checking, Savings, Credit Card, etc.) with credit card utilization tracking.
- **Transactions:** Track income, expenses, and transfers between accounts.
- **Categories:** Organize your transactions with customizable categories.
- **Budgets:** Set monthly budgets for different spending categories.
- **Reports:** Visualize your financial data with charts and reports.
- **🆕 AI-Powered CSV Import:** Intelligent CSV file analysis and import with automatic column mapping.
- **🆕 Multi-Currency Support:** Handle multiple currencies with automatic conversion rates.
- **🆕 Import History:** Track and manage your CSV import history with detailed analytics.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **UI:** [Shadcn/UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **ORM:** [Mongoose](https://mongoosejs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **AI Analysis:** [Puter.js](https://puter.com/) (Free AI with robust fallback)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/)
- **Data Fetching:** [TanStack Query](https://tanstack.com/query)

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- A MongoDB database (you can get a free one from [MongoDB Atlas](https://www.mongodb.com/atlas/database))

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    cd your-repo-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a file named `.env.local` in the root of the project and add the following variables.

    ```env
    # MongoDB Connection String from MongoDB Atlas
    MONGODB_URI="your_mongodb_connection_string"

    # NextAuth.js Configuration
    # Generate a secret using: openssl rand -base64 32
    NEXTAUTH_SECRET="your_nextauth_secret"
    NEXTAUTH_URL="http://localhost:3000"

    # AI Analysis (Automatic - no setup required)
    # Powered by Puter.js - provides free AI analysis
    # No API key needed - works automatically

    # Currency Exchange API (Optional - for multi-currency support)
    # Get free API key from: https://exchangerate-api.com/
    EXCHANGE_RATE_API_KEY="your_exchange_rate_api_key_here"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## CSV Import Feature

The application includes an intelligent CSV import system that can automatically analyze and import your financial data:

### Supported Data Types
- **Transactions:** Date, amount, payee, account, category, notes
- **Accounts:** Name, type, currency, balance
- **Categories:** Name, type (income/expense)

### AI Analysis
- **Automatic Column Detection:** Uses AI to identify column types and suggest mappings
- **Smart Fallback:** If AI is unavailable, uses advanced pattern matching
- **No Setup Required:** Works automatically with Puter.js integration
- **Completely Free:** Unlimited AI analysis with no API keys or quotas

### Import Process
1. Upload your CSV file
2. AI analyzes the structure and suggests column mappings
3. Review and adjust mappings as needed
4. Preview the data before importing
5. Import with validation and error reporting

## Project Structure

- `src/app/`: Contains the core application logic and pages (using the App Router).
- `src/components/`: Shared React components including import functionality.
- `src/lib/`: Utility functions (e.g., database connection, AI analysis).
- `src/models/`: Mongoose schemas and models.
- `src/hooks/`: Custom React hooks for data fetching.
- `public/`: Static assets.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✅ | NextAuth.js secret key |
| `NEXTAUTH_URL` | ✅ | Application URL |
| `PUTER_JS_ENABLED` | ❌ | Automatic: Free AI analysis via Puter.js |
| `EXCHANGE_RATE_API_KEY` | ❌ | Optional: Real-time currency rates |

## Key Features Implemented

### ✅ Core Functionality
- User authentication and registration
- Account management with multiple currencies
- Transaction tracking and categorization
- Budget creation and monitoring
- Financial reports and analytics
- Dashboard with comprehensive overview

### ✅ Advanced Features
- AI-powered CSV import with intelligent column mapping
- Multi-currency support with conversion rates
- Credit card utilization tracking
- Import history and management
- Responsive design with modern UI
- Real-time data validation

### ✅ Technical Excellence
- Full TypeScript implementation
- Comprehensive error handling
- Production-ready build system
- No external API dependencies (all features work offline)
- Robust fallback systems for all AI features

## Action Plan

The detailed implementation plan is documented in [ACTION_PLAN.md](ACTION_PLAN.md).

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
