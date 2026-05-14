import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

async function leaveId(
  params: Promise<{ leaveId: string }> | { leaveId: string }
): Promise<string> {
  return (await Promise.resolve(params)).leaveId;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ leaveId: string }> | { leaveId: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const lid = await leaveId(context.params);
    const body = (await request.json()) as { status?: string; approvedBy?: string };

    const st = String(body.status ?? "").toLowerCase();
    if (!["approved", "rejected", "cancelled"].includes(st)) {
      return NextResponse.json(
        { success: false, message: "Invalid status" },
        { status: 400 }
      );
    }

    const [row] = await sql`
      UPDATE staff_leave_requests lr
      SET
        status = ${st},
        approved_by = ${String(body.approvedBy ?? "").trim() || null},
        updated_at = CURRENT_TIMESTAMP
      FROM staff s
      WHERE lr.id = ${lid}::integer
        AND lr.staff_id = s.id
        AND s.hostelid = ${hostelId}
      RETURNING lr.id
    `;

    if (!row) {
      return NextResponse.json(
        { success: false, message: "Leave request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("PATCH leave", e);
    return NextResponse.json(
      { success: false, message: "Failed to update leave" },
      { status: 500 }
    );
  }
}
