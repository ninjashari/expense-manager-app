import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Account from '@/models/account.model';
import Transaction from '@/models/transaction.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { subDays } from 'date-fns';
import mongoose from 'mongoose';
import { getExchangeRate } from '@/lib/currency-converter';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        await connectDB();
        
        const userCurrency = session.user.currency || 'INR';

        const accounts = await Account.find({ userId: session.user.id });
        
        let totalBalance = 0;
        for (const account of accounts) {
            const rate = await getExchangeRate(account.currency, userCurrency);
            totalBalance += account.balance * rate;
        }

        const thirtyDaysAgo = subDays(new Date(), 30);

        const recentTransactions = await Transaction.find({
            userId: session.user.id,
            date: { $gte: thirtyDaysAgo },
        }).populate('account');

        let totalIncome = 0;
        let totalExpense = 0;

        for (const t of recentTransactions) {
            const rate = await getExchangeRate(t.account.currency, userCurrency);
            if (t.type === 'Income') {
                totalIncome += t.amount * rate;
            } else if (t.type === 'Expense') {
                totalExpense += t.amount * rate;
            }
        }

        const latestTransactions = await Transaction.find({ userId: session.user.id })
            .sort({ date: -1 })
            .limit(10)
            .populate('account');

        return NextResponse.json({
            totalBalance,
            totalIncome,
            totalExpense,
            recentTransactions: latestTransactions,
        });

    } catch (error) {
        console.error('Error fetching summary:', error);
        return NextResponse.json({ message: 'Error fetching summary' }, { status: 500 });
    }
} 