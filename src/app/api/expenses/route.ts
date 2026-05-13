import { NextResponse } from "next/server";
import { getAuthenticatedHostelId } from "@/lib/auth";
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const expenses = await sql`
      SELECT *
      FROM expenses
      WHERE hostelid = ${hostelId}
      ORDER BY expense_date DESC NULLS LAST, created_at DESC
    `;
    return NextResponse.json({
      success: true,
      expenses: expenses
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to fetch expenses",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const body = await request.json();
    const amount = body.amount;
    const description = body.description ?? null;
    const date = body.date ?? body.expense_date;
    const name = body.name;
    const category = body.category ?? null;

    if (amount == null || !date || !name) {
      return NextResponse.json(
        { success: false, message: "amount, date, and name are required" },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO expenses (hostelid, amount, description, expense_date, name, category)
      VALUES (${hostelId}, ${amount}, ${description}, ${date}, ${name}, ${category})
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      expense: result[0]
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { 
        success: false,
        message: "Failed to create expense",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
