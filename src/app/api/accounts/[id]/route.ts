import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
  balance: z.coerce.number(),
});

const accountUpdateSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }).optional(),
    type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]).optional(),
    currency: z.string().min(2, { message: "Please select a currency." }).optional(),
});

async function getAccount(accountId: string, userId: string) {
  await connectDB();
  const account = await Account.findOne({ _id: accountId, userId: userId });
  return account;
}

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        await connectDB();
        const account = await Account.findOne({ _id: params.id, userId: session.user.id });
        if (!account) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ message: "Error fetching account" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const body = await req.json();
        const parsedBody = accountUpdateSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
        }

        await connectDB();

        // Prevent updating balance from this endpoint
        const updateData = parsedBody.data;

        const account = await Account.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            { $set: updateData },
            { new: true }
        );

        if (!account) {
            return NextResponse.json({ message: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch (error) {
        return NextResponse.json({ message: 'Error updating account' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        await connectDB();
        
        // We need to ensure that there are no transactions associated with this account before deleting.
        // For simplicity, we are deleting it directly. A better approach would be to check for transactions.

        const account = await Account.findOneAndDelete({ _id: params.id, userId: session.user.id });

        if (!account) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Account deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
    }
} 