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

async function getCategory(categoryId: string, userId: string) {
  await dbConnect();
  const category = await Category.findOne({ _id: categoryId, userId: userId });
  return category;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const category = await getCategory(params.id, session.user.id);
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Not authorized" }, { status: 401 });
  }

  const category = await getCategory(params.id, session.user.id);
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const validatedData = categorySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json({ message: "Invalid data", errors: validatedData.error.errors }, { status: 400 });
    }
    
    category.set(validatedData.data);
    await category.save();
    
    return NextResponse.json(category);
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        return NextResponse.json({ message: "Category with this name and type already exists." }, { status: 409 });
    }
    return NextResponse.json({ message: "Error updating category" }, { status: 500 });
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
  
  const category = await getCategory(params.id, session.user.id);
  if (!category) {
    return NextResponse.json({ message: "Category not found" }, { status: 404 });
  }

  try {
    await Category.deleteOne({ _id: params.id, userId: session.user.id });
    return NextResponse.json({ message: "Category deleted" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ message: "Error deleting category" }, { status: 500 });
  }
} 