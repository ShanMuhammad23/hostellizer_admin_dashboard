import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from "@/lib/auth";

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();

    const LatestApplications = await sql`
      SELECT
        a.id,
        COALESCE(a.student_id::text, a.seeker_id::text) AS student_id,
        a.status,
        COALESCE(a.application_date, a.date) AS date,
        COALESCE(hs.name, sk.full_name) AS student_name,
        COALESCE(a.bidamount, hs.monthly_rent, 0)::numeric AS "bid-amount"
      FROM applications a
      LEFT JOIN students hs ON hs.id = a.student_id
      LEFT JOIN hostel_seekers sk ON sk.id = a.seeker_id
      WHERE a.hostelid = ${hostelId}
        OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId})
      ORDER BY COALESCE(a.application_date, a.date) DESC NULLS LAST
      LIMIT 5
    `;

    return Response.json({
      success: true,
      LatestApplications: LatestApplications,
    });
  } catch (error) {
    console.error("API Error:", error);
    return Response.json(
      {
        success: false,
        message: "Error fetching data",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
