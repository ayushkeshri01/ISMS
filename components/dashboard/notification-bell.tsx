"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell, Check } from "lucide-react"

interface Notification {
  id: string;
  type: "evidence_approved" | "evidence_rejected";
  message: string;
  read: boolean;
  createdAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Props {}

export function NotificationBell({ }: Props) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=false')
      const data = await res.json()
      if (data.notifications) {
        setNotifications(data.notifications)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  const checkUnreadCount = async () => {
    try {
      const res = await fetch('/api/notifications?unreadOnly=true')
      const data = await res.json()
      if (data.notifications) {
        setUnreadCount(data.notifications.length)
      }
    } catch (err) {
      console.error('Failed to check notifications:', err)
    }
  }
  
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => fetchNotifications(), 0)
      return () => clearTimeout(timer)
    }
  }, [open])
  
  // Poll for unread count every 30 seconds
  useEffect(() => {
    const timer = setTimeout(() => checkUnreadCount(), 0)
    const interval = setInterval(checkUnreadCount, 30000)
    return () => {
      clearTimeout(timer)
      clearInterval(interval)
    }
  }, [])
  
  // Refresh list when opening if there are new notifications
  useEffect(() => {
    if (open && unreadCount > 0) {
      const timer = setTimeout(() => fetchNotifications(), 0)
      return () => clearTimeout(timer)
    }
  }, [open, unreadCount])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open])
  
  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id })
      })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }
  
  return (
    <div className="relative" ref={containerRef}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Button>
      
      {open && (
        <Card className="absolute right-0 mt-2 w-80 z-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No notifications</p>
            ) : (
              <div className="space-y-2">
                {notifications.map(n => (
                  <div key={n.id} className={`flex items-start gap-2 p-2 rounded ${n.read ? 'bg-background' : 'bg-muted/50'}`}>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{n.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!n.read && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(n.id)}>
                        <Check className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
