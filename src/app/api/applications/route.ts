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
          a.student_id::text AS student_id,
          a.status,
          a.application_date AS date,
          COALESCE(hs.monthly_rent, 0)::numeric AS bidamount,
          hs.name AS student_name
        FROM applications a
        INNER JOIN students hs ON hs.id = a.student_id AND hs.hostelid = ${hostelId}
        WHERE a.application_date > ${lastTs.toISOString()}::timestamp
        ORDER BY a.application_date DESC
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
        a.student_id::text AS student_id,
        a.status,
        a.application_date AS date,
        COALESCE(hs.monthly_rent, 0)::numeric AS bidamount,
        hs.name AS student_name
      FROM applications a
      INNER JOIN students hs ON hs.id = a.student_id AND hs.hostelid = ${hostelId}
      ORDER BY a.application_date DESC
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
      FROM students AS s
      WHERE a.id = ${id}::integer
        AND a.student_id = s.id
        AND s.hostelid = ${hostelId}
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
