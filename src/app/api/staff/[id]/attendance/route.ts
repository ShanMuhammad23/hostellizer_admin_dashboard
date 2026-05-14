import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function staffId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const sid = await staffId(context.params);
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");
    if (!from || !to) {
      return NextResponse.json(
        { success: false, message: "Query params from and to (YYYY-MM-DD) required" },
        { status: 400 }
      );
    }

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
        a.id,
        a.attendance_date AS "attendanceDate",
        a.check_in AS "checkIn",
        a.check_out AS "checkOut",
        a.status,
        a.shift_code AS "shiftCode",
        a.late_minutes AS "lateMinutes",
        a.overtime_minutes AS "overtimeMinutes",
        a.notes,
        a.created_at AS "createdAt"
      FROM staff_attendance a
      WHERE a.staff_id = ${sid}::integer
        AND a.attendance_date >= ${from}::date
        AND a.attendance_date <= ${to}::date
      ORDER BY a.attendance_date ASC
    `;

    return NextResponse.json({ success: true, attendance: rows });
  } catch (e) {
    console.error("GET attendance", e);
    return NextResponse.json(
      { success: false, message: "Failed to load attendance" },
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

    const date = String(body.attendanceDate ?? "").slice(0, 10);
    if (!date) {
      return NextResponse.json(
        { success: false, message: "attendanceDate required" },
        { status: 400 }
      );
    }

    const status = String(body.status ?? "present").toLowerCase();
    const allowed = ["present", "absent", "late", "half_day", "leave"];
    if (!allowed.includes(status)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const checkIn =
      typeof body.checkIn === "string" && body.checkIn ? body.checkIn : null;
    const checkOut =
      typeof body.checkOut === "string" && body.checkOut ? body.checkOut : null;
    const shiftCode =
      typeof body.shiftCode === "string" ? body.shiftCode.slice(0, 40) : null;
    const late = Number(body.lateMinutes ?? 0) || 0;
    const ot = Number(body.overtimeMinutes ?? 0) || 0;
    const notes = String(body.notes ?? "").trim() || null;
    const markedBy =
      body.markedByUserId != null ? Number(body.markedByUserId) : null;

    await sql`
      INSERT INTO staff_attendance (
        staff_id,
        attendance_date,
        check_in,
        check_out,
        status,
        marked_by_user_id,
        shift_code,
        late_minutes,
        overtime_minutes,
        notes
      )
      VALUES (
        ${sid}::integer,
        ${date}::date,
        ${checkIn}::time,
        ${checkOut}::time,
        ${status},
        ${markedBy},
        ${shiftCode},
        ${late},
        ${ot},
        ${notes}
      )
      ON CONFLICT (staff_id, attendance_date) DO UPDATE SET
        check_in = EXCLUDED.check_in,
        check_out = EXCLUDED.check_out,
        status = EXCLUDED.status,
        marked_by_user_id = EXCLUDED.marked_by_user_id,
        shift_code = EXCLUDED.shift_code,
        late_minutes = EXCLUDED.late_minutes,
        overtime_minutes = EXCLUDED.overtime_minutes,
        notes = EXCLUDED.notes,
        updated_at = CURRENT_TIMESTAMP
    `;

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("POST attendance", e);
    return NextResponse.json(
      { success: false, message: "Failed to save attendance" },
      { status: 500 }
    );
  }
}
