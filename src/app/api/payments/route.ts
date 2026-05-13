import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { studentId, amount, date, paymentChannel, transactionId } = await req.json();

        if (!studentId || !amount || !date) {
            return NextResponse.json({ success: false, message: 'Required fields are missing.' }, { status: 400 });
        }

        /* payment_history.student_id is integer → matches students.id (payment_histories.studentid was uuid) */
        const result = await sql`
            INSERT INTO payment_history (
                student_id,
                amount,
                payment_date,
                payment_method,
                reference_number
            )
            VALUES (
                ${studentId}::integer,
                ${amount},
                ${date},
                ${paymentChannel || null},
                ${transactionId || null}
            )
            RETURNING *
        `;

        return NextResponse.json({ success: true, payment: result[0] });
    } catch (error) {
        console.error('Error adding payment:', error);
        return NextResponse.json({ success: false, message: 'Failed to add payment.' }, { status: 500 });
    }
}
