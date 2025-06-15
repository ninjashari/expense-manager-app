/**
 * Individual Credit Card Bill API Routes
 * 
 * This module handles operations on individual credit card bills:
 * - GET: Retrieve a specific bill by ID
 * - PUT: Update a bill (mark as paid/unpaid, update notes, etc.)
 * - DELETE: Delete a specific bill
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { connectDB } from "@/lib/db";
import CreditCardBill from "@/models/credit-card-bill.model";
import { authOptions } from "@/lib/auth-config";
import { BillResponse } from "@/types/credit-card-bill.types";

// Validation schema for updating a bill
const updateBillSchema = z.object({
  isPaid: z.boolean().optional(),
  paidAmount: z.number().min(0).optional(),
  paidDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  status: z.enum(['generated', 'sent', 'paid', 'overdue', 'partial']).optional(),
});

/**
 * GET /api/credit-cards/bills/[id]
 * Retrieve a specific credit card bill by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("Fetching credit card bill:", resolvedParams.id);
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    // Find the bill and ensure it belongs to the user
    const bill = await CreditCardBill.findOne({
      _id: resolvedParams.id,
      userId: user.id
    }).populate('accountId', 'name type currency creditLimit');

    if (!bill) {
      return NextResponse.json(
        { message: "Bill not found or access denied" },
        { status: 404 }
      );
    }

    const response: BillResponse = {
      bill: {
        ...bill.toObject(),
        account: bill.accountId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      message: "Bill retrieved successfully"
    };

    console.log("Bill fetched successfully:", bill._id);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in GET /api/credit-cards/bills/[id]:', error);
    return NextResponse.json(
      { message: "Error fetching bill", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/credit-cards/bills/[id]
 * Update a credit card bill (mark as paid/unpaid, update notes, etc.)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("Updating credit card bill:", resolvedParams.id);
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    const body = await request.json();
    const validatedData = updateBillSchema.parse(body);

    // Find the bill and ensure it belongs to the user
    const bill = await CreditCardBill.findOne({
      _id: resolvedParams.id,
      userId: user.id
    });

    if (!bill) {
      return NextResponse.json(
        { message: "Bill not found or access denied" },
        { status: 404 }
      );
    }

    // Update bill fields
    if (validatedData.isPaid !== undefined) {
      bill.isPaid = validatedData.isPaid;
      
      if (validatedData.isPaid) {
        bill.paidDate = validatedData.paidDate ? new Date(validatedData.paidDate) : new Date();
        bill.paidAmount = validatedData.paidAmount || bill.billAmount;
        
        // Update status based on payment amount
        if (bill.paidAmount >= bill.billAmount) {
          bill.status = 'paid';
        } else {
          bill.status = 'partial';
        }
      } else {
        // If marking as unpaid, clear payment details
        bill.paidDate = undefined;
        bill.paidAmount = undefined;
        
        // Update status based on due date
        if (new Date() > bill.billDueDate) {
          bill.status = 'overdue';
        } else {
          bill.status = 'generated';
        }
      }
    }

    if (validatedData.paidAmount !== undefined) {
      bill.paidAmount = validatedData.paidAmount;
      
      // Update status based on payment amount
      if (bill.isPaid) {
        if (bill.paidAmount >= bill.billAmount) {
          bill.status = 'paid';
        } else {
          bill.status = 'partial';
        }
      }
    }

    if (validatedData.paidDate) {
      bill.paidDate = new Date(validatedData.paidDate);
    }

    if (validatedData.notes !== undefined) {
      bill.notes = validatedData.notes;
    }

    if (validatedData.status) {
      bill.status = validatedData.status;
    }

    // Save the updated bill
    const updatedBill = await bill.save();
    
    // Populate the account information
    const populatedBill = await CreditCardBill.findById(updatedBill._id)
      .populate('accountId', 'name type currency creditLimit');

    const response: BillResponse = {
      bill: {
        ...populatedBill!.toObject(),
        account: populatedBill!.accountId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      message: "Bill updated successfully"
    };

    console.log("Bill updated successfully:", bill._id);
    return NextResponse.json(response);

  } catch (error) {
    console.error('Error in PUT /api/credit-cards/bills/[id]:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Validation error", errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Error updating bill", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/credit-cards/bills/[id]
 * Delete a specific credit card bill
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    console.log("Deleting credit card bill:", resolvedParams.id);
    await connectDB();
    
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      console.log("No session or user found.");
      return NextResponse.json({ message: "Not authorized" }, { status: 401 });
    }

    const user = JSON.parse(JSON.stringify(session.user));
    console.log("Session found for user:", user.id);

    // Find and delete the bill, ensuring it belongs to the user
    const deletedBill = await CreditCardBill.findOneAndDelete({
      _id: resolvedParams.id,
      userId: user.id
    });

    if (!deletedBill) {
      return NextResponse.json(
        { message: "Bill not found or access denied" },
        { status: 404 }
      );
    }

    console.log("Bill deleted successfully:", resolvedParams.id);
    return NextResponse.json({
      message: "Bill deleted successfully",
      deletedBillId: resolvedParams.id
    });

  } catch (error) {
    console.error('Error in DELETE /api/credit-cards/bills/[id]:', error);
    return NextResponse.json(
      { message: "Error deleting bill", error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 