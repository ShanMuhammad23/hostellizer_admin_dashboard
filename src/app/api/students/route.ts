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
        is_taking_mess AS "istakingmess",
        COALESCE(profile_image_path, '') AS "image",
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
    const {
      name,
      email,
      phone,
      address,
      roomNumber,
      status,
      accomodationType,
      monthlyRent,
      paymentStatus,
      payment_due_date,
      istakingmess,
      profileImagePath,
    } = await request.json();

    const paymentStatusNorm =
      paymentStatus === "paid" ||
      paymentStatus === "pending" ||
      paymentStatus === "overdue"
        ? paymentStatus
        : "pending";

    const paymentDueDate =
      typeof payment_due_date === "string" && payment_due_date.trim() !== ""
        ? payment_due_date.trim().slice(0, 10)
        : null;

    const isTakingMess =
      istakingmess === true ||
      istakingmess === "true" ||
      istakingmess === 1;

    // Validate required fields
    if (!name || !email || !phone || !address || !roomNumber || !status || !accomodationType || !monthlyRent) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const imagePath =
      typeof profileImagePath === "string" &&
      profileImagePath.startsWith("/uploads/students/")
        ? profileImagePath
        : null;

    const addr =
      typeof address === "string"
        ? { street: address, town: "", city: "" }
        : address;

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
        payment_status,
        payment_due_date,
        is_taking_mess,
        hostelid,
        joined_date,
        profile_image_path
      )
      VALUES (
        ${name},
        ${email},
        ${phone},
        ${sql.json(addr)},
        ${roomNumber},
        ${status},
        ${accomodationType},
        ${monthlyRent},
        ${paymentStatusNorm},
        ${paymentDueDate},
        ${isTakingMess},
        ${hostelId},
        CURRENT_DATE,
        ${imagePath}
      )
      RETURNING id
    `;

    return NextResponse.json({
      success: true,
      student: result[0],
    });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}
