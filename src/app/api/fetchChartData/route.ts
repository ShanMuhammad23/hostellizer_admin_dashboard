import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { getAuthenticatedHostelId } from "@/lib/auth"

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId()

    const [hostelRow] = await sql`SELECT id FROM hostels WHERE id = ${hostelId} LIMIT 1`
    if (!hostelRow) {
      return NextResponse.json({ error: "Hostel not found" }, { status: 404 })
    }

    const revenueRows = await sql<{ month_start: Date; amount: string }[]>`
      WITH months AS (
        SELECT (
          generate_series(
            date_trunc('month', CURRENT_DATE::timestamp) - interval '5 months',
            date_trunc('month', CURRENT_DATE::timestamp),
            interval '1 month'
          )
        )::date AS month_start
      ),
      agg AS (
        SELECT
          date_trunc('month', ph.payment_date)::date AS month_start,
          SUM(ph.amount)::numeric AS amount
        FROM payment_history ph
        INNER JOIN students s ON s.id = ph.student_id AND s.hostelid = ${hostelId}
        WHERE ph.payment_date >= (date_trunc('month', CURRENT_DATE::timestamp) - interval '5 months')::date
        GROUP BY 1
      )
      SELECT m.month_start, COALESCE(a.amount, 0)::numeric AS amount
      FROM months m
      LEFT JOIN agg a ON a.month_start = m.month_start
      ORDER BY m.month_start ASC
    `

    const occupancyRows = await sql<{ month_start: Date; students: number; capacity: number }[]>`
      WITH months AS (
        SELECT (
          generate_series(
            date_trunc('month', CURRENT_DATE::timestamp) - interval '5 months',
            date_trunc('month', CURRENT_DATE::timestamp),
            interval '1 month'
          )
        )::date AS month_start
      ),
      cap AS (
        SELECT GREATEST(COALESCE(totalrooms, 0) * 2, 1)::int AS capacity
        FROM hostels
        WHERE id = ${hostelId}
      )
      SELECT
        m.month_start,
        (
          SELECT COUNT(*)::int
          FROM students s
          WHERE s.hostelid = ${hostelId}
            AND lower(COALESCE(s.status, 'active')) = 'active'
            AND COALESCE(s.joined_date, s.created_at::date)
              <= (m.month_start + interval '1 month - interval '1 day')::date
        ) AS students,
        (SELECT capacity FROM cap) AS capacity
      FROM months m
      ORDER BY m.month_start ASC
    `

    const revenue = revenueRows.map((row) => ({
      date: new Date(row.month_start).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      amount: Number(row.amount),
    }))

    const occupancy = occupancyRows.map((row) => ({
      month: new Date(row.month_start).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      }),
      students: Number(row.students),
      capacity: Number(row.capacity),
    }))

    if (revenue.length === 0) {
      const currentDate = new Date()
      revenue.push({
        date: currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        amount: 0,
      })
    }

    if (occupancy.length === 0) {
      const currentDate = new Date()
      occupancy.push({
        month: currentDate.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        students: 0,
        capacity: 0,
      })
    }

    return NextResponse.json({ revenue, occupancy })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ error: "Failed to fetch chart data" }, { status: 500 })
  }
}
