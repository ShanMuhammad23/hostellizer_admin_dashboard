import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuthenticatedHostelId } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');

    if (chatId) {
      const messages = await sql`
        SELECT
          m.id,
          m.content,
          m.created_at,
          m.sender_id,
          m.sender_type,
          CASE
            WHEN m.sender_type = 'hostel' THEN h.name
            ELSE COALESCE(hs.name, sk.full_name, 'Student')
          END AS sender_name
        FROM messages m
        LEFT JOIN hostels h
          ON m.sender_type = 'hostel' AND h.id::text = m.sender_id
        LEFT JOIN students hs
          ON m.sender_type = 'student' AND hs.id::text = m.sender_id
        LEFT JOIN hostel_seekers sk
          ON m.sender_type = 'student' AND sk.id::text = m.sender_id
        WHERE m.chat_id = ${chatId}::uuid
        ORDER BY m.created_at ASC
      `;

      await sql`
        UPDATE application_chats ac
        SET hostel_last_read_at = CURRENT_TIMESTAMP
        FROM applications a
        LEFT JOIN students hs ON hs.id = a.student_id
        WHERE ac.id = ${chatId}::uuid
          AND ac.application_id = a.id
          AND (
            a.hostelid = ${hostelId}::uuid
            OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId}::uuid)
          )
      `;

      return NextResponse.json({ success: true, messages });
    }

    const approvedApps = await sql`
      SELECT
        a.id AS application_id,
        a.status,
        COALESCE(hs.name, sk.full_name) AS student_name,
        ac.id AS chat_id
      FROM applications a
      LEFT JOIN students hs ON hs.id = a.student_id
      LEFT JOIN hostel_seekers sk ON sk.id = a.seeker_id
      LEFT JOIN application_chats ac ON ac.application_id = a.id
      WHERE lower(COALESCE(a.status, '')) = 'approved'
        AND (
          a.hostelid = ${hostelId}::uuid
          OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId}::uuid)
        )
    `;

    for (const app of approvedApps) {
      if (!app.chat_id) {
        await sql`
          INSERT INTO application_chats (application_id, last_message_at)
          VALUES (${app.application_id}, CURRENT_TIMESTAMP)
          ON CONFLICT (application_id) DO NOTHING
        `;
      }
    }

    const chats = await sql`
      SELECT
        ac.id,
        ac.created_at,
        ac.last_message_at,
        a.id AS application_id,
        COALESCE(hs.name, sk.full_name) AS student_name,
        COALESCE(hs.id::text, sk.id::text) AS student_id,
        (
          SELECT content
          FROM messages
          WHERE chat_id = ac.id
          ORDER BY created_at DESC
          LIMIT 1
        ) AS last_message,
        (
          SELECT sender_type
          FROM messages
          WHERE chat_id = ac.id
          ORDER BY created_at DESC
          LIMIT 1
        ) AS last_message_sender_type,
        (
          SELECT COUNT(*)::int
          FROM messages m
          WHERE m.chat_id = ac.id
            AND m.sender_type = 'student'
            AND m.created_at > COALESCE(ac.hostel_last_read_at, ac.created_at)
        ) AS unread_count
      FROM application_chats ac
      INNER JOIN applications a ON a.id = ac.application_id
      LEFT JOIN students hs ON hs.id = a.student_id
      LEFT JOIN hostel_seekers sk ON sk.id = a.seeker_id
      WHERE lower(COALESCE(a.status, '')) = 'approved'
        AND (
          a.hostelid = ${hostelId}::uuid
          OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId}::uuid)
        )
      ORDER BY ac.last_message_at DESC NULLS LAST
    `;

    return NextResponse.json({ success: true, chats });
  } catch (error) {
    console.error('Detailed error in chat API:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch chats',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const hostelId = await getAuthenticatedHostelId();
    const { chatId, content } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      );
    }

    const chatExists = await sql`
      SELECT 1
      FROM application_chats ac
      INNER JOIN applications a ON a.id = ac.application_id
      LEFT JOIN students hs ON hs.id = a.student_id
      WHERE ac.id = ${chatId}::uuid
        AND (
          a.hostelid = ${hostelId}::uuid
          OR (a.hostelid IS NULL AND hs.hostelid = ${hostelId}::uuid)
        )
        AND lower(COALESCE(a.status, '')) = 'approved'
    `;

    if (!chatExists.length) {
      return NextResponse.json(
        { success: false, message: 'Chat not found or application not approved' },
        { status: 404 }
      );
    }

    const hostel = await sql`
      SELECT name
      FROM hostels
      WHERE id = ${hostelId}::uuid
    `;

    if (!hostel.length) {
      return NextResponse.json(
        { success: false, message: 'Hostel not found' },
        { status: 404 }
      );
    }

    const [message] = await sql`
      INSERT INTO messages (chat_id, sender_id, sender_type, content)
      VALUES (${chatId}::uuid, ${hostelId}, 'hostel', ${content})
      RETURNING id, content, created_at, sender_id, sender_type
    `;

    await sql`
      UPDATE application_chats
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = ${chatId}::uuid
    `;

    return NextResponse.json({
      success: true,
      message: {
        ...message,
        sender_name: hostel[0].name,
      },
    });
  } catch (error) {
    console.error('Detailed error in chat POST:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to send message',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
