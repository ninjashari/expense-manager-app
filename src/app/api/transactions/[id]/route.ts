import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/transaction.model';
import Account from '@/models/account.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const body = await req.json();
        const { account, amount, type, ...otherData } = body;

        await connectDB();

        // Get the old transaction to reverse its effect on account balance
        const oldTransaction = await Transaction.findOne({ _id: id, userId: session.user.id }).session(dbSession);
        if (!oldTransaction) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Reverse the old transaction's effect on account balance
        const oldAccount = await Account.findById(oldTransaction.account).session(dbSession);
        if (oldAccount) {
            if (oldTransaction.type === 'Income') {
                oldAccount.balance -= oldTransaction.amount;
            } else if (oldTransaction.type === 'Expense') {
                oldAccount.balance += oldTransaction.amount;
            }
            await oldAccount.save({ session: dbSession });
        }
        
        // Update the transaction
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            { ...otherData, account, amount, type },
            { new: true, session: dbSession }
        );
        
        if (!updatedTransaction) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Apply the new transaction's effect on account balance
        const newAccount = await Account.findById(account).session(dbSession);
        if (newAccount) {
            if (type === 'Income') {
                newAccount.balance += amount;
            } else if (type === 'Expense') {
                newAccount.balance -= amount;
            }
            await newAccount.save({ session: dbSession });
        }

        await dbSession.commitTransaction();
        dbSession.endSession();
        
        return NextResponse.json(updatedTransaction);
    } catch {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return NextResponse.json({ message: 'Error updating transaction' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        await connectDB();

        const transaction = await Transaction.findOne({ _id: id, userId: session.user.id }).session(dbSession);
        if (!transaction) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Reverse the transaction's effect on account balance
        const account = await Account.findById(transaction.account).session(dbSession);
        if (account) {
            if (transaction.type === 'Income') {
                account.balance -= transaction.amount;
            } else if (transaction.type === 'Expense') {
                account.balance += transaction.amount;
            }
            await account.save({ session: dbSession });
        }

        await Transaction.deleteOne({ _id: id }).session(dbSession);

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json({ message: 'Transaction deleted' });
    } catch {
        await dbSession.abortTransaction();
        dbSession.endSession();
        return NextResponse.json({ message: 'Error deleting transaction' }, { status: 500 });
    }
} 