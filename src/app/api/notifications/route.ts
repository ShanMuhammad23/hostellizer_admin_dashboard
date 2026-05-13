import { NextResponse } from 'next/server'
import { sql } from '@/lib/db'
import { getAuthenticatedHostelId } from '@/lib/auth'

export async function GET() {
  try {
    const hostel_id = await getAuthenticatedHostelId()

    if (!hostel_id) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      )
    }

    const result = await sql`
      SELECT notification 
      FROM hostels 
      WHERE id = ${hostel_id}::uuid;
    `;
    console.log('Database result:', result);

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Hostel not found' },
        { status: 404 }
      )
    }

    // Parse the notifications JSON string if it's a string
    let notifications = result[0].notification;
    if (typeof notifications === 'string') {
      try {
        notifications = JSON.parse(notifications);
      } catch (e) {
        console.error('Error parsing notifications JSON:', e);
        notifications = [];
      }
    }
    
    // Ensure notifications is an array
    if (!Array.isArray(notifications)) {
      notifications = [];
    }

    console.log('Parsed notifications:', notifications);
    
    const formattedNotifications = notifications.map((notification: any) => ({
      id: notification.id || Math.random().toString(36).substr(2, 9),
      title: notification.title || 'Notification',
      date: notification.date || new Date().toISOString(),
      read: notification.read || false
    }));
    console.log('Formatted notifications:', formattedNotifications);
    
    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const { title } = await request.json();
    const hostel_id = await getAuthenticatedHostelId();
    
    if (!hostel_id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    // First, get existing notifications
    const existingResult = await sql`
      SELECT notification 
      FROM hostels 
      WHERE id = ${hostel_id}::uuid;
    `;

    // Parse existing notifications or initialize empty array
    const existingNotifications = existingResult[0]?.notification || [];
    
    // Create new notification object
    const newNotification = {
      id: Math.random().toString(36).substr(2, 9),
      title: title,
      date: new Date().toISOString(),
      read: false
    };

    // Combine existing and new notifications
    const updatedNotifications = [...existingNotifications, newNotification];

    // Update the database with the combined notifications
    await sql`
      UPDATE hostels 
      SET notification = ${updatedNotifications}::jsonb 
      WHERE id = ${hostel_id}::uuid;
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Notification added successfully',
      notification: newNotification
    });
  } catch (error) {
    console.error('Error adding notification:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to add notification',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { notificationId } = await request.json();
    const hostel_id = await getAuthenticatedHostelId();
    
    if (!hostel_id) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }

    // Get existing notifications
    const existingResult = await sql`
      SELECT notification 
      FROM hostels 
      WHERE id = ${hostel_id}::uuid;
    `;

    const notifications = existingResult[0]?.notification || [];
    
    // Mark the specified notification as read
    const updatedNotifications = notifications.map((notification: any) => {
      if (notification.id === notificationId) {
        return { ...notification, read: true };
      }
      return notification;
    });

    // Update the database
    await sql`
      UPDATE hostels 
      SET notification = ${updatedNotifications}::jsonb 
      WHERE id = ${hostel_id}::uuid;
    `;

    return NextResponse.json({ 
      success: true, 
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to mark notification as read',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
