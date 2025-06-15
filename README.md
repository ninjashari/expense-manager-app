# 💰 Expense Manager - Personal Finance Management System

A modern, full-stack expense management application built with Next.js 15, featuring multi-currency support, AI-powered CSV import, and comprehensive financial tracking capabilities.

## 🌟 Features

### Core Functionality
- **🔐 Secure Authentication** - NextAuth.js with credential-based login
- **💳 Account Management** - Support for multiple account types (Checking, Savings, Credit Card, Cash, Investment)
- **📊 Transaction Tracking** - Comprehensive income, expense, and transfer management
- **🏷️ Category Management** - Customizable income and expense categories
- **💰 Multi-Currency Support** - Real-time exchange rates with intelligent caching
- **📈 Budget Management** - Set and track monthly spending limits
- **📊 Financial Reports** - Visual analytics and expense breakdowns
- **📤 CSV Import** - AI-powered transaction import with smart mapping

### Advanced Features
- **🤖 AI-Powered Import** - Intelligent CSV analysis and field mapping
- **⚡ Real-time Updates** - Optimistic updates with TanStack Query
- **🌍 Multi-Currency Dashboard** - Unified view across different currencies
- **📱 Responsive Design** - Mobile-first approach with Tailwind CSS
- **🔄 Offline Support** - Cached data for improved performance
- **🛡️ Security Headers** - Production-ready security configurations

## 🚀 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **State Management**: TanStack Query (React Query)
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts
- **Icons**: Lucide React

### Backend
- **Runtime**: Node.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js
- **Validation**: Zod
- **File Processing**: PapaParse (CSV)
- **Currency Conversion**: ExchangeRate-API

### Development & Deployment
- **Package Manager**: npm
- **Linting**: ESLint + TypeScript
- **Build Tool**: Next.js built-in bundler
- **Deployment**: Vercel (recommended)

## 📋 Prerequisites

- Node.js 18.17 or later
- MongoDB database (local or MongoDB Atlas)
- ExchangeRate-API key (optional, for currency conversion)

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd expense-management/expense-manager-app
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/expense-manager
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-manager

# Authentication
NEXTAUTH_SECRET=your-super-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Currency Exchange (Optional)
EXCHANGERATE_API_KEY=your-exchange-rate-api-key

# Environment
NODE_ENV=development
```

### 4. Database Setup
Ensure MongoDB is running locally or your MongoDB Atlas cluster is accessible.

### 5. Run the Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access the application.

## 📁 Project Structure

```
expense-manager-app/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/        # Protected dashboard routes
│   │   ├── api/               # API routes
│   │   ├── sign-in/           # Authentication pages
│   │   └── sign-up/
│   ├── components/            # Reusable UI components
│   │   ├── ui/               # Shadcn/UI components
│   │   ├── forms/            # Form components
│   │   ├── shared/           # Shared components
│   │   └── providers/        # Context providers
│   ├── hooks/                # Custom React hooks
│   ├── lib/                  # Utility functions
│   │   ├── db.ts            # Database connection
│   │   ├── auth-config.ts   # Authentication configuration
│   │   ├── utils.ts         # General utilities
│   │   ├── currency-converter.ts # Currency conversion
│   │   └── api-helpers.ts   # API utilities
│   ├── models/               # Mongoose models
│   └── types/                # TypeScript type definitions
├── public/                   # Static assets
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.ts
```

## 🔧 Configuration

### Database Models
- **User**: User accounts with authentication and preferences
- **Account**: Financial accounts (checking, savings, etc.)
- **Category**: Income and expense categories
- **Transaction**: Financial transactions with full details
- **Budget**: Monthly budget limits per category
- **ImportHistory**: CSV import tracking and history

### API Endpoints
- `GET/POST /api/accounts` - Account management
- `GET/POST /api/categories` - Category management
- `GET/POST /api/transactions` - Transaction management
- `GET/POST /api/budgets` - Budget management
- `GET /api/summary` - Dashboard summary data
- `GET /api/reports/*` - Financial reports
- `POST /api/import/*` - CSV import functionality

## 🎯 Usage Guide

### Getting Started
1. **Sign Up**: Create a new account or sign in
2. **Add Accounts**: Set up your financial accounts
3. **Create Categories**: Define income and expense categories
4. **Add Transactions**: Start tracking your financial activities
5. **Set Budgets**: Define monthly spending limits
6. **Import Data**: Use CSV import for bulk transaction entry

### Multi-Currency Features
- Set your preferred currency in Settings
- Add accounts in different currencies
- View unified dashboard with automatic conversion
- Real-time exchange rate updates

### CSV Import
1. Navigate to Import section
2. Upload CSV file
3. AI analyzes and suggests field mappings
4. Review and confirm mappings
5. Execute import with progress tracking

## 🚀 Performance Optimizations

### Frontend Optimizations
- **Code Splitting**: Automatic route-based splitting
- **Image Optimization**: Next.js Image component with WebP/AVIF
- **Bundle Analysis**: Built-in bundle analyzer
- **Caching**: Aggressive caching with TanStack Query
- **Lazy Loading**: Component-level lazy loading

### Backend Optimizations
- **Database Connection Pooling**: Optimized MongoDB connections
- **Query Optimization**: Efficient database queries with indexing
- **Response Caching**: API response caching strategies
- **Error Handling**: Comprehensive error handling and logging

### Security Features
- **Authentication**: Secure session-based authentication
- **Input Validation**: Zod schema validation
- **Security Headers**: Production-ready security headers
- **Rate Limiting**: API rate limiting implementation
- **CSRF Protection**: Built-in CSRF protection

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- Request/response timing
- Database query performance
- Error tracking and logging
- Cache hit/miss ratios

### Business Metrics
- User engagement tracking
- Feature usage analytics
- Import success rates
- Currency conversion accuracy

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

### Manual Deployment
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Environment Variables for Production
```env
MONGODB_URI=your-production-mongodb-uri
NEXTAUTH_SECRET=your-production-secret
NEXTAUTH_URL=https://your-domain.com
EXCHANGERATE_API_KEY=your-api-key
NODE_ENV=production
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive JSDoc comments
- Implement proper error handling
- Add unit tests for new features

## 📝 API Documentation

Detailed API documentation is available in the [API Specification](./api-specification.yaml) file.

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues**
- Verify MongoDB is running
- Check connection string format
- Ensure network connectivity

**Authentication Problems**
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches your domain
- Clear browser cookies and try again

**Currency Conversion Issues**
- Verify ExchangeRate-API key is valid
- Check internet connectivity
- Review fallback rates in currency-converter.ts

**Import Failures**
- Ensure CSV format is supported
- Check file size limits
- Verify column mappings

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React framework
- [Shadcn/UI](https://ui.shadcn.com/) - Beautiful UI components
- [TanStack Query](https://tanstack.com/query) - Powerful data synchronization
- [MongoDB](https://www.mongodb.com/) - Database platform
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using modern web technologies** 