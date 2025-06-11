import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import dbConnect from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
  balance: z.coerce.number().optional().default(0),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const accounts = await Account.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching accounts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = accountSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
    }

    await dbConnect();

    const newAccount = new Account({
      ...validatedData.data,
      userId: session.user.id,
    });

    await newAccount.save();

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating account" }, { status: 500 });
  }
} 