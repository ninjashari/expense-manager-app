/**
 * Income vs Expenses Report API
 * 
 * This module provides data for the Income vs Expenses bar chart on the dashboard.
 * It aggregates transaction data by time periods (monthly, weekly, or daily) and
 * returns income and expense totals for visualization.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, format, subMonths, subWeeks, subDays } from "date-fns";

import { connectDB } from "@/lib/db";
import Transaction from "@/models/transaction.model";
import Account from "@/models/account.model";
import { authOptions } from "@/lib/auth-config";
import { getExchangeRate } from "@/lib/currency-converter";

// Validation schema for query parameters
const querySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly']).default('monthly'),
  periods: z.string().optional().transform(val => val ? parseInt(val) : 6), // Number of periods to show
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  accountId: z.string().optional(),
});

interface IncomeExpenseData {
  period: string;
  income: number;
  expenses: number;
  net: number;
  date: string; // ISO date string for sorting
}

interface IncomeExpenseResponse {
  data: IncomeExpenseData[];
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
    currency: string;
    periodType: string;
    periodsCount: number;
  };
  conversionInfo?: {
    hasMultipleCurrencies: boolean;
    baseCurrency: string;
    exchangeRates?: Record<string, number>;
  };
}

/**
 * GET /api/reports/income-vs-expenses
 * Get income vs expenses data for chart visualization
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching income vs expenses data...");
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    const userCurrency = user.currency || 'USD';
    console.log("Session found for user:", user.id, "Currency:", userCurrency);

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    const validatedQuery = querySchema.parse(queryParams);

    console.log("Query parameters:", validatedQuery);

    // Determine date range
    let fromDate: Date;
    let toDate: Date;

    if (validatedQuery.from && validatedQuery.to) {
      fromDate = new Date(validatedQuery.from);
      toDate = new Date(validatedQuery.to);
    } else {
      // Generate date range based on period and periods count
      const now = new Date();
      const periodsCount = validatedQuery.periods || 6;

      switch (validatedQuery.period) {
        case 'daily':
          fromDate = subDays(now, periodsCount - 1);
          toDate = now;
          break;
        case 'weekly':
          fromDate = subWeeks(startOfWeek(now), periodsCount - 1);
          toDate = endOfWeek(now);
          break;
        case 'monthly':
        default:
          fromDate = subMonths(startOfMonth(now), periodsCount - 1);
          toDate = endOfMonth(now);
          break;
      }
    }

    console.log("Date range:", { fromDate, toDate });

    // Build transaction filter
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transactionFilter: Record<string, any> = {
      userId: user.id,
      date: {
        $gte: fromDate,
        $lte: toDate,
      },
    };

    if (validatedQuery.accountId) {
      transactionFilter.account = validatedQuery.accountId;
    }

    // Get transactions with account information
    const transactions = await Transaction.find(transactionFilter)
      .populate('account', 'name currency type')
      .sort({ date: 1 });

    console.log("Found transactions:", transactions.length);

    // Get all user accounts for currency conversion
    const accounts = await Account.find({ userId: user.id });
    const hasMultipleCurrencies = accounts.some(account => account.currency !== userCurrency);

    // Group transactions by period
    const periodData = new Map<string, { income: number; expenses: number; date: Date }>();

    for (const transaction of transactions) {
      const transactionDate = new Date(transaction.date);
      let periodKey: string;
      let periodDate: Date;

      // Determine period key and date based on period type
      switch (validatedQuery.period) {
        case 'daily':
          periodKey = format(transactionDate, 'yyyy-MM-dd');
          periodDate = startOfDay(transactionDate);
          break;
        case 'weekly':
          const weekStart = startOfWeek(transactionDate);
          periodKey = format(weekStart, 'yyyy-MM-dd');
          periodDate = weekStart;
          break;
        case 'monthly':
        default:
          periodKey = format(transactionDate, 'yyyy-MM');
          periodDate = startOfMonth(transactionDate);
          break;
      }

      // Initialize period data if not exists
      if (!periodData.has(periodKey)) {
        periodData.set(periodKey, { income: 0, expenses: 0, date: periodDate });
      }

      const period = periodData.get(periodKey)!;
      let amount = transaction.amount;

      // Convert currency if needed
      if (hasMultipleCurrencies && transaction.account.currency !== userCurrency) {
        try {
          const exchangeRate = await getExchangeRate(transaction.account.currency, userCurrency);
          amount = Math.round(amount * exchangeRate);
        } catch (error) {
          console.warn(`Failed to convert ${transaction.account.currency} to ${userCurrency}:`, error);
          // Use original amount as fallback
        }
      }

      // Add to appropriate category
      if (transaction.type === 'Income') {
        period.income += amount;
      } else if (transaction.type === 'Expense') {
        period.expenses += amount;
      }
    }

    // Convert map to array and sort by date
    const data: IncomeExpenseData[] = Array.from(periodData.entries())
      .map(([, periodData]) => {
        let periodLabel: string;
        
        switch (validatedQuery.period) {
          case 'daily':
            periodLabel = format(periodData.date, 'MMM dd');
            break;
          case 'weekly':
            periodLabel = format(periodData.date, 'MMM dd');
            break;
          case 'monthly':
          default:
            periodLabel = format(periodData.date, 'MMM yyyy');
            break;
        }

        return {
          period: periodLabel,
          income: periodData.income,
          expenses: periodData.expenses,
          net: periodData.income - periodData.expenses,
          date: periodData.date.toISOString(),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate summary
    const summary = {
      totalIncome: data.reduce((sum, item) => sum + item.income, 0),
      totalExpenses: data.reduce((sum, item) => sum + item.expenses, 0),
      netAmount: data.reduce((sum, item) => sum + item.net, 0),
      currency: userCurrency,
      periodType: validatedQuery.period,
      periodsCount: data.length,
    };

    const response: IncomeExpenseResponse = {
      data,
      summary,
      conversionInfo: hasMultipleCurrencies ? {
        hasMultipleCurrencies: true,
        baseCurrency: userCurrency,
      } : undefined,
    };

    console.log("Income vs expenses data generated successfully");
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/reports/income-vs-expenses:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error fetching income vs expenses data", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 