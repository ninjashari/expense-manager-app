/**
 * Credit Card Bills API Routes
 * 
 * This module handles CRUD operations for credit card bills including:
 * - GET: List all bills for the authenticated user with filtering and pagination
 * - POST: Create/generate a new bill for a credit card account
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import CreditCardBill from "@/models/credit-card-bill.model";
import Account from "@/models/account.model";
import { authOptions } from "@/lib/auth-config";
import { generateBill } from "@/lib/bill-utils";
import { BillsResponse } from "@/types/credit-card-bill.types";

// Validation schema for creating a new bill
const createBillSchema = z.object({
  accountId: z.string().min(1, { message: "Account ID is required." }),
  billingPeriodStart: z.string().datetime().optional(),
  billingPeriodEnd: z.string().datetime().optional(),
  notes: z.string().optional(),
});

// Validation schema for query parameters
const querySchema = z.object({
  accountId: z.string().optional(),
  status: z.string().optional(),
  isPaid: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  billAmountMin: z.string().optional(),
  billAmountMax: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
  sortBy: z.enum(['billDueDate', 'billAmount', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/credit-cards/bills
 * Retrieve all credit card bills for the authenticated user with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    console.log("Fetching credit card bills...");
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = querySchema.parse(queryParams);
    
    // Build filter object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: Record<string, any> = { userId: user.id };
    
    if (validatedQuery.accountId) {
      filters.accountId = validatedQuery.accountId;
    }
    
    if (validatedQuery.status) {
      filters.status = validatedQuery.status;
    }
    
    if (validatedQuery.isPaid) {
      filters.isPaid = validatedQuery.isPaid === 'true';
    }
    
    if (validatedQuery.dueDateFrom || validatedQuery.dueDateTo) {
      filters.billDueDate = {};
      if (validatedQuery.dueDateFrom) {
        filters.billDueDate.$gte = new Date(validatedQuery.dueDateFrom);
      }
      if (validatedQuery.dueDateTo) {
        filters.billDueDate.$lte = new Date(validatedQuery.dueDateTo);
      }
    }
    
    if (validatedQuery.billAmountMin || validatedQuery.billAmountMax) {
      filters.billAmount = {};
      if (validatedQuery.billAmountMin) {
        filters.billAmount.$gte = parseFloat(validatedQuery.billAmountMin) * 100; // Convert to cents
      }
      if (validatedQuery.billAmountMax) {
        filters.billAmount.$lte = parseFloat(validatedQuery.billAmountMax) * 100; // Convert to cents
      }
    }

    // Pagination
    const page = parseInt(validatedQuery.page || '1');
    const limit = parseInt(validatedQuery.limit || '10');
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = validatedQuery.sortBy || 'billDueDate';
    const sortOrder = validatedQuery.sortOrder || 'desc';
    const sort: Record<string, 1 | -1> = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    console.log("Applying filters:", filters);
    console.log("Pagination:", { page, limit, skip });
    console.log("Sorting:", sort);

    // Get bills with pagination
    const [bills, totalCount] = await Promise.all([
      CreditCardBill.find(filters)
        .populate('accountId', 'name type currency creditLimit')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CreditCardBill.countDocuments(filters)
    ]);

    // Calculate summary statistics
    const summary = {
      totalOutstanding: 0,
      totalOverdue: 0,
      upcomingDue: 0,
      billsCount: {
        total: totalCount,
        paid: 0,
        unpaid: 0,
        overdue: 0,
      },
      nextDueDate: undefined as Date | undefined,
    };

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    let earliestDueDate: Date | undefined;

    // Calculate summary from all bills (not just current page)
    const allBills = await CreditCardBill.find({ userId: user.id });
    allBills.forEach((bill) => {
      if (bill.isPaid) {
        summary.billsCount.paid++;
      } else {
        summary.billsCount.unpaid++;
        summary.totalOutstanding += bill.billAmount;

        if (bill.billDueDate < today) {
          summary.billsCount.overdue++;
          summary.totalOverdue += bill.billAmount;
        } else if (bill.billDueDate <= nextWeek) {
          summary.upcomingDue += bill.billAmount;
        }

        if (!earliestDueDate || bill.billDueDate < earliestDueDate) {
          earliestDueDate = bill.billDueDate;
        }
      }
    });

    summary.nextDueDate = earliestDueDate;

    const response: BillsResponse = {
      bills: bills.map(bill => ({
        ...bill.toObject(),
        account: bill.accountId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any,
      pagination: {
        page,
        limit,
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
      },
      summary,
    };

    console.log("Bills fetched successfully:", bills.length);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/credit-cards/bills:', error);
    return NextResponse.json(
      { message: "Error fetching bills", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/credit-cards/bills
 * Create/generate a new credit card bill
 */
export async function POST(request: NextRequest) {
  try {
    console.log("Creating new credit card bill...");
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    const body = await request.json();
    const validatedData = createBillSchema.parse(body);

    // Verify the account belongs to the user and is a credit card
    const account = await Account.findOne({
      _id: validatedData.accountId,
      userId: user.id,
      type: 'Credit Card'
    });

    if (!account) {
      return NextResponse.json(
        { message: "Credit card account not found or access denied" },
        { status: 404 }
      );
    }

    // Generate the bill
    const billingPeriodStart = validatedData.billingPeriodStart 
      ? new Date(validatedData.billingPeriodStart) 
      : undefined;
    const billingPeriodEnd = validatedData.billingPeriodEnd 
      ? new Date(validatedData.billingPeriodEnd) 
      : undefined;

    const result = await generateBill(
      validatedData.accountId,
      user.id,
      billingPeriodStart,
      billingPeriodEnd
    );

    if (!result.success) {
      return NextResponse.json(
        { message: result.error },
        { status: 400 }
      );
    }

    // Add notes if provided
    if (validatedData.notes && result.bill) {
      result.bill.notes = validatedData.notes;
      await CreditCardBill.findByIdAndUpdate(result.bill._id, { notes: validatedData.notes });
    }

    console.log("Bill created successfully:", result.bill?._id);
    return NextResponse.json({
      bill: result.bill,
      message: "Bill generated successfully",
      warnings: result.warnings,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/credit-cards/bills:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error creating bill", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 