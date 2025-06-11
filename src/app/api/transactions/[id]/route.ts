import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/transaction.model';
import Account from '@/models/account.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import mongoose from 'mongoose';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));

    const { id } = params;
    const body = await req.json();

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const oldTransaction = await Transaction.findOne({ _id: id, userId: user.id }).session(dbSession);
        if (!oldTransaction) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Revert old transaction
        const oldAccount = await Account.findById(oldTransaction.account).session(dbSession);
        if (oldAccount) {
            if (oldTransaction.type === 'Income') {
                oldAccount.balance -= oldTransaction.amount;
            } else {
                oldAccount.balance += oldTransaction.amount;
            }
            await oldAccount.save({ session: dbSession });
        }
        
        // Apply new transaction
        const updatedTransaction = await Transaction.findByIdAndUpdate(id, { ...body, userId: user.id }, { new: true, session: dbSession });
        
        const newAccount = await Account.findById(updatedTransaction.account).session(dbSession);
        if (newAccount) {
            if (updatedTransaction.type === 'Income') {
                newAccount.balance += updatedTransaction.amount;
            } else {
                newAccount.balance -= updatedTransaction.amount;
            }
            await newAccount.save({ session: dbSession });
        }

        await dbSession.commitTransaction();
        dbSession.endSession();
        
        return NextResponse.json(updatedTransaction, { status: 200 });
    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        console.error(error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    const { id } = params;

    const dbSession = await mongoose.startSession();
    dbSession.startTransaction();

    try {
        const transaction = await Transaction.findOne({ _id: id, userId: user.id }).session(dbSession);

        if (!transaction) {
            await dbSession.abortTransaction();
            dbSession.endSession();
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        const account = await Account.findById(transaction.account).session(dbSession);
        if (account) {
            if (transaction.type === 'Income') {
                account.balance -= transaction.amount;
            } else if (transaction.type === 'Expense') {
                account.balance += transaction.amount;
            }
            await account.save({ session: dbSession });
        }

        await Transaction.deleteOne({ _id: id, userId: user.id }).session(dbSession);

        await dbSession.commitTransaction();
        dbSession.endSession();

        return NextResponse.json({ message: 'Transaction deleted' }, { status: 200 });
    } catch (error) {
        await dbSession.abortTransaction();
        dbSession.endSession();
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ message: 'Error deleting transaction' }, { status: 500 });
    }
} 