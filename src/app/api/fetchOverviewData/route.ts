import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';

export async function GET() {
    try {
        const hostelid = await getAuthenticatedHostelId();
        
        const overviewData = await sql`
            WITH h AS (
                SELECT name, hostel_type, totalrooms, vacanciesavailable
                FROM hostels
                WHERE id = ${hostelid}
            ),
            stu AS (
                SELECT COUNT(*)::bigint AS c
                FROM students
                WHERE hostelid = ${hostelid}
                  AND lower(COALESCE(status, 'active')) = 'active'
            ),
            rent AS (
                SELECT COALESCE(SUM(ph.amount), 0)::numeric AS total
                FROM payment_history ph
                INNER JOIN students s ON s.id = ph.student_id AND s.hostelid = ${hostelid}
            ),
            exp AS (
                SELECT COALESCE(SUM(e.amount), 0)::numeric AS total
                FROM expenses e
                WHERE e.hostelid = ${hostelid}
            )
            SELECT
                h.name AS hostel_name,
                h.hostel_type AS hostel_type,
                stu.c AS total_students,
                h.totalrooms AS total_rooms,
                h.vacanciesavailable AS vacancies_available,
                rent.total AS total_rent_collected,
                exp.total AS total_expenses,
                rent.total - exp.total AS profit
            FROM h
            CROSS JOIN stu
            CROSS JOIN rent
            CROSS JOIN exp
        `;

        return Response.json({
            success: true,
            overviewData: overviewData
        });
    } catch (error) {
        console.error('API Error:', error);
        return Response.json({
            success: false,
            message: 'Error fetching data',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
