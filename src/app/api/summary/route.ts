import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/models/account.model';
import Transaction from '@/models/transaction.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { subDays } from 'date-fns';
import { getExchangeRate } from '@/lib/currency-converter';

interface AccountWithConversion {
    _id: string;
    name: string;
    type: string;
    balance: number;
    currency: string;
    convertedBalance: number;
    exchangeRate: number;
}

interface SummaryResponse {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    recentTransactions: unknown[];
    userCurrency: string;
    accounts: AccountWithConversion[];
    exchangeRates: Record<string, number>;
    lastUpdated: string;
    conversionStatus: {
        success: boolean;
        failedCurrencies: string[];
        errors: string[];
    };
}

export async function GET(): Promise<NextResponse<SummaryResponse | { message: string }>> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();
        
        const userCurrency = session.user.currency || 'INR';

        // Fetch all user accounts
        const accounts = await Account.find({ userId: session.user.id });
        
        // Initialize tracking variables
        let totalBalance = 0;
        const exchangeRates: Record<string, number> = {};
        const accountsWithConversion: AccountWithConversion[] = [];
        const conversionStatus = {
            success: true,
            failedCurrencies: [] as string[],
            errors: [] as string[]
        };

        // Process each account for currency conversion
        for (const account of accounts) {
            let exchangeRate = 1;
            let convertedBalance = account.balance;

            if (account.currency !== userCurrency) {
                try {
                    exchangeRate = await getExchangeRate(account.currency, userCurrency);
                    exchangeRates[`${account.currency}-${userCurrency}`] = exchangeRate;
                    convertedBalance = account.balance * exchangeRate;
                } catch (error) {
                    console.error(`Failed to get exchange rate for ${account.currency} to ${userCurrency}:`, error);
                    conversionStatus.success = false;
                    conversionStatus.failedCurrencies.push(account.currency);
                    conversionStatus.errors.push(`Failed to convert ${account.currency} to ${userCurrency}`);
                    // Use original balance as fallback
                    convertedBalance = account.balance;
                    exchangeRate = 1;
                }
            } else {
                exchangeRates[`${account.currency}-${userCurrency}`] = 1;
            }

            totalBalance += convertedBalance;
            
            accountsWithConversion.push({
                _id: account._id.toString(),
                name: account.name,
                type: account.type,
                balance: account.balance,
                currency: account.currency,
                convertedBalance,
                exchangeRate
            });
        }

        // Calculate income and expenses for last 30 days
        const thirtyDaysAgo = subDays(new Date(), 30);
        const recentTransactions = await Transaction.find({
            userId: session.user.id,
            date: { $gte: thirtyDaysAgo },
        }).populate('account');

        let totalIncome = 0;
        let totalExpense = 0;

        for (const t of recentTransactions) {
            let exchangeRate = 1;
            
            if (t.account.currency !== userCurrency) {
                // Use cached rate if available, otherwise fetch
                const rateKey = `${t.account.currency}-${userCurrency}`;
                if (exchangeRates[rateKey]) {
                    exchangeRate = exchangeRates[rateKey];
                } else {
                    try {
                        exchangeRate = await getExchangeRate(t.account.currency, userCurrency);
                        exchangeRates[rateKey] = exchangeRate;
                    } catch (error) {
                        console.error(`Failed to get exchange rate for transaction ${t._id}:`, error);
                        conversionStatus.success = false;
                        if (!conversionStatus.failedCurrencies.includes(t.account.currency)) {
                            conversionStatus.failedCurrencies.push(t.account.currency);
                        }
                        // Use rate of 1 as fallback
                        exchangeRate = 1;
                    }
                }
            }

            const convertedAmount = t.amount * exchangeRate;
            
            if (t.type === 'Income') {
                totalIncome += convertedAmount;
            } else if (t.type === 'Expense') {
                totalExpense += convertedAmount;
            }
        }

        // Fetch latest transactions for display
        const latestTransactions = await Transaction.find({ userId: session.user.id })
            .sort({ date: -1 })
            .limit(10)
            .populate('account')
            .populate('category');

        const response: SummaryResponse = {
            totalBalance,
            totalIncome,
            totalExpense,
            recentTransactions: latestTransactions,
            userCurrency,
            accounts: accountsWithConversion,
            exchangeRates,
            lastUpdated: new Date().toISOString(),
            conversionStatus
        };

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching summary:', error);
        return NextResponse.json({ 
            message: 'Error fetching summary',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
} 