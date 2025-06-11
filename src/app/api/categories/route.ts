import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Category from "@/models/category.model";
import { authOptions } from "@/lib/auth-config";

const categorySchema = z.object({
  name: z.string().min(1, "Name is required."),
  type: z.enum(["Income", "Expense"]),
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

    console.log("Fetching categories for user:", user.id);
    const categories = await Category.find({ userId: user.id }).sort({ createdAt: -1 });
    console.log("Categories fetched successfully:", categories);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error in GET /api/categories:', error);
    return NextResponse.json({ message: "Error fetching categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    await connectDB();

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