import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";
import { connectDB } from "@/lib/db";
import Budget from "@/models/budget.model";
import { z } from "zod";

const budgetUpdateSchema = z.object({
    amount: z.number().positive({ message: "Amount must be positive." }),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const { id } = await params;
        const body = await req.json();
        const parsedBody = budgetUpdateSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
        }

        await connectDB();

        const budget = await Budget.findOneAndUpdate(
            { _id: id, userId: session.user.id },
            { $set: { amount: parsedBody.data.amount } },
            { new: true }
        );

        if (!budget) {
            return NextResponse.json({ message: "Budget not found" }, { status: 404 });
        }

        return NextResponse.json(budget);
    } catch {
        return NextResponse.json({ message: "Error updating budget" }, { status: 500 });
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

        const budget = await Budget.findOneAndDelete({ _id: id, userId: session.user.id });

        if (!budget) {
            return NextResponse.json({ message: "Budget not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Budget deleted" });
    } catch {
        return NextResponse.json({ message: "Error deleting budget" }, { status: 500 });
    }
} 