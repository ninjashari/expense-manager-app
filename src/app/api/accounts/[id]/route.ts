import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import dbConnect from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const accountSchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: z.enum(["Checking", "Savings", "Credit Card", "Cash", "Investment"]),
  balance: z.coerce.number(),
});

async function getAccount(accountId: string, userId: string) {
  await dbConnect();
  const account = await Account.findOne({ _id: accountId, userId: userId });
  return account;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const account = await getAccount(params.id, session.user.id);
  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  return NextResponse.json(account);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const account = await getAccount(params.id, session.user.id);
  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validatedData = accountSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
    }
    
    account.set(validatedData.data);
    await account.save();
    
    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json({ message: "Error updating account" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  
  const account = await getAccount(params.id, session.user.id);
  if (!account) {
    return NextResponse.json({ message: "Account not found" }, { status: 404 });
  }

  try {
    await Account.deleteOne({ _id: params.id, userId: session.user.id });
    return NextResponse.json({ message: "Account deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting account" }, { status: 500 });
  }
} 