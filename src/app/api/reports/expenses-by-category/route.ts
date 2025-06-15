/**
 * Enhanced Expenses by Category Report API
 * 
 * This module provides expenses by category data with advanced filtering,
 * pagination, and multi-currency support for the reports page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/transaction.model';
import Account from '@/models/account.model';
// Category model imported for future use
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { getExchangeRate } from "@/lib/currency-converter";

// Validation schema for query parameters
const querySchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
  accountIds: z.string().optional(), // Comma-separated account IDs
  categoryIds: z.string().optional(), // Comma-separated category IDs
  transactionType: z.enum(['Income', 'Expense', 'Transfer']).optional().default('Expense'),
  amountMin: z.string().optional().transform(val => val ? parseFloat(val) * 100 : undefined), // Convert to cents
  amountMax: z.string().optional().transform(val => val ? parseFloat(val) * 100 : undefined), // Convert to cents
  payee: z.string().optional(), // Filter by payee name
  notes: z.string().optional(), // Filter by notes content
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 50),
  sortBy: z.enum(['amount', 'name', 'transactionCount']).optional().default('amount'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

interface CategoryExpenseData {
  name: string;
  value: number; // Amount in user currency (cents)
  transactionCount: number;
  percentage: number;
  categoryId?: string;
}

interface ExpensesByCategoryResponse {
  data: CategoryExpenseData[];
  summary: {
    totalAmount: number;
    totalTransactions: number;
    currency: string;
    dateRange: {
      from: string;
      to: string;
    };
    appliedFilters: {
      accounts?: string[];
      categories?: string[];
      amountRange?: { min?: number; max?: number };
      payee?: string;
      notes?: string;
    };
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  conversionInfo?: {
    hasMultipleCurrencies: boolean;
    baseCurrency: string;
  };
}

export async function GET(req: NextRequest) {
    try {
        console.log("Fetching expenses by category report with advanced filtering...");
        
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());
        
        // Validate query parameters
        const validatedQuery = querySchema.parse(queryParams);
        console.log("Validated query parameters:", validatedQuery);

        await connectDB();
        
        const userCurrency = session.user.currency || 'INR';
        console.log("User currency:", userCurrency);

        // Build transaction filter
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const transactionFilter: Record<string, any> = {
            userId: session.user.id,
            type: validatedQuery.transactionType,
            date: {
                $gte: new Date(validatedQuery.from),
                $lte: new Date(validatedQuery.to),
            },
        };

        // Apply advanced filters
        if (validatedQuery.accountIds) {
            const accountIds = validatedQuery.accountIds.split(',').filter(id => id.trim());
            if (accountIds.length > 0) {
                transactionFilter.account = { $in: accountIds };
            }
        }

        if (validatedQuery.categoryIds) {
            const categoryIds = validatedQuery.categoryIds.split(',').filter(id => id.trim());
            if (categoryIds.length > 0) {
                transactionFilter.category = { $in: categoryIds };
            }
        }

        if (validatedQuery.amountMin !== undefined || validatedQuery.amountMax !== undefined) {
            transactionFilter.amount = {};
            if (validatedQuery.amountMin !== undefined) {
                transactionFilter.amount.$gte = validatedQuery.amountMin;
            }
            if (validatedQuery.amountMax !== undefined) {
                transactionFilter.amount.$lte = validatedQuery.amountMax;
            }
        }

        if (validatedQuery.payee) {
            transactionFilter.payee = { $regex: validatedQuery.payee, $options: 'i' };
        }

        if (validatedQuery.notes) {
            transactionFilter.notes = { $regex: validatedQuery.notes, $options: 'i' };
        }

        console.log("Transaction filter:", transactionFilter);

        // Get transactions with populated data
        const transactions = await Transaction.find(transactionFilter)
            .populate('category', 'name')
            .populate('account', 'name currency type');

        console.log("Found transactions:", transactions.length);

        // Check for multiple currencies
        const accounts = await Account.find({ userId: session.user.id });
        const hasMultipleCurrencies = accounts.some(account => account.currency !== userCurrency);

        // Group by category and calculate totals
        const categoryData = new Map<string, { 
            amount: number; 
            transactionCount: number; 
            categoryId?: string;
        }>();

        let totalAmount = 0;

        for (const transaction of transactions) {
            const categoryName = transaction.category?.name || 'Uncategorized';
            const categoryId = transaction.category?._id?.toString();
            
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

            if (!categoryData.has(categoryName)) {
                categoryData.set(categoryName, { 
                    amount: 0, 
                    transactionCount: 0,
                    categoryId 
                });
            }

            const category = categoryData.get(categoryName)!;
            category.amount += amount;
            category.transactionCount += 1;
            totalAmount += amount;
        }

        // Convert to array and calculate percentages
        const categoryArray: CategoryExpenseData[] = Array.from(categoryData.entries())
            .map(([name, data]) => ({
                name,
                value: data.amount,
                transactionCount: data.transactionCount,
                percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
                categoryId: data.categoryId,
            }));

        // Sort the data
        categoryArray.sort((a, b) => {
            const aValue = validatedQuery.sortBy === 'amount' ? a.value : 
                          validatedQuery.sortBy === 'transactionCount' ? a.transactionCount : 
                          a.name.localeCompare(b.name);
            const bValue = validatedQuery.sortBy === 'amount' ? b.value : 
                          validatedQuery.sortBy === 'transactionCount' ? b.transactionCount : 
                          b.name.localeCompare(a.name);

            if (validatedQuery.sortBy === 'name') {
                return validatedQuery.sortOrder === 'asc' ? 
                    a.name.localeCompare(b.name) : 
                    b.name.localeCompare(a.name);
            }

            const comparison = typeof aValue === 'number' && typeof bValue === 'number' ? 
                aValue - bValue : 0;
            
            return validatedQuery.sortOrder === 'asc' ? comparison : -comparison;
        });

        // Apply pagination
        const totalItems = categoryArray.length;
        const totalPages = Math.ceil(totalItems / validatedQuery.limit);
        const startIndex = (validatedQuery.page - 1) * validatedQuery.limit;
        const endIndex = startIndex + validatedQuery.limit;
        
        const paginatedData = categoryArray.slice(startIndex, endIndex);

        // Build applied filters summary
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const appliedFilters: any = {};
        if (validatedQuery.accountIds) {
            appliedFilters.accounts = validatedQuery.accountIds.split(',');
        }
        if (validatedQuery.categoryIds) {
            appliedFilters.categories = validatedQuery.categoryIds.split(',');
        }
        if (validatedQuery.amountMin !== undefined || validatedQuery.amountMax !== undefined) {
            appliedFilters.amountRange = {
                min: validatedQuery.amountMin,
                max: validatedQuery.amountMax,
            };
        }
        if (validatedQuery.payee) {
            appliedFilters.payee = validatedQuery.payee;
        }
        if (validatedQuery.notes) {
            appliedFilters.notes = validatedQuery.notes;
        }

        const response: ExpensesByCategoryResponse = {
            data: paginatedData,
            summary: {
                totalAmount,
                totalTransactions: transactions.length,
                currency: userCurrency,
                dateRange: {
                    from: validatedQuery.from,
                    to: validatedQuery.to,
                },
                appliedFilters,
            },
            pagination: {
                page: validatedQuery.page,
                limit: validatedQuery.limit,
                total: totalItems,
                pages: totalPages,
            },
            conversionInfo: hasMultipleCurrencies ? {
                hasMultipleCurrencies: true,
                baseCurrency: userCurrency,
            } : undefined,
        };

        console.log("Report generated successfully with", paginatedData.length, "categories");
        return NextResponse.json(response);

    } catch (error) {
        console.error("Error fetching expenses by category report:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { message: "Validation error", errors: error.errors },
                { status: 400 }
            );
        }

        return NextResponse.json({ 
            message: "Error fetching report", 
            error: error instanceof Error ? error.message : 'Unknown error' 
        }, { status: 500 });
    }
} 