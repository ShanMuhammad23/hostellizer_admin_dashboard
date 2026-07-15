import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');
        const month = searchParams.get('month'); // Format: YYYY-MM

        console.log('Fetching summary for:', { studentId, month });

        if (!studentId || !month) {
            console.error('Missing required parameters:', { studentId, month });
            return NextResponse.json(
                { success: false, message: 'Student ID and month are required' },
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

        // Get the first and last day of the month
        const [year, monthNum] = month.split('-');
        const firstDay = `${year}-${monthNum}-01`;
        const lastDay = `${year}-${monthNum}-${new Date(parseInt(year), parseInt(monthNum), 0).getDate()}`;

        console.log('Date range:', { firstDay, lastDay });

        // First, verify that the student exists
        const studentCheck = await sql`
            SELECT id FROM students WHERE id = ${studentIdNum}
        `;

        if (studentCheck.length === 0) {
            console.error('Student not found:', studentId);
            return NextResponse.json(
                { success: false, message: 'Student not found' },
                { status: 404 }
            );
        }

        // Get active meal types
        const mealTypes = await sql`
            SELECT id, name FROM meal_types WHERE active = true
        `;

        console.log('Active meal types:', mealTypes);

        // Get attendance records
        const attendanceRecords = await sql`
            SELECT 
                mar.meal_type_id,
                mar.status,
                COUNT(*) as count
            FROM mess_attendance_records mar
            WHERE mar.student_id = ${studentIdNum}
            AND mar.attendance_date >= ${firstDay}
            AND mar.attendance_date <= ${lastDay}
            GROUP BY mar.meal_type_id, mar.status
        `;

        console.log('Attendance records:', attendanceRecords);

        // Calculate summary for each meal type
        const summary = mealTypes.map(mealType => {
            const presentCount = attendanceRecords.find(
                r => r.meal_type_id === mealType.id && r.status === 'present'
            )?.count || 0;
            const absentCount = attendanceRecords.find(
                r => r.meal_type_id === mealType.id && r.status === 'absent'
            )?.count || 0;
            const totalDays = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
            const attendancePercentage = totalDays > 0 
                ? Math.round((presentCount / totalDays) * 100)
                : 0;

            return {
                meal_name: mealType.name,
                present_count: presentCount,
                absent_count: absentCount,
                total_days: totalDays,
                attendance_percentage: attendancePercentage
            };
        });

        // Calculate overall statistics
        const overallStats = summary.reduce((acc, curr) => ({
            totalPresent: acc.totalPresent + curr.present_count,
            totalAbsent: acc.totalAbsent + curr.absent_count,
            totalMeals: acc.totalMeals + curr.total_days
        }), { totalPresent: 0, totalAbsent: 0, totalMeals: 0 });

        const response = {
            success: true,
            summary,
            overallStats: {
                ...overallStats,
                attendancePercentage: overallStats.totalMeals > 0 
                    ? Math.round((overallStats.totalPresent / overallStats.totalMeals) * 100)
                    : 0
            }
        };

        console.log('Response:', response);

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in mess attendance summary:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: 'Error fetching mess attendance summary',
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
