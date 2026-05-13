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
        "roomnumber",
        status,
        "joineddate",
        "accomodationtype",
        "monthlyrent",
        "paymentstatus"
      FROM students
      WHERE "hostelid" = ${hostelId}
      AND status = 'active'
      ORDER BY "roomnumber", name;
    `;
    
    // Group students by room number
    const studentsByRoom = students.reduce((acc, student) => {
      const roomNumber = student.roomnumber;
      if (!acc[roomNumber]) {
        acc[roomNumber] = [];
      }
      acc[roomNumber].push(student);
      return acc;
    }, {} as Record<number, typeof students>);
    
    return NextResponse.json({
      success: true,
      studentsByRoom
    });
  } catch (error) {
    console.error('Error fetching students by room:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error fetching students by room',
      },
      { status: 500 }
    );
  }
}
