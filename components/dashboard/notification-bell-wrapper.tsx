"use client"

import { NotificationBell } from "@/components/dashboard/notification-bell"

interface Props {
  _userId: string
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function NotificationBellWrapper({ _userId }: Props) {
  return <NotificationBell />
}