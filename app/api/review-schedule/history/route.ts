import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get("companyKey")
  const scheduleId = searchParams.get("scheduleId")

  if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }

  if (session.user.companyKey !== companyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const where: Record<string, unknown> = { companyKey }
  if (scheduleId) where.reviewScheduleId = scheduleId

  const history = await prisma.reviewHistory.findMany({
    where,
    orderBy: { reviewedAt: "desc" },
    take: 200,
  })

  return NextResponse.json({ history })
}
