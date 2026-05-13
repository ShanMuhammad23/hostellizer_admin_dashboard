import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import * as XLSX from 'xlsx';
import { getAuthenticatedHostelId } from '@/lib/auth';
import { format } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    const hostel_id = await getAuthenticatedHostelId();
    
    const students = await sql`
      SELECT 
        name as "Student Name",
        email as "Email",
        phone as "Phone",
        "roomNumber" as "Room Number",
        status as "Status",
        "joinedDate",
        "accomodationType" as "Accommodation Type",
        "monthlyRent" as "Monthly Rent",
        "paymentStatus" as "Payment Status",
        "payment_due_date"
      FROM students
      WHERE hostel_id = ${hostel_id}
      ORDER BY "joinedDate" DESC;
    `;

    // Format dates in the data
    const formattedStudents = students.map(student => ({
      ...student,
      "Joined Date": format(new Date(student.joinedDate), 'dd/MM/yyyy'),
      "Payment Due Date": format(new Date(student.payment_due_date), 'dd/MM/yyyy')
    }));

    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Convert the data to a worksheet
    const worksheet = XLSX.utils.json_to_sheet(formattedStudents);
    
    // Set column widths
    const columnWidths = [
      { wch: 20 }, // Student Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 12 }, // Room Number
      { wch: 10 }, // Status
      { wch: 12 }, // Joined Date
      { wch: 20 }, // Accommodation Type
      { wch: 12 }, // Monthly Rent
      { wch: 15 }, // Payment Status
      { wch: 12 }, // Payment Due Date
    ];
    worksheet['!cols'] = columnWidths;
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");
    
    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // Set the response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    headers.set('Content-Disposition', `attachment; filename=${new Date().toISOString().split('T')[0]}.xlsx`);
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error exporting students:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error exporting students',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
