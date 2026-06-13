import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

/** Counts for the dashboard critical alerts strip */
export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();

    const rows = await sql`
      SELECT
        (
          SELECT COUNT(*)::bigint
          FROM students s
          WHERE s.hostelid = ${hostelId}
            AND lower(COALESCE(s.status, 'active')) = 'active'
            AND (
              lower(COALESCE(s.payment_status, '')) = 'overdue'
              OR (
                s.payment_due_date IS NOT NULL
                AND s.payment_due_date < CURRENT_DATE
                AND lower(COALESCE(s.payment_status, 'pending')) <> 'paid'
              )
            )
        )::text AS overdue_rent,
        (
          SELECT COUNT(*)::bigint
          FROM applications a
          LEFT JOIN students s ON s.id = a.student_id
          WHERE lower(COALESCE(a.status, '')) = 'pending'
            AND (
              a.hostelid = ${hostelId}
              OR (a.hostelid IS NULL AND s.hostelid = ${hostelId})
            )
        )::text AS pending_applications,
        (
          SELECT COUNT(*)::bigint
          FROM students s
          WHERE s.hostelid = ${hostelId}
            AND lower(COALESCE(s.status, 'active')) = 'active'
            AND COALESCE(s.is_taking_mess, false) = true
            AND (
              lower(COALESCE(s.payment_status, '')) = 'overdue'
              OR (
                s.payment_due_date IS NOT NULL
                AND s.payment_due_date < CURRENT_DATE
                AND lower(COALESCE(s.payment_status, 'pending')) <> 'paid'
              )
            )
        )::text AS mess_defaulters
    `;
    const row = rows[0] as
      | { overdue_rent: string; pending_applications: string; mess_defaulters: string }
      | undefined;

    return NextResponse.json({
      success: true,
      overdueRent: Number(row?.overdue_rent ?? 0),
      pendingApplications: Number(row?.pending_applications ?? 0),
      messDefaulters: Number(row?.mess_defaulters ?? 0),
    });
  } catch (error) {
    console.error("dashboard/alerts:", error);
    return NextResponse.json(
      {
        success: false,
        overdueRent: 0,
        pendingApplications: 0,
        messDefaulters: 0,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
