import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
export async function GET(request: Request) {
  const hostelId = await getAuthenticatedHostelId();
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 25;
    const offset = (page - 1) * limit;

    const countResult = await sql`
      SELECT COUNT(*)::bigint AS total
      FROM reviews r
      INNER JOIN students s ON s.id = r.student_id AND s.hostelid = ${hostelId}
    `;
    const total = parseInt(countResult[0].total);
    const totalPages = Math.ceil(total / limit);

    const reviews = await sql`
      SELECT
        r.id,
        r.rating,
        r.content,
        s.name AS student_name,
        COALESCE(r.review_date, r.created_at) AS created_at
      FROM reviews r
      INNER JOIN students s ON s.id = r.student_id AND s.hostelid = ${hostelId}
      ORDER BY COALESCE(r.review_date, r.created_at) DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
    
    return NextResponse.json({
      success: true,
      reviews: reviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews: total,
        reviewsPerPage: limit
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching reviews',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
