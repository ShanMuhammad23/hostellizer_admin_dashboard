import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const rows = await sql`
      SELECT
        p.id,
        p.year,
        p.month,
        p.status,
        p.notes,
        p.created_at AS "createdAt",
        (SELECT COUNT(*)::int FROM staff_payroll_entries e WHERE e.payroll_period_id = p.id) AS "entryCount"
      FROM staff_payroll_periods p
      WHERE p.hostelid = ${hostelId}
      ORDER BY p.year DESC, p.month DESC
      LIMIT 36
    `;
    return NextResponse.json({ success: true, periods: rows });
  } catch (e) {
    console.error("GET payroll periods", e);
    return NextResponse.json(
      { success: false, message: "Failed to load payroll periods" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const body = (await request.json()) as { year?: number; month?: number };
    const year = Number(body.year);
    const month = Number(body.month);
    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json(
        { success: false, message: "year and month (1–12) required" },
        { status: 400 }
      );
    }

    const [row] = await sql`
      INSERT INTO staff_payroll_periods (hostelid, year, month, status)
      VALUES (${hostelId}, ${year}::smallint, ${month}::smallint, 'draft')
      ON CONFLICT (hostelid, year, month) DO UPDATE SET
        updated_at = CURRENT_TIMESTAMP
      RETURNING id, year, month, status
    `;

    return NextResponse.json({ success: true, period: row });
  } catch (e) {
    console.error("POST payroll period", e);
    return NextResponse.json(
      { success: false, message: "Failed to create payroll period" },
      { status: 500 }
    );
  }
}
