"use client"

import { NotificationBell } from "@/components/dashboard/notification-bell"

interface Props {
  userId: string
}

export function NotificationBellWrapper({ userId }: Props) {
  return <NotificationBell />
}