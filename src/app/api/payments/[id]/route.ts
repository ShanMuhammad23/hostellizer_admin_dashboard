import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        console.log('Fetching payment with ID:', params.id);
        
        const paymentResult = await sql`
            SELECT
                p.id,
                p.amount,
                p.payment_date AS date,
                p.created_at AS createdat,
                p.payment_method AS payment_channel,
                p.reference_number AS transaction_id,
                s.name AS student_name,
                s.room_number AS student_room_number
            FROM payment_history p
            INNER JOIN students s ON p.student_id = s.id
            WHERE p.id = ${params.id}::integer
        `;

        console.log('Query result:', paymentResult);

        if (paymentResult.length === 0) {
            console.log('No payment found with ID:', params.id);
            return NextResponse.json({
                success: false,
                message: 'Payment not found'
            }, { status: 404 });
        }

        const payment = paymentResult[0];
        console.log('Found payment:', payment);

        // Format the response
        const formattedPayment = {
            id: payment.id,
            amount: payment.amount,
            date: payment.date,
            createdAt: payment.createdat,
            paymentChannel: payment.payment_channel,
            transactionId: payment.transaction_id,
            student: {
                name: payment.student_name,
                roomNumber: payment.student_room_number
            }
        };

        console.log('Formatted payment:', formattedPayment);

        return NextResponse.json({
            success: true,
            payment: formattedPayment
        });
    } catch (error) {
        console.error('Detailed error in payment details:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        
        return NextResponse.json({
            success: false,
            message: 'Failed to fetch payment details',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
