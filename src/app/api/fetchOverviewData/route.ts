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
            ),
            rent_30d AS (
                SELECT COALESCE(SUM(ph.amount), 0)::numeric AS v
                FROM payment_history ph
                INNER JOIN students s ON s.id = ph.student_id AND s.hostelid = ${hostelid}
                WHERE ph.payment_date >= (CURRENT_DATE - INTERVAL '30 days')
            ),
            rent_prev30d AS (
                SELECT COALESCE(SUM(ph.amount), 0)::numeric AS v
                FROM payment_history ph
                INNER JOIN students s ON s.id = ph.student_id AND s.hostelid = ${hostelid}
                WHERE ph.payment_date >= (CURRENT_DATE - INTERVAL '60 days')
                  AND ph.payment_date < (CURRENT_DATE - INTERVAL '30 days')
            ),
            exp_30d AS (
                SELECT COALESCE(SUM(e.amount), 0)::numeric AS v
                FROM expenses e
                WHERE e.hostelid = ${hostelid}
                  AND e.expense_date >= (CURRENT_DATE - INTERVAL '30 days')
            ),
            exp_prev30d AS (
                SELECT COALESCE(SUM(e.amount), 0)::numeric AS v
                FROM expenses e
                WHERE e.hostelid = ${hostelid}
                  AND e.expense_date >= (CURRENT_DATE - INTERVAL '60 days')
                  AND e.expense_date < (CURRENT_DATE - INTERVAL '30 days')
            ),
            new_stu_30 AS (
                SELECT COUNT(*)::bigint AS c
                FROM students s
                WHERE s.hostelid = ${hostelid}
                  AND COALESCE(s.joined_date, s.created_at::date) >= (CURRENT_DATE - INTERVAL '30 days')
            ),
            new_stu_prev30 AS (
                SELECT COUNT(*)::bigint AS c
                FROM students s
                WHERE s.hostelid = ${hostelid}
                  AND COALESCE(s.joined_date, s.created_at::date) >= (CURRENT_DATE - INTERVAL '60 days')
                  AND COALESCE(s.joined_date, s.created_at::date) < (CURRENT_DATE - INTERVAL '30 days')
            )
            SELECT
                h.name AS hostel_name,
                h.hostel_type AS hostel_type,
                stu.c AS total_students,
                h.totalrooms AS total_rooms,
                h.vacanciesavailable AS vacancies_available,
                rent.total AS total_rent_collected,
                exp.total AS total_expenses,
                rent.total - exp.total AS profit,
                CASE
                    WHEN rent_prev30d.v > 0 THEN ((rent_30d.v - rent_prev30d.v) / rent_prev30d.v * 100)::numeric
                    ELSE NULL::numeric
                END AS rent_trend_pct,
                CASE
                    WHEN exp_prev30d.v > 0 THEN ((exp_30d.v - exp_prev30d.v) / exp_prev30d.v * 100)::numeric
                    ELSE NULL::numeric
                END AS expense_trend_pct,
                CASE
                    WHEN (rent_prev30d.v - exp_prev30d.v) <> 0 THEN
                        (((rent_30d.v - exp_30d.v) - (rent_prev30d.v - exp_prev30d.v))
                            / NULLIF(ABS(rent_prev30d.v - exp_prev30d.v), 0) * 100)::numeric
                    WHEN (rent_prev30d.v - exp_prev30d.v) = 0 AND (rent_30d.v - exp_30d.v) <> 0 THEN 100::numeric
                    ELSE NULL::numeric
                END AS profit_trend_pct,
                new_stu_30.c AS new_students_30d,
                new_stu_prev30.c AS new_students_prev_30d,
                CASE
                    WHEN GREATEST(COALESCE(h.totalrooms, 0) * 2, 1) > 0 THEN
                        ((GREATEST(COALESCE(h.totalrooms, 0) * 2, 1) - COALESCE(h.vacanciesavailable, 0))::numeric
                            / GREATEST(COALESCE(h.totalrooms, 0) * 2, 1)::numeric * 100)
                    ELSE NULL::numeric
                END AS occupancy_pct
            FROM h
            CROSS JOIN stu
            CROSS JOIN rent
            CROSS JOIN exp
            CROSS JOIN rent_30d
            CROSS JOIN rent_prev30d
            CROSS JOIN exp_30d
            CROSS JOIN exp_prev30d
            CROSS JOIN new_stu_30
            CROSS JOIN new_stu_prev30
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
