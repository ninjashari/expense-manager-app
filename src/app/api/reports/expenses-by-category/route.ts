import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/transaction.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';
import { z } from 'zod';
import { getExchangeRate } from "@/lib/currency-converter";

const querySchema = z.object({
    from: z.string().optional(),
    to: z.string().optional(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }
        
        const { searchParams } = new URL(req.url);
        const from = searchParams.get("from");
        const to = searchParams.get("to");

        if (!from || !to) {
            return NextResponse.json({ message: "Missing date range" }, { status: 400 });
        }

        await connectDB();
        
        const userCurrency = session.user.currency || 'INR';

        const transactions = await Transaction.find({
            userId: session.user.id,
            type: 'Expense',
            date: {
                $gte: new Date(from),
                $lte: new Date(to),
            },
        }).populate('category').populate('account');

        const expensesByCategory: { [key: string]: number } = {};

        for (const t of transactions) {
            if (t.category) {
                const categoryName = t.category.name;
                const rate = await getExchangeRate(t.account.currency, userCurrency);
                const amountInUserCurrency = t.amount * rate;
                
                if (expensesByCategory[categoryName]) {
                    expensesByCategory[categoryName] += amountInUserCurrency;
                } else {
                    expensesByCategory[categoryName] = amountInUserCurrency;
                }
            }
        }
        
        const report = Object.keys(expensesByCategory).map(key => ({
            name: key,
            value: expensesByCategory[key],
        }));

        return NextResponse.json(report);

    } catch (error) {
        console.error("Error fetching expenses by category report:", error);
        return NextResponse.json({ message: "Error fetching report" }, { status: 500 });
    }
} 