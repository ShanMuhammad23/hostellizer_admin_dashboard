/**
 * Adds a new notification to the hostel's notification list
 * @param title The notification message/title
 * @returns Promise<{success: boolean, message: string, notification?: any}>
 */
export async function addNotification(title: string) {
  try {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to add notification');
    }

    return data;
  } catch (error) {
    console.error('Error adding notification:', error);
    throw error;
  }
}

