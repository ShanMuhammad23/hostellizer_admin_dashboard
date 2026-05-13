import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

import { getAuthenticatedHostelId } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for real-time subscriptions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    console.log('Authenticated hostel ID:', hostelId);
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      // Fetch messages for a specific chat
      console.log('Fetching messages for chat:', chatId);
      const messages = await sql`
        SELECT 
          m.id,
          m.content,
          m.created_at,
          m.sender_id,
          m.sender_type,
          CASE 
            WHEN m.sender_type = 'hostel' THEN h.name
            WHEN m.sender_type = 'student' THEN hs.name
          END as sender_name
        FROM messages m
        LEFT JOIN hostels h ON h.id = m.sender_id AND m.sender_type = 'hostel'
        LEFT JOIN students hs ON hs.id = m.sender_id AND m.sender_type = 'student'
        WHERE m.chat_id = ${chatId}
        ORDER BY m.created_at ASC
      `;
      console.log('Messages fetched:', messages);

      return NextResponse.json({ success: true, messages });
    } else {
      // Debug: Check for approved applications
      const approvedApps = await sql`
        SELECT 
          a.id as application_id,
          a.status,
          hs.name as student_name,
          c.id as chat_id
        FROM applications a
        JOIN students hs ON hs.id = a.studentid
        LEFT JOIN chats c ON c.application_id = a.id
        WHERE a.hostelid = ${hostelId}
        AND a.status = 'approved'
      `;
      console.log('Approved applications:', approvedApps);

      // Create chats for approved applications that don't have one
      for (const app of approvedApps) {
        if (!app.chat_id) {
          console.log('Creating chat for application:', app.application_id);
          await sql`
            INSERT INTO chats (application_id, last_message_at)
            VALUES (${app.application_id}, CURRENT_TIMESTAMP)
            ON CONFLICT (application_id) DO NOTHING
          `;
        }
      }

      // Fetch all chats for the hostel where application is approved
      console.log('Fetching all chats for hostel:', hostelId);
      const chats = await sql`
        SELECT 
          c.id,
          c.created_at,
          c.last_message_at,
          a.id as application_id,
          hs.name as student_name,
          hs.id as student_id,
          (
            SELECT content 
            FROM messages 
            WHERE chat_id = c.id 
            ORDER BY created_at DESC 
            LIMIT 1
          ) as last_message
        FROM chats c
        JOIN applications a ON a.id = c.application_id
        JOIN students hs ON hs.id = a.studentid
        WHERE a.hostelid = ${hostelId}
        AND a.status = 'approved'
        ORDER BY c.last_message_at DESC NULLS LAST
      `;
      console.log('Chats fetched:', chats);

      return NextResponse.json({ success: true, chats });
    }
  } catch (error) {
    console.error('Detailed error in chat API:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch chats',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    console.log('Authenticated hostel ID for POST:', hostelId);
    
    const { chatId, content } = await request.json();
    console.log('Received chat request:', { chatId, content });

    if (!chatId || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify the chat belongs to this hostel and application is approved
    const chatExists = await sql`
      SELECT 1
      FROM chats c
      JOIN applications a ON a.id = c.application_id
      WHERE c.id = ${chatId}
      AND a.hostelid = ${hostelId}
      AND a.status = 'approved'
    `;
    console.log('Chat verification result:', chatExists);

    if (!chatExists.length) {
      return NextResponse.json(
        { success: false, message: 'Chat not found or application not approved' },
        { status: 404 }
      );
    }

    // Get the hostel's name
    const hostel = await sql`
      SELECT name
      FROM hostels
      WHERE id = ${hostelId}
    `;
    console.log('Hostel info:', hostel);

    if (!hostel.length) {
      return NextResponse.json(
        { success: false, message: 'Hostel not found' },
        { status: 404 }
      );
    }

    // Insert the message with sender_type
    const [message] = await sql`
      INSERT INTO messages (chat_id, sender_id, sender_type, content)
      VALUES (${chatId}, ${hostelId}, 'hostel', ${content})
      RETURNING id, content, created_at, sender_id, sender_type
    `;
    console.log('Message inserted:', message);

    // Update the last_message_at timestamp in the chats table
    await sql`
      UPDATE chats 
      SET last_message_at = CURRENT_TIMESTAMP 
      WHERE id = ${chatId}
    `;

    // Return the message with sender_name for immediate UI update
    const messageWithSenderName = {
      ...message,
      sender_name: hostel[0].name
    };

    return NextResponse.json({ success: true, message: messageWithSenderName });
  } catch (error) {
    console.error('Detailed error in chat POST:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
