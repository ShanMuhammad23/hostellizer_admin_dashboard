import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { id } = await context.params;
    const hostelId = await getAuthenticatedHostelId();
    const response = await sql`
      UPDATE students
      SET
        name = ${data.name},
        email = ${data.email},
        phone = ${data.phone},
        address = ${sql.json(data.address)},
        room_number = ${data.roomnumber},
        status = ${data.status},
        accommodation_type = ${data.accomodationtype},
        monthly_rent = ${data.monthlyrent},
        payment_status = ${data.paymentstatus},
        payment_due_date = ${data.payment_due_date},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
        AND hostelid = ${hostelId}
      RETURNING *
    `;

    if (response.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      student: response[0]
    });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { success: false, message: 'Error updating student' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await context.params;
    const hostelId = await getAuthenticatedHostelId();

    const response = await sql`
      DELETE FROM students
      WHERE id = ${id}
        AND hostelid = ${hostelId}
      RETURNING *
    `;

    if (response.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Student not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { success: false, message: 'Error deleting student' },
      { status: 500 }
    );
  }
}

export async function GET(

    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        console.log('Fetching student with ID:', id);
        const hostelId = await getAuthenticatedHostelId();
        const response = await sql`
            WITH student_data AS (
                SELECT
                    s.id,
                    s.name,
                    s.email,
                    s.phone,
                    s.address,
                    s.room_number AS "roomnumber",
                    s.status,
                    s.joined_date AS "joineddate",
                    NULL::date AS "leavedate",
                    s.accommodation_type AS "accomodationtype",
                    s.monthly_rent AS "monthlyrent",
                    FALSE AS "istakingmess",
                    s.payment_status AS "paymentstatus",
                    s.payment_due_date AS "payment_due_date"
                FROM students s
                WHERE s.id = ${id}::integer
                  AND s.hostelid = ${hostelId}
            ),
            payment_data AS (
                SELECT
                    ph.student_id AS studentid,
                    json_agg(
                        json_build_object(
                            'id', ph.id,
                            'amount', ph.amount,
                            'date', ph.payment_date,
                            'createdAt', ph.created_at,
                            'paymentChannel', ph.payment_method,
                            'transactionId', ph.reference_number
                        ) ORDER BY ph.payment_date DESC
                    ) AS payment_history,
                    COALESCE(SUM(ph.amount), 0) AS total_amount_paid
                FROM payment_history ph
                WHERE ph.student_id = ${id}::integer
                GROUP BY ph.student_id
            )
            SELECT
                sd.*,
                COALESCE(pd.payment_history, '[]'::json) AS payment_history,
                COALESCE(pd.total_amount_paid, 0) AS total_amount_paid
            FROM student_data sd
            LEFT JOIN payment_data pd ON sd.id = pd.studentid
        `;
        
        console.log('Query response:', JSON.stringify(response[0], null, 2));

        if (response.length === 0) {
            console.log('No student found with ID:', id);
            return NextResponse.json(
                { success: false, message: "Student not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            student: response[0]
        });
    } catch (error) {
        console.error('Error fetching student:', error);
        return NextResponse.json(
            { 
                success: false, 
                message: "Internal server error",
                error: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const hostelId = await getAuthenticatedHostelId();
        const { name, email, phone, address, roomNumber, status, accomodationType, monthlyRent } = await request.json();

        // Validate required fields
        if (!name || !email || !phone || !address || !roomNumber || !status || !accomodationType || !monthlyRent) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const result = await sql`
            UPDATE students
            SET
                name = ${name},
                email = ${email},
                phone = ${phone},
                address = ${sql.json(address)},
                room_number = ${roomNumber},
                status = ${status},
                accommodation_type = ${accomodationType},
                monthly_rent = ${monthlyRent},
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${params.id}
              AND hostelid = ${hostelId}
            RETURNING *
        `;

        if (result.length === 0) {
            return NextResponse.json(
                { error: 'Student not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(result[0]);
    } catch (error) {
        console.error('Error updating student:', error);
        return NextResponse.json(
            { error: 'Failed to update student' },
            { status: 500 }
        );
    }
}
