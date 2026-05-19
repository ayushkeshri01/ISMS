import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS, MANAGER_ROLES } from "@/lib/constants"

async function recordMonthlyHistory(companyId: string) {
  try {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()
    
    const controls = await prisma.control.findMany({
      where: { companyId },
      select: { status: true }
    })
    
    const totalControls = controls.length
    const completedCount = controls.filter((c: { status: string }) => c.status === "COMPLETED").length
    const score = totalControls > 0 ? Math.round((completedCount / totalControls) * 100) : 0
    
    return await prisma.complianceHistory.upsert({
      where: {
        companyId_month_year: { companyId, month: currentMonth, year: currentYear }
      },
      update: { score },
      create: {
        companyId,
        month: currentMonth,
        year: currentYear,
        score
      }
    })
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get('companyKey')
  
   if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }
  
  // Users can only access their own company or CIO can access all
  if (session.user.companyKey !== companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  const controls = await prisma.control.findMany({
    where: { company: { key: companyKey } },
    orderBy: { controlId: 'asc' }
  })
  
  return NextResponse.json({ controls })
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const hasWriteAccess = session.user.access === 'write' || (MANAGER_ROLES as readonly string[]).includes(session.user.role)
  
  if (!hasWriteAccess) {
    return NextResponse.json({ error: "Unauthorized - insufficient access" }, { status: 401 })
  }
  
  const body = await request.json()
  const { companyKey, controlId, status } = body
  
  // Validate inputs
   if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }
  
  if (!controlId || typeof controlId !== 'string' || controlId.length > 50) {
    return NextResponse.json({ error: "Invalid control ID" }, { status: 400 })
  }
  
  if (!['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'NA'].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 })
  }
  
  // Users can only update their own company or CIO can update all
  if (session.user.companyKey && session.user.companyKey !== companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  const targetCompanyKey = companyKey
  
  const company = await prisma.company.findUnique({
    where: { key: targetCompanyKey }
  })
  
  if (!company) {
    return NextResponse.json({ error: "Company not found" }, { status: 404 })
  }
  
  const control = await prisma.control.findFirst({
    where: {
      controlId,
      companyId: company.id
    }
  })
  
  if (!control) {
    return NextResponse.json({ error: "Control not found" }, { status: 404 })
  }
  
  if (control.status === status) {
    return NextResponse.json({ success: true, control, message: "No change needed" })
  }
 
  const updated = await prisma.control.update({
    where: { id: control.id },
    data: {
      status,
      lastUpdated: new Date(),
      updatedById: session.user.id
    }
  })
  
  // Non-blocking: log activity and record history
  Promise.all([
    prisma.activityLog.create({
      data: {
        companyKey: targetCompanyKey,
        userId: session.user.id,
        userName: session.user.name || '',
        userRole: session.user.role,
        action: 'STATUS_UPDATE',
        controlId,
        controlLabel: control.label,
        fromStatus: control.status,
        toStatus: status,
        isLocal: false
      }
    }).catch(() => { /* activity log is non-critical */ }),
    recordMonthlyHistory(company.id)
  ])
  
  return NextResponse.json({ success: true, control: updated })
}
