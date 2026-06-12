import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

const VALID_STATUS = ["scheduled", "checked_in", "checked_out", "cancelled"] as const;

async function resolveId(
  params: Promise<{ id: string }> | { id: string }
): Promise<string> {
  return (await Promise.resolve(params)).id;
}

function normalizeCnic(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.replace(/\D/g, "").slice(0, 15) || null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const id = await resolveId(context.params);
    const body = (await request.json()) as Record<string, unknown>;
    const action = String(body.action ?? "").toLowerCase();

    if (action === "check_in") {
      const [row] = await sql`
        UPDATE guest_visits
        SET
          status = 'checked_in',
          check_in_at = COALESCE(check_in_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::integer AND hostelid = ${hostelId}::uuid
        RETURNING id, status, check_in_at AS "checkInAt"
      `;
      if (!row) {
        return NextResponse.json({ success: false, message: "Guest visit not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, guest: row });
    }

    if (action === "check_out") {
      const [row] = await sql`
        UPDATE guest_visits
        SET
          status = 'checked_out',
          check_out_at = COALESCE(check_out_at, CURRENT_TIMESTAMP),
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::integer AND hostelid = ${hostelId}::uuid
        RETURNING id, status, check_out_at AS "checkOutAt"
      `;
      if (!row) {
        return NextResponse.json({ success: false, message: "Guest visit not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, guest: row });
    }

    if (action === "cancel") {
      const [row] = await sql`
        UPDATE guest_visits
        SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}::integer AND hostelid = ${hostelId}::uuid
        RETURNING id, status
      `;
      if (!row) {
        return NextResponse.json({ success: false, message: "Guest visit not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, guest: row });
    }

    const guestName =
      body.guestName != null ? String(body.guestName).trim() : undefined;
    const visitStart = body.visitStart != null ? String(body.visitStart) : undefined;
    const visitEnd = body.visitEnd != null ? String(body.visitEnd) : undefined;

    if (visitStart && visitEnd && visitEnd < visitStart) {
      return NextResponse.json(
        { success: false, message: "visitEnd must be on or after visitStart" },
        { status: 400 }
      );
    }

    const studentId =
      body.studentId != null ? Number(body.studentId) : undefined;
    if (studentId) {
      const [student] = await sql`
        SELECT id FROM students
        WHERE id = ${studentId}::integer AND hostelid = ${hostelId}::uuid
      `;
      if (!student) {
        return NextResponse.json({ success: false, message: "Student not found" }, { status: 404 });
      }
    }

    const statusRaw =
      body.status != null ? String(body.status).toLowerCase() : undefined;
    if (statusRaw && !VALID_STATUS.includes(statusRaw as (typeof VALID_STATUS)[number])) {
      return NextResponse.json({ success: false, message: "Invalid status" }, { status: 400 });
    }

    const [row] = await sql`
      UPDATE guest_visits SET
        student_id = COALESCE(${studentId ?? null}::integer, student_id),
        guest_name = COALESCE(${guestName ?? null}, guest_name),
        guest_phone = COALESCE(${body.guestPhone != null ? String(body.guestPhone).trim() : null}, guest_phone),
        guest_cnic = COALESCE(${body.guestCnic != null ? normalizeCnic(body.guestCnic) : null}, guest_cnic),
        relationship = COALESCE(${body.relationship != null ? String(body.relationship).trim() : null}, relationship),
        visit_start = COALESCE(${visitStart ?? null}::date, visit_start),
        visit_end = COALESCE(${visitEnd ?? null}::date, visit_end),
        status = COALESCE(${statusRaw ?? null}, status),
        notes = COALESCE(${body.notes != null ? String(body.notes).trim() : null}, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}::integer AND hostelid = ${hostelId}::uuid
      RETURNING id
    `;

    if (!row) {
      return NextResponse.json({ success: false, message: "Guest visit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/guests/[id]", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to update guest",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const id = await resolveId(context.params);

    const [row] = await sql`
      DELETE FROM guest_visits
      WHERE id = ${id}::integer AND hostelid = ${hostelId}::uuid
      RETURNING id
    `;

    if (!row) {
      return NextResponse.json({ success: false, message: "Guest visit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/guests/[id]", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to delete guest",
      },
      { status: 500 }
    );
  }
}
