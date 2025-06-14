import { NextResponse, NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import mongoose from "mongoose";

import { connectDB } from "@/lib/db";
import Transaction from "@/models/transaction.model";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const transactionSchema = z.object({
  account: z.string().min(1, "Account is required."),
  category: z.string().optional(),
  type: z.enum(["Income", "Expense", "Transfer"]),
  amount: z.coerce.number().positive("Amount must be positive."),
  date: z.coerce.date(),
  payee: z.string().min(1, "Payee is required."),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    console.log("Attempting to connect to DB...");
    await connectDB();
    console.log("DB connected. Fetching session...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        console.log("No session or user found.");
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    console.log("Fetching transactions for user:", user.id);
    const transactions = await Transaction.find({ userId: user.id })
      .populate('account', 'name')
      .populate('category', 'name')
      .sort({ date: -1 });
    console.log("Transactions fetched successfully:", transactions);

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error in GET /api/transactions:', error);
    return NextResponse.json({ message: "Error fetching transactions" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return NextResponse.json({ message: 'Invalid IDs provided' }, { status: 400 });
    }

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const transactions = await Transaction.find({ _id: { $in: ids }, userId: session.user.id }).session(dbSession);

        if (transactions.length !== ids.length) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Some transactions not found' }, { status: 404 });
        }

        for (const transaction of transactions) {
            const account = await Account.findById(transaction.account).session(dbSession);
            if (account) {
                if (transaction.type === 'Income') {
                    account.balance -= transaction.amount;
                } else if (transaction.type === 'Expense') {
                    account.balance += transaction.amount;
                }
                await account.save({ session: dbSession });
            }
        }

        await Transaction.deleteMany({ _id: { $in: ids }, userId: session.user.id }).session(dbSession);

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json({ message: 'Transactions deleted' }, { status: 200 });
    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        console.error('Error deleting transactions:', error);
        return NextResponse.json({ message: 'Error deleting transactions' }, { status: 500 });
    }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    const body = await req.json();
    const validatedData = transactionSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
    }

    const { account, amount, type } = validatedData.data;

    const newTransaction = new Transaction({
      ...validatedData.data,
      userId: session.user.id,
    });

    await newTransaction.save({ session: dbSession });

    if (type === 'Income') {
      await Account.updateOne({ _id: account }, { $inc: { balance: amount } }, { session: dbSession });
    } else if (type === 'Expense') {
      await Account.updateOne({ _id: account }, { $inc: { balance: -amount } }, { session: dbSession });
    }

    await dbSession.commitTransaction();
    dbSession.endSession();

    return NextResponse.json(newTransaction, { status: 201 });
  } catch (error) {
    await dbSession.abortTransaction();
    dbSession.endSession();
    return NextResponse.json({ message: "Error creating transaction" }, { status: 500 });
  }
} 