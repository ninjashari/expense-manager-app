import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import User from "@/models/user.model";
import { authOptions } from "@/lib/auth-config";

const userUpdateSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  currency: z.string().min(2, { message: "Please select a currency." }),
});

export async function GET() {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = await User.findById(session.user.id);
    
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      currency: user.currency,
    });
  } catch (error) {
    console.error('Error in GET /api/user:', error);
    return NextResponse.json({ message: "Error fetching user" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsedBody = userUpdateSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json({ 
        message: 'Invalid data', 
        errors: parsedBody.error.errors 
      }, { status: 400 });
    }

    await connectDB();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      {
        name: parsedBody.data.name,
        currency: parsedBody.data.currency,
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      currency: updatedUser.currency,
    });
  } catch (error) {
    console.error('Error in PUT /api/user:', error);
    return NextResponse.json({ message: "Error updating user" }, { status: 500 });
  }
} 