import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();

    let messAttendanceToday = 0;
    try {
      const [messToday] = await sql<{ c: string }[]>`
        SELECT COUNT(DISTINCT mar.student_id)::text AS c
        FROM mess_attendance_records mar
        INNER JOIN students s ON s.id = mar.student_id
        WHERE s.hostelid = ${hostelId}
          AND mar.attendance_date = CURRENT_DATE
      `;
      messAttendanceToday = Number(messToday?.c ?? 0);
    } catch {
      messAttendanceToday = 0;
    }

    const [messMonth] = await sql<{ c: string }[]>`
      SELECT COUNT(DISTINCT s.id)::text AS c
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
    `;

    const upcoming = await sql<
      { id: number; name: string; payment_due_date: string }[]
    >`
      SELECT s.id, s.name, s.payment_due_date::text
      FROM students s
      WHERE s.hostelid = ${hostelId}
        AND lower(COALESCE(s.status, 'active')) = 'active'
        AND s.payment_due_date IS NOT NULL
        AND s.payment_due_date >= CURRENT_DATE
        AND s.payment_due_date <= CURRENT_DATE + interval '14 days'
        AND lower(COALESCE(s.payment_status, 'pending')) <> 'paid'
      ORDER BY s.payment_due_date ASC
      LIMIT 6
    `;

    return NextResponse.json({
      success: true,
      messAttendanceToday,
      messDefaultersMonth: Number(messMonth?.c ?? 0),
      upcomingRent: upcoming.map((r) => ({
        id: String(r.id),
        name: r.name,
        due: r.payment_due_date,
      })),
    });
  } catch (error) {
    console.error("dashboard/snapshot:", error);
    return NextResponse.json(
      {
        success: false,
        messAttendanceToday: 0,
        messDefaultersMonth: 0,
        upcomingRent: [],
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
