import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from "@/lib/auth";

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();

    const LatestApplications = await sql`
      SELECT
        a.id,
        a.student_id,
        a.status,
        a.application_date AS date,
        hs.name AS student_name,
        COALESCE(hs.monthly_rent, 0)::numeric AS "bid-amount"
      FROM applications a
      INNER JOIN students hs ON hs.id = a.student_id AND hs.hostelid = ${hostelId}
      ORDER BY a.application_date DESC NULLS LAST
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
