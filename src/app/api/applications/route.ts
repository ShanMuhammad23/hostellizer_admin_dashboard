import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
import { addNotification } from '@/lib/notifications';

export async function GET(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const url = new URL(request.url);
    const lastUpdate = url.searchParams.get('lastUpdate');

    if (lastUpdate) {
      const lastTs = new Date(lastUpdate);
      if (Number.isNaN(lastTs.getTime())) {
        return NextResponse.json(
          { success: false, message: 'Invalid lastUpdate timestamp' },
          { status: 400 }
        );
      }

      const newApplications = await sql`
        SELECT
          a.id,
          COALESCE(a.student_id::text, a.seeker_id::text) AS student_id,
          a.status,
          COALESCE(a.application_date, a.date) AS date,
          COALESCE(a.bidamount, hs.monthly_rent, 0)::numeric AS bidamount,
          COALESCE(hs.name, sk.full_name) AS student_name
        FROM applications a
        LEFT JOIN students hs ON hs.id = a.student_id
        LEFT JOIN hostel_seekers sk ON sk.id = a.seeker_id
        WHERE (
          a.hostelid = ${hostelId}
          OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId})
        )
          AND COALESCE(a.application_date, a.date) > ${lastTs.toISOString()}::timestamp
        ORDER BY COALESCE(a.application_date, a.date) DESC
      `;

      for (const app of newApplications) {
        await addNotification(`New application received from ${app.student_name}`);
      }

      return NextResponse.json({
        success: true,
        applications: newApplications,
        hasNew: newApplications.length > 0,
      });
    }

    const applications = await sql`
      SELECT
        a.id,
        COALESCE(a.student_id::text, a.seeker_id::text) AS student_id,
        a.status,
        COALESCE(a.application_date, a.date) AS date,
        COALESCE(a.bidamount, hs.monthly_rent, 0)::numeric AS bidamount,
        COALESCE(hs.name, sk.full_name) AS student_name
      FROM applications a
      LEFT JOIN students hs ON hs.id = a.student_id
      LEFT JOIN hostel_seekers sk ON sk.id = a.seeker_id
      WHERE a.hostelid = ${hostelId}
        OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId})
      ORDER BY COALESCE(a.application_date, a.date) DESC
    `;

    return NextResponse.json({
      success: true,
      applications,
      hasNew: false,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      {
        success: false,
        message:
          'Failed to fetch applications. Please check your internet connection or try again!',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const { id, status } = await request.json();

    const result = await sql`
      UPDATE applications AS a
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE a.id = ${id}::integer
        AND (
          a.hostelid = ${hostelId}
          OR EXISTS (
            SELECT 1
            FROM students s
            WHERE s.id = a.student_id
              AND s.hostelid = ${hostelId}
          )
        )
      RETURNING a.*
    `;

    if (result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Application not found',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Application status updated successfully',
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update application status',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
