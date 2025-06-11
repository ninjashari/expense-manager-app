import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import dbConnect from "@/lib/db";
import Category from "@/models/category.model";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: z.enum(["Income", "Expense"]),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    await dbConnect();
    const categories = await Category.find({ userId: session.user.id }).sort({ createdAt: -1 });
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ message: "Error fetching categories" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = categorySchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
    }

    await dbConnect();

    const newCategory = new Category({
      ...validatedData.data,
      userId: session.user.id,
    });

    await newCategory.save();

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    // Handle potential duplicate key error
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: "Category with this name and type already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error creating category" }, { status: 500 });
  }
} 