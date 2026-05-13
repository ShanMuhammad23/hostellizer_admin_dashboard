import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from "@/lib/auth";

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();

    const LatestExpenses = await sql`
      SELECT
        id,
        hostelid::text AS hostel_id,
        name,
        amount,
        expense_date AS date,
        COALESCE(description, '') AS description,
        created_at,
        updated_at
      FROM expenses
      WHERE hostelid = ${hostelId}
      ORDER BY expense_date DESC NULLS LAST, created_at DESC
      LIMIT 5
    `;

    return Response.json({
      success: true,
      LatestExpenses: LatestExpenses,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
