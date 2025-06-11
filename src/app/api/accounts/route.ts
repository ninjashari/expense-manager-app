import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/lib/auth-config";

const accountSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
  currency: z.string().min(2, { message: "Please select a currency." }),
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

export async function GET() {
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

    const { creditLimit, ...accountData } = parsedBody.data;
    
    // Convert credit limit to cents if provided
    const creditLimitInCents = creditLimit ? Math.round(parseFloat(creditLimit) * 100) : null;

    const account = new Account({
      ...accountData,
      userId: session.user.id,
      balance: 0, // Initial balance is always 0
      creditLimit: creditLimitInCents,
    });

    await account.save();

    return NextResponse.json(account, { status: 201 });
  } catch {
    return NextResponse.json({ message: "Error creating account" }, { status: 500 });
  }
} 