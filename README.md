# Personal Expense Management App

This is a web application for personal expense management, built with the Next.js framework. It is inspired by the functionality of [Money Manager EX](https://github.com/moneymanagerex/moneymanagerex).

## Features

- **Dashboard:** A summary view of your financial health, including balances and recent activity.
- **Accounts:** Manage multiple accounts (Checking, Savings, Credit Card, etc.).
- **Transactions:** Track income, expenses, and transfers between accounts.
- **Categories:** Organize your transactions with customizable categories.
- **Budgets:** Set monthly budgets for different spending categories.
- **Reports:** Visualize your financial data with charts and reports.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Database:** [MongoDB](https://www.mongodb.com/)
- **UI:** [Shadcn/UI](https://ui.shadcn.com/) & [Tailwind CSS](https://tailwindcss.com/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **ORM:** [Mongoose](https://mongoosejs.com/)
- **Language:** [TypeScript](https://www.typescriptlang.org/)

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
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/app/`: Contains the core application logic and pages (using the App Router).
- `src/components/`: Shared React components.
- `src/lib/`: Utility functions (e.g., database connection).
- `src/models/`: Mongoose schemas and models.
- `public/`: Static assets.

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
