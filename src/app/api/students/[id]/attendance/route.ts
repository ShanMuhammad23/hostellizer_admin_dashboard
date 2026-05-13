import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/students/[id]/attendance?month=2024-03
// Uses `attendance` (student_id integer). `attendance_records` uses uuid student_id and does not match students.id.
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month'); // Format: YYYY-MM

    if (!month) {
      return NextResponse.json(
        { success: false, message: 'Month parameter is required' },
        { status: 400 }
      );
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json(
        { success: false, message: 'Invalid month format. Use YYYY-MM' },
        { status: 400 }
      );
    }

    const attendanceRecords = await sql`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('month', ${month}::date),
          (date_trunc('month', ${month}::date) + interval '1 month - 1 day')::date,
          '1 day'::interval
        )::date AS date
      ),
      attendance_summary AS (
        SELECT
          ar.date AS attendance_date,
          ar.status,
          ar.notes,
          ar.created_at
        FROM attendance ar
        WHERE ar.student_id = ${id}::integer
          AND ar.date >= date_trunc('month', ${month}::date)
          AND ar.date < date_trunc('month', ${month}::date) + interval '1 month'
      ),
      monthly_stats AS (
        SELECT
          COUNT(*) FILTER (WHERE status = 'present') AS total_present,
          COUNT(*) FILTER (WHERE status = 'absent') AS total_absent,
          COUNT(*) FILTER (WHERE status = 'leave') AS total_leave
        FROM attendance_summary
      )
      SELECT
        d.date,
        COALESCE(a.status, 'not_marked') AS status,
        a.notes,
        a.created_at,
        ms.total_present,
        ms.total_absent,
        ms.total_leave
      FROM dates d
      LEFT JOIN attendance_summary a ON d.date = a.attendance_date
      CROSS JOIN monthly_stats ms
      ORDER BY d.date;
    `;

    if (attendanceRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No attendance records found for this month',
        attendance: [],
        summary: {
          total_present: 0,
          total_absent: 0,
          total_leave: 0,
        },
      });
    }

    const summary = {
      total_present: attendanceRecords[0].total_present,
      total_absent: attendanceRecords[0].total_absent,
      total_leave: attendanceRecords[0].total_leave,
    };

    const attendance = attendanceRecords.map((record) => ({
      date: record.date,
      status: record.status,
      notes: record.notes,
      created_at: record.created_at,
    }));

    return NextResponse.json({
      success: true,
      attendance,
      summary,
    });
  } catch (error) {
    console.error('Error fetching attendance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching attendance records',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST /api/students/[id]/attendance
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { date, status, notes } = body;

    if (!date || !status) {
      return NextResponse.json(
        { success: false, message: 'Date and status are required' },
        { status: 400 }
      );
    }

    if (!['present', 'absent', 'leave'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status. Must be present, absent, or leave' },
        { status: 400 }
      );
    }

    const existingAttendance = await sql`
      SELECT id FROM attendance
      WHERE student_id = ${id}::integer
        AND date = ${date}::date
    `;

    if (existingAttendance.length > 0) {
      const result = await sql`
        UPDATE attendance
        SET
          status = ${status},
          notes = ${notes ?? null}
        WHERE student_id = ${id}::integer
          AND date = ${date}::date
        RETURNING *
      `;

      return NextResponse.json({
        success: true,
        message: 'Attendance updated successfully',
        attendance: result[0],
      });
    }

    const result = await sql`
      INSERT INTO attendance (
        student_id,
        date,
        status,
        notes
      )
      VALUES (
        ${id}::integer,
        ${date}::date,
        ${status},
        ${notes ?? null}
      )
      RETURNING *
    `;

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully',
      attendance: result[0],
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error marking attendance',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
