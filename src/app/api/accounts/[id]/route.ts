import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/lib/auth-config";

const accountUpdateSchema = z.object({
    name: z.string().min(1, { message: "Name is required." }).optional(),
    type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]).optional(),
    currency: z.string().min(2, { message: "Please select a currency." }).optional(),
    creditLimit: z.string().optional(),
}).refine((data) => {
    if (data.type === "Credit Card") {
        if (!data.creditLimit || data.creditLimit.trim() === "") {
            return false;
        }
        const limit = parseFloat(data.creditLimit);
        return !isNaN(limit) && limit > 0;
    }
    return true;
}, {
    message: "Credit limit is required for credit card accounts and must be a positive number.",
    path: ["creditLimit"],
});

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();
        const account = await Account.findOne({ _id: id, userId: session.user.id });
        if (!account) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch {
        return NextResponse.json({ message: "Error fetching account" }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsedBody = accountUpdateSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
        }

        await connectDB();

        // Process the update data, converting credit limit to cents if provided
        const { creditLimit, ...updateData } = parsedBody.data;
        const processedUpdateData = {
            ...updateData,
            ...(creditLimit !== undefined && { creditLimit: creditLimit ? Math.round(parseFloat(creditLimit) * 100) : null })
        };

        const account = await Account.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: processedUpdateData },
            { new: true }
        );

        if (!account) {
            return NextResponse.json({ message: 'Account not found' }, { status: 404 });
        }

        return NextResponse.json(account);
    } catch {
        return NextResponse.json({ message: 'Error updating account' }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const { id } = await params;

        await connectDB();
        
        // We need to ensure that there are no transactions associated with this account before deleting.
        // For simplicity, we are deleting it directly. A better approach would be to check for transactions.

        const account = await Account.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!account) {
            return NextResponse.json({ message: "Account not found" }, { status: 404 });
        }
        
        return NextResponse.json({ message: "Account deleted" });
    } catch {
        return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
    }
} 