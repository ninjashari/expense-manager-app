import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Category from "@/models/category.model";
import { authOptions } from "@/lib/auth-config";

const categoryUpdateSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).optional(),
  type: z.enum(["Income", "Expense"]).optional(),
});

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

    const { id } = await params;

    await connectDB();
    const category = await Category.findOne({ _id: id, userId: session.user.id });
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
  } catch {
    return NextResponse.json({ message: "Error fetching category" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

    const { id } = await params;
    const body = await req.json();
    const parsedBody = categoryUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ message: 'Invalid data', errors: parsedBody.error.errors }, { status: 400 });
    }
    
    await connectDB();

    const updateData = parsedBody.data;

    const category = await Category.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      { $set: updateData },
      { new: true }
    );

    if (!category) {
      return NextResponse.json({ message: "Category not found" }, { status: 404 });
    }
    
    return NextResponse.json(category);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: "Category with this name and type already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating category" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }
  
    const { id } = await params;

    await connectDB();
    
    // Check if there are any transactions using this category
    // For simplicity, we'll delete it directly. In production, you might want to check for dependencies.
    
    await Category.deleteOne({ _id: id, userId: session.user.id });
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch {
    return NextResponse.json({ message: "Error deleting category" }, { status: 500 });
  }
} 