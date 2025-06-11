import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getAuth } from '@/lib/auth';

const accountSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
  currency: z.string().min(2, { message: "Please select a currency." }),
});

export async function GET(req: NextRequest) {
  try {
    console.log("Attempting to connect to DB...");
    await connectDB();
    console.log("DB connected. Fetching session...");
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    console.log("Fetching accounts for user:", user.id);
    const accounts = await Account.find({ userId: user.id }).sort({ createdAt: -1 });
    console.log("Accounts fetched successfully:", accounts);

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error in GET /api/accounts:', error);
    return NextResponse.json({ message: "Error fetching accounts" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = accountSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
    }

    await connectDB();

    const account = new Account({
      ...parsedBody.data,
      userId: session.user.id,
      balance: 0, // Initial balance is always 0
    });

    await account.save();

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Error creating account" }, { status: 500 });
  }
} 