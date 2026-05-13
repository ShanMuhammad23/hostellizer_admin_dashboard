import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const students = await sql`
      SELECT
        id,
        name,
        email,
        phone,
        room_number AS "roomnumber",
        status,
        joined_date AS "joineddate",
        accommodation_type AS "accomodationtype",
        monthly_rent AS "monthlyrent",
        payment_status AS "paymentstatus",
        payment_due_date AS "payment_due_date",
        hostelid
      FROM students
      WHERE hostelid = ${hostelId}
      ORDER BY joined_date DESC NULLS LAST, created_at DESC;
    `;
    
    return NextResponse.json({
      success: true,
      students: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching students',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const { name, email, phone, address, roomNumber, status, accomodationType, monthlyRent, istakingmess } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !address || !roomNumber || !status || !accomodationType || !monthlyRent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sql`
      INSERT INTO students (
        name,
        email,
        phone,
        address,
        room_number,
        status,
        accommodation_type,
        monthly_rent,
        hostelid,
        joined_date
      )
      VALUES (
        ${name},
        ${email},
        ${phone},
        ${sql.json(address)},
        ${roomNumber},
        ${status},
        ${accomodationType},
        ${monthlyRent},
        ${hostelId},
        CURRENT_DATE
      )
      RETURNING *
    `;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
