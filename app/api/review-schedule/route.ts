import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get("companyKey")

  if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }

  if (session.user.companyKey !== companyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const company = await prisma.company.findUnique({ where: { key: companyKey } })
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  const schedules = await prisma.reviewSchedule.findMany({
    where: { companyId: company.id },
    include: {
      control: { select: { id: true, controlId: true, label: true, category: true } },
    },
    orderBy: { control: { controlId: "asc" } },
  })

  const historyCounts = await prisma.reviewHistory.groupBy({
    by: ["reviewScheduleId"],
    _count: true,
  })
  const historyCountMap = new Map(historyCounts.map(h => [h.reviewScheduleId, h._count]))

  const result = schedules.map(s => ({
    ...s,
    reviewCount: historyCountMap.get(s.id) ?? 0,
  }))

  return NextResponse.json({ schedules: result })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { scheduleId, companyKey, action, frequency } = body

  if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }

  if (session.user.companyKey && session.user.companyKey !== companyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const company = await prisma.company.findUnique({ where: { key: companyKey } })
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  if (action === "update-frequency") {
    if (!["QUARTERLY", "ANNUAL"].includes(frequency)) {
      return NextResponse.json({ error: "Invalid frequency" }, { status: 400 })
    }

    const updated = await prisma.reviewSchedule.update({
      where: { id: scheduleId },
      data: { frequency, updatedById: session.user.id },
    })
    return NextResponse.json({ success: true, schedule: updated })
  }

  if (action === "mark-reviewed") {
    const schedule = await prisma.reviewSchedule.findUnique({
      where: { id: scheduleId },
      include: { control: true },
    })
    if (!schedule) return NextResponse.json({ error: "Schedule not found" }, { status: 404 })

    const now = new Date()
    const days = schedule.frequency === "QUARTERLY" ? 90 : 365
    const nextReview = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)

    const [updated] = await prisma.$transaction([
      prisma.reviewSchedule.update({
        where: { id: scheduleId },
        data: {
          lastReviewedAt: now,
          nextReviewAt: nextReview,
          updatedById: session.user.id,
        },
      }),
      prisma.reviewHistory.create({
        data: {
          reviewScheduleId: scheduleId,
          controlId: schedule.controlId,
          controlLabel: schedule.control.label,
          companyKey,
          reviewedById: session.user.id,
          reviewedByName: session.user.name || "Unknown",
          frequency: schedule.frequency,
        },
      }),
    ])

    return NextResponse.json({ success: true, schedule: updated })
  }

  if (action === "unmark-reviewed") {
    const updated = await prisma.reviewSchedule.update({
      where: { id: scheduleId },
      data: {
        lastReviewedAt: null,
        nextReviewAt: null,
        updatedById: session.user.id,
      },
    })
    return NextResponse.json({ success: true, schedule: updated })
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 })
}
