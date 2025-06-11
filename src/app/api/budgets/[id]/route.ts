import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { connectDB } from "@/lib/db";
import Budget from "@/models/budget.model";
import { z } from "zod";

const budgetUpdateSchema = z.object({
    amount: z.number().positive({ message: "Amount must be positive." }),
});

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Not authorized" }, { status: 401 });
        }

        const body = await req.json();
        const parsedBody = budgetUpdateSchema.safeParse(body);

        if (!parsedBody.success) {
            return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
        }

        await connectDB();

        const budget = await Budget.findOneAndUpdate(
            { _id: params.id, userId: session.user.id },
            { $set: { amount: parsedBody.data.amount } },
            { new: true }
        );

        if (!budget) {
            return NextResponse.json({ message: "Budget not found" }, { status: 404 });
        }

        return NextResponse.json(budget);
    } catch (error) {
        return NextResponse.json({ message: "Error updating budget" }, { status: 500 });
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

        const budget = await Budget.findOneAndDelete({ _id: params.id, userId: session.user.id });

        if (!budget) {
            return NextResponse.json({ message: "Budget not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Budget deleted" });
    } catch (error) {
        return NextResponse.json({ message: "Error deleting budget" }, { status: 500 });
    }
} 