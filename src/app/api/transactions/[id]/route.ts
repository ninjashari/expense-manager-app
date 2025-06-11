import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Transaction from '@/models/transaction.model';
import Account from '@/models/account.model';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await connectDB();

        const transaction = await Transaction.findOne({ _id: id, userId: session.user.id })
            .populate('account', 'name currency')
            .populate('category', 'name');

        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        return NextResponse.json(transaction);
    } catch (error) {
        console.error('Error fetching transaction:', error);
        return NextResponse.json({ message: 'Error fetching transaction' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        const body = await req.json();
        const { account, amount, type, ...otherData } = body;

        await connectDB();

        // Get the old transaction to reverse its effect on account balance
        const oldTransaction = await Transaction.findOne({ _id: id, userId: session.user.id });
        if (!oldTransaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Reverse the old transaction's effect on account balance
        const oldAccount = await Account.findById(oldTransaction.account);
        if (oldAccount) {
            if (oldTransaction.type === 'Income') {
                oldAccount.balance -= oldTransaction.amount;
            } else if (oldTransaction.type === 'Expense') {
                oldAccount.balance += oldTransaction.amount;
            }
            await oldAccount.save();
        }
        
        // Update the transaction
        const updatedTransaction = await Transaction.findByIdAndUpdate(
            id,
            { ...otherData, account, amount, type },
            { new: true }
        );
        
        if (!updatedTransaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Apply the new transaction's effect on account balance
        const newAccount = await Account.findById(account);
        if (newAccount) {
            if (type === 'Income') {
                newAccount.balance += amount;
            } else if (type === 'Expense') {
                newAccount.balance -= amount;
            }
            await newAccount.save();
        }
        
        return NextResponse.json(updatedTransaction);
    } catch (error) {
        console.error('Error updating transaction:', error);
        return NextResponse.json({ message: 'Error updating transaction' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    const { id } = await params;

    try {
        await connectDB();

        const transaction = await Transaction.findOne({ _id: id, userId: session.user.id });
        if (!transaction) {
            return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
        }

        // Reverse the transaction's effect on account balance
        const account = await Account.findById(transaction.account);
        if (account) {
            if (transaction.type === 'Income') {
                account.balance -= transaction.amount;
            } else if (transaction.type === 'Expense') {
                account.balance += transaction.amount;
            }
            await account.save();
        }

        await Transaction.deleteOne({ _id: id });

        return NextResponse.json({ message: 'Transaction deleted' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        return NextResponse.json({ message: 'Error deleting transaction' }, { status: 500 });
    }
} 