import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function staffId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const sid = await staffId(context.params);

    const [s] = await sql`
      SELECT id FROM staff WHERE id = ${sid}::integer AND hostelid = ${hostelId}
    `;
    if (!s) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const rows = await sql`
      SELECT
        lr.id,
        lr.leave_type AS "leaveType",
        lr.start_date AS "startDate",
        lr.end_date AS "endDate",
        lr.days_count AS "daysCount",
        lr.is_paid AS "isPaid",
        lr.status,
        lr.approved_by AS "approvedBy",
        lr.notes,
        lr.created_at AS "createdAt"
      FROM staff_leave_requests lr
      WHERE lr.staff_id = ${sid}::integer
      ORDER BY lr.start_date DESC
    `;

    return NextResponse.json({ success: true, leaves: rows });
  } catch (e) {
    console.error("GET leave", e);
    return NextResponse.json(
      { success: false, message: "Failed to load leave" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const sid = await staffId(context.params);
    const body = (await request.json()) as Record<string, unknown>;

    const [s] = await sql`
      SELECT id FROM staff WHERE id = ${sid}::integer AND hostelid = ${hostelId}
    `;
    if (!s) {
      return NextResponse.json(
        { success: false, message: "Staff not found" },
        { status: 404 }
      );
    }

    const leaveType = String(body.leaveType ?? "casual").toLowerCase();
    const allowed = ["casual", "sick", "annual", "unpaid", "other"];
    if (!allowed.includes(leaveType)) {
      return NextResponse.json(
        { success: false, message: "Invalid leave type" },
        { status: 400 }
      );
    }

    const start = String(body.startDate ?? "").slice(0, 10);
    const end = String(body.endDate ?? "").slice(0, 10);
    if (!start || !end) {
      return NextResponse.json(
        { success: false, message: "startDate and endDate required" },
        { status: 400 }
      );
    }

    const daysCount = Number(body.daysCount ?? 1);
    const isPaid = body.isPaid === true;

    await sql`
      INSERT INTO staff_leave_requests (
        staff_id,
        leave_type,
        start_date,
        end_date,
        days_count,
        is_paid,
        status,
        notes
      )
      VALUES (
        ${sid}::integer,
        ${leaveType},
        ${start}::date,
        ${end}::date,
        ${Number.isFinite(daysCount) ? daysCount : 1},
        ${isPaid},
        'pending',
        ${String(body.notes ?? "").trim() || null}
      )
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST leave", e);
    return NextResponse.json(
      { success: false, message: "Failed to create leave request" },
      { status: 500 }
    );
  }
}
