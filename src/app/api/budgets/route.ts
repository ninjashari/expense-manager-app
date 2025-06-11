import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import Budget from "@/models/budget.model";
import Transaction from "@/models/transaction.model";
import { z } from "zod";
import { startOfMonth, endOfMonth } from 'date-fns';

const budgetSchema = z.object({
    categoryId: z.string().min(1, { message: "Category is required." }),
    amount: z.number().positive({ message: "Amount must be positive." }),
    month: z.coerce.date(),
});

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const month = searchParams.get("month") ? new Date(searchParams.get("month")!) : new Date();

        const start = startOfMonth(month);
        const end = endOfMonth(month);

        await connectDB();

        const budgets = await Budget.find({
            userId: session.user.id,
            month: {
                $gte: start,
                $lte: end,
            },
        }).populate('categoryId', 'name');

        const categoryIds = budgets.map(b => b.categoryId._id);

        const spending = await Transaction.aggregate([
            {
                $match: {
                    userId: session.user.id,
                    categoryId: { $in: categoryIds },
                    date: { $gte: start, $lte: end },
                    type: 'Expense',
                }
            },
            {
                $group: {
                    _id: '$categoryId',
                    total: { $sum: '$amount' },
                }
            }
        ]);

        const spendingMap = new Map(spending.map(s => [s._id.toString(), s.total]));

        const budgetsWithSpending = budgets.map(b => ({
            ...b.toObject(),
            spent: spendingMap.get(b.categoryId._id.toString()) || 0,
        }));

        return NextResponse.json(budgetsWithSpending);
    } catch {
        return NextResponse.json({ message: "Error fetching budgets" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsedBody = budgetSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
        }

        await connectDB();
        
        // Normalize month to the first day of the month
        const budgetMonth = startOfMonth(parsedBody.data.month);

        const newBudget = new Budget({
            ...parsedBody.data,
            month: budgetMonth,
            userId: session.user.id,
        });

        await newBudget.save();

        return NextResponse.json(newBudget, { status: 201 });
    } catch (error: unknown) {
        if ((error as { code?: number })?.code === 11000) {
            return NextResponse.json({ message: "A budget for this category and month already exists." }, { status: 409 });
        }
        return NextResponse.json({ message: "Error creating budget" }, { status: 500 });
    }
} 