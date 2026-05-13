import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: NextRequest) {
    try {
        const mealTypes = await sql`
            SELECT 
                id,
                name,
                start_time,
                end_time,
                active
            FROM meal_types
            WHERE active = true
            ORDER BY start_time;
        `;

        return NextResponse.json({
            success: true,
            mealTypes
        });
    } catch (error) {
        console.error('Error fetching meal types:', error);
        return NextResponse.json(
            { success: false, message: 'Error fetching meal types' },
            { status: 500 }
        );
    }
}
