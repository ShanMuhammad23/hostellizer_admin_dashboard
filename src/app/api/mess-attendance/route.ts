import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// GET /api/mess-attendance?studentId=xxx&date=xxx
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const date = searchParams.get('date');

        if (!studentId || !date) {
            return NextResponse.json(
                { success: false, message: 'Student ID and date are required' },
                { status: 400 }
            );
        }

        const studentIdNum = Number(studentId);
        if (!Number.isInteger(studentIdNum)) {
            return NextResponse.json(
                { success: false, message: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const attendance = await sql`
            SELECT 
                mar.id,
                mar.student_id,
                mar.attendance_date,
                mar.meal_type_id,
                mar.status,
                mar.created_at,
                mt.name as meal_type_name,
                mt.start_time,
                mt.end_time
            FROM mess_attendance_records mar
            JOIN meal_types mt ON mar.meal_type_id = mt.id
            WHERE mar.student_id = ${studentIdNum}
            AND mar.attendance_date = ${date}
            ORDER BY mt.start_time;
        `;

        return NextResponse.json({
            success: true,
            attendance
        });
    } catch (error) {
        console.error('Error fetching mess attendance:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching mess attendance' },
            { status: 500 }
        );
    }
}

// POST /api/mess-attendance
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { studentId, date, mealTypeId, status } = body;

        if (!studentId || !date || !mealTypeId || !status) {
            return NextResponse.json(
                { success: false, message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const studentIdNum = Number(studentId);
        if (!Number.isInteger(studentIdNum)) {
            return NextResponse.json(
                { success: false, message: 'Invalid student ID' },
                { status: 400 }
            );
        }

        const result = await sql`
            INSERT INTO mess_attendance_records (
                student_id,
                attendance_date,
                meal_type_id,
                status
            ) VALUES (
                ${studentIdNum},
                ${date},
                ${mealTypeId},
                ${status}
            )
            ON CONFLICT (student_id, attendance_date, meal_type_id)
            DO UPDATE SET
                status = EXCLUDED.status,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *;
        `;

        return NextResponse.json({
            success: true,
            attendance: result[0]
        });
    } catch (error) {
        console.error('Error updating mess attendance:', error);
        return NextResponse.json(
            { success: false, message: 'Error updating mess attendance' },
            { status: 500 }
        );
    }
}
