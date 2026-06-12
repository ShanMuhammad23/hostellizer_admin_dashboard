import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status || !['pending', 'approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Start a transaction
    const result = await sql.begin(async (sql) => {
      // Update application status
      const updatedApp = await sql`
        UPDATE applications
        SET status = ${status}
        WHERE id = ${id}
        RETURNING *;
      `;

      if (updatedApp.length === 0) {
        throw new Error('Application not found');
      }

      // If the application is approved, create a chat
      if (status === 'approved') {
        // Check if a chat already exists for this application
        const existingChat = await sql`
          SELECT id FROM application_chats WHERE application_id = ${id}::integer
        `;

        if (existingChat.length === 0) {
          await sql`
            INSERT INTO application_chats (application_id, last_message_at)
            VALUES (${id}::integer, CURRENT_TIMESTAMP)
            ON CONFLICT (application_id) DO NOTHING
          `;
        }
      }

      return updatedApp[0];
    });

    return NextResponse.json({
      success: true,
      application: result,
    });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update application',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
