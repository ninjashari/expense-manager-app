import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import mongoose from "mongoose";

import dbConnect from "@/lib/db";
import Transaction from "@/models/transaction.model";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const transactionSchema = z.object({
  amount: z.coerce.number(),
  payee: z.string().min(1, "Payee is required."),
  notes: z.string().optional(),
  date: z.coerce.date(),
  accountId: z.string().min(1, "Account is required."),
  categoryId: z.string().optional(),
});

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }
  
    try {
      await dbConnect();
      const transactions = await Transaction.find({ userId: session.user.id }).sort({ date: -1 });
      return NextResponse.json(transactions);
    } catch (error) {
      return NextResponse.json({ message: "Error fetching transactions" }, { status: 500 });
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
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
        }
        
        const { amount, accountId, ...rest } = validatedData.data;

        const account = await Account.findOne({ _id: accountId, userId: session.user.id }).session(dbSession);
        if (!account) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }

        // Determine transaction type based on amount
        const type = amount > 0 ? 'Income' : 'Expense';

        const newTransaction = new Transaction({
            ...rest,
            amount,
            type,
            accountId,
            userId: session.user.id,
        });

        await newTransaction.save({ session: dbSession });

        // Update account balance
        account.balance += amount;
        await account.save({ session: dbSession });

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json(newTransaction, { status: 201 });
    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return NextResponse.json({ message: "Error creating transaction" }, { status: 500 });
    }
} 