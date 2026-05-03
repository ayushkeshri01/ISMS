import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const unreadOnly = searchParams.get('unreadOnly') === 'true'

  // Users can only see their own notifications
  const notifications = await prisma.notification.findMany({
    where: {
      userId: session.user.id,
      ...(unreadOnly ? { read: false } : {})
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  return NextResponse.json({ notifications })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { notificationId } = body

  // Validate input
  if (!notificationId || typeof notificationId !== 'string' || notificationId.length > 50) {
    return NextResponse.json({ error: "Invalid notification ID" }, { status: 400 })
  }

  // Only mark as read if the notification belongs to the user
  const result = await prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId: session.user.id  // Critical: ensure user owns this notification
    },
    data: { read: true }
  })

  return NextResponse.json({ success: true, updated: result.count })
}
