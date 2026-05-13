import { ScrollArea } from "@/components/ui/scroll-area"
import { format } from "date-fns"
import axios from "axios"

interface Notification {
  id: string
  title: string
  date: string
  read: boolean
}

interface NotificationsPopupProps {
  notifications: Notification[]
  onNotificationRead?: (notificationId: string) => void
}

export function NotificationsPopup({ notifications, onNotificationRead }: NotificationsPopupProps) {
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      try {
        const response = await axios.put('/api/notifications', {
          notificationId: notification.id
        });
        
        if (response.data.success && onNotificationRead) {
          onNotificationRead(notification.id);
        }
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
  };

  return (
    <div className="w-full bg-white">
      {notifications.length === 0 ? (
        <div className="p-4 text-center">
          <p className="text-sm text-gray-500">No notifications</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {notifications.map((notification) => (
            <div 
              key={notification.id} 
              className={`px-4 py-3 hover:bg-gray-50 transition-colors duration-200 cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <p className={`text-sm font-medium ${!notification.read ? 'text-blue-900' : 'text-gray-900'}`}>
                {notification.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {format(new Date(notification.date), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 