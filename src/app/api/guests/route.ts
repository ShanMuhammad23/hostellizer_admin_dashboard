import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getAuthenticatedHostelId } from "@/lib/auth";

const VALID_STATUS = ["scheduled", "checked_in", "checked_out", "cancelled"] as const;

function normalizeCnic(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null;
  return raw.replace(/\D/g, "").slice(0, 15) || null;
}

export async function GET(request: NextRequest) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const filter = request.nextUrl.searchParams.get("filter") ?? "all";

    let statusClause = sql``;
    if (filter === "active") {
      statusClause = sql`AND g.status = 'checked_in'`;
    } else if (filter === "upcoming") {
      statusClause = sql`AND g.status = 'scheduled' AND g.visit_start > CURRENT_DATE`;
    } else if (filter === "past") {
      statusClause = sql`AND (g.status IN ('checked_out', 'cancelled') OR (g.status = 'scheduled' AND g.visit_end < CURRENT_DATE))`;
    } else if (filter === "today") {
      statusClause = sql`AND g.visit_start <= CURRENT_DATE AND g.visit_end >= CURRENT_DATE AND g.status NOT IN ('cancelled', 'checked_out')`;
    }

    const rows = await sql`
      SELECT
        g.id,
        g.hostelid,
        g.student_id AS "studentId",
        g.guest_name AS "guestName",
        g.guest_phone AS "guestPhone",
        g.guest_cnic AS "guestCnic",
        g.relationship,
        g.visit_start AS "visitStart",
        g.visit_end AS "visitEnd",
        g.check_in_at AS "checkInAt",
        g.check_out_at AS "checkOutAt",
        g.status,
        g.notes,
        g.created_at AS "createdAt",
        g.updated_at AS "updatedAt",
        s.name AS "studentName",
        s.room_number AS "roomNumber"
      FROM guest_visits g
      INNER JOIN students s ON s.id = g.student_id AND s.hostelid = ${hostelId}::uuid
      WHERE g.hostelid = ${hostelId}::uuid
      ${statusClause}
      ORDER BY
        CASE g.status
          WHEN 'checked_in' THEN 0
          WHEN 'scheduled' THEN 1
          ELSE 2
        END,
        g.visit_start DESC,
        g.created_at DESC
    `;

    const [counts] = await sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'checked_in')::int AS active,
        COUNT(*) FILTER (
          WHERE status = 'scheduled'
            AND visit_start <= CURRENT_DATE
            AND visit_end >= CURRENT_DATE
        )::int AS due_today,
        COUNT(*) FILTER (
          WHERE status = 'scheduled' AND visit_start > CURRENT_DATE
        )::int AS upcoming
      FROM guest_visits
      WHERE hostelid = ${hostelId}::uuid
    `;

    return NextResponse.json({
      success: true,
      guests: rows,
      counts: counts ?? { active: 0, due_today: 0, upcoming: 0 },
    });
  } catch (error) {
    console.error("GET /api/guests", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to load guests",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const body = (await request.json()) as Record<string, unknown>;

    const studentId = Number(body.studentId ?? body.student_id);
    const guestName = String(body.guestName ?? body.guest_name ?? "").trim();
    const visitStart = String(body.visitStart ?? body.visit_start ?? "");
    const visitEnd = String(body.visitEnd ?? body.visit_end ?? "");

    if (!studentId || !guestName || !visitStart || !visitEnd) {
      return NextResponse.json(
        {
          success: false,
          message: "studentId, guestName, visitStart, and visitEnd are required",
        },
        { status: 400 }
      );
    }

    if (visitEnd < visitStart) {
      return NextResponse.json(
        { success: false, message: "visitEnd must be on or after visitStart" },
        { status: 400 }
      );
    }

    const [student] = await sql`
      SELECT id FROM students
      WHERE id = ${studentId}::integer AND hostelid = ${hostelId}::uuid
    `;
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Student not found" },
        { status: 404 }
      );
    }

    const statusRaw = String(body.status ?? "scheduled").toLowerCase();
    const status = VALID_STATUS.includes(statusRaw as (typeof VALID_STATUS)[number])
      ? statusRaw
      : "scheduled";

    const [row] = await sql`
      INSERT INTO guest_visits (
        hostelid,
        student_id,
        guest_name,
        guest_phone,
        guest_cnic,
        relationship,
        visit_start,
        visit_end,
        status,
        notes
      ) VALUES (
        ${hostelId}::uuid,
        ${studentId}::integer,
        ${guestName},
        ${body.guestPhone ?? body.guest_phone ? String(body.guestPhone ?? body.guest_phone).trim() : null},
        ${normalizeCnic(body.guestCnic ?? body.guest_cnic)},
        ${body.relationship ? String(body.relationship).trim() : null},
        ${visitStart}::date,
        ${visitEnd}::date,
        ${status},
        ${body.notes ? String(body.notes).trim() : null}
      )
      RETURNING
        id,
        student_id AS "studentId",
        guest_name AS "guestName",
        guest_phone AS "guestPhone",
        guest_cnic AS "guestCnic",
        relationship,
        visit_start AS "visitStart",
        visit_end AS "visitEnd",
        status,
        notes
    `;

    return NextResponse.json({ success: true, guest: row });
  } catch (error) {
    console.error("POST /api/guests", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to register guest",
      },
      { status: 500 }
    );
  }
}
