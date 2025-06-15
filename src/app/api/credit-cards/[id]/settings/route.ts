/**
 * Credit Card Account Settings API Routes
 * 
 * This module handles updating bill generation settings for credit card accounts:
 * - PUT: Update bill generation settings (bill generation day, due day, interest rate, etc.)
 * - GET: Retrieve current bill generation settings
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import Account from "@/models/account.model";
import { authOptions } from "@/lib/auth-config";

// Validation schema for updating bill generation settings
const billSettingsSchema = z.object({
  billGenerationDay: z.number().min(1).max(31),
  billDueDay: z.number().min(1).max(31),
  interestRate: z.number().min(0).max(1).optional(), // Annual rate as decimal
  minimumPaymentPercentage: z.number().min(0).max(1).optional(), // Percentage as decimal
});

/**
 * GET /api/credit-cards/[id]/settings
 * Retrieve current bill generation settings for a credit card account
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("Fetching credit card settings:", resolvedParams.id);
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    // Find the account and ensure it belongs to the user and is a credit card
    const account = await Account.findOne({
      _id: resolvedParams.id,
      userId: user.id,
      type: 'Credit Card'
    });

    if (!account) {
      return NextResponse.json(
        { message: "Credit card account not found or access denied" },
        { status: 404 }
      );
    }

    const settings = {
      billGenerationDay: account.billGenerationDay || 1,
      billDueDay: account.billDueDay || 21,
      interestRate: account.interestRate || 0,
      minimumPaymentPercentage: account.minimumPaymentPercentage || 0.05,
    };

    console.log("Settings fetched successfully for account:", account._id);
    return NextResponse.json({
      settings,
      message: "Settings retrieved successfully"
    });

  } catch (error) {
    console.error('Error in GET /api/credit-cards/[id]/settings:', error);
    return NextResponse.json(
      { message: "Error fetching settings", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/credit-cards/[id]/settings
 * Update bill generation settings for a credit card account
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("Updating credit card settings:", resolvedParams.id);
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    const body = await request.json();
    const validatedData = billSettingsSchema.parse(body);

    // Find the account and ensure it belongs to the user and is a credit card
    const account = await Account.findOne({
      _id: resolvedParams.id,
      userId: user.id,
      type: 'Credit Card'
    });

    if (!account) {
      return NextResponse.json(
        { message: "Credit card account not found or access denied" },
        { status: 404 }
      );
    }

    // Validate that bill due day is after bill generation day
    if (validatedData.billDueDay <= validatedData.billGenerationDay) {
      return NextResponse.json(
        { message: "Bill due day must be after bill generation day" },
        { status: 400 }
      );
    }

    // Update the account settings
    account.billGenerationDay = validatedData.billGenerationDay;
    account.billDueDay = validatedData.billDueDay;
    
    if (validatedData.interestRate !== undefined) {
      account.interestRate = validatedData.interestRate;
    }
    
    if (validatedData.minimumPaymentPercentage !== undefined) {
      account.minimumPaymentPercentage = validatedData.minimumPaymentPercentage;
    }

    const updatedAccount = await account.save();

    const settings = {
      billGenerationDay: updatedAccount.billGenerationDay,
      billDueDay: updatedAccount.billDueDay,
      interestRate: updatedAccount.interestRate,
      minimumPaymentPercentage: updatedAccount.minimumPaymentPercentage,
    };

    console.log("Settings updated successfully for account:", account._id);
    return NextResponse.json({
      settings,
      message: "Settings updated successfully"
    });

  } catch (error) {
    console.error('Error in PUT /api/credit-cards/[id]/settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error updating settings", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 