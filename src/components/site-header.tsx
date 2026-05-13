'use client'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useState, useEffect, useRef } from "react"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { NotificationsPopup } from "./notifications-popup"

interface Notification {
  id: string
  title: string
  date: string
  read: boolean
}

export function SiteHeader() {
  const [hostelName, setHostelName] = useState<string>("")
  const [hostelType, setHostelType] = useState<string>("")
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      console.log('Fetching notifications...')
      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log('Notifications response:', data)
      
      if (data.success) {
        setNotifications(data.notifications)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    }
  }

  useEffect(() => {
    const fetchHostelName = async () => {
      try {
        const response = await fetch('/api/fetchOverviewData')
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const data = await response.json()
        
        if (data.success && data.overviewData && data.overviewData.length > 0) {
          setHostelName(data.overviewData[0].hostel_name)
          setHostelType(data.overviewData[0].hostel_type)
        }
      } catch (error) {
        console.error('Error fetching hostel name:', error)
      }
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    fetchHostelName()
    fetchNotifications()

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30 seconds

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearInterval(interval)
    }
  }, [])

  const handleNotificationRead = (notificationId: string) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    )
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-white transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">
            {hostelName || 'Loading...'}
          </h1>
          <Badge variant="secondary">
            {hostelType || "Loading"}
          </Badge>
        </div>
      </div>
      
      <div className="ml-auto flex items-center gap-2 px-4">
        <div className="relative" ref={dropdownRef}>
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell className={`h-4 w-4 ${unreadCount > 0 ? 'animate-pulse' : ''}`} />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
          
          {isOpen && (
            <div 
              className="absolute right-0 mt-2 w-80 bg-background rounded-md shadow-lg border"
              style={{ 
                top: '100%',
                zIndex: 1000
              }}
            >
              <div className="px-4 py-2 border-b">
                <h3 className="text-sm font-semibold">Notifications</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <NotificationsPopup 
                  notifications={notifications} 
                  onNotificationRead={handleNotificationRead}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
