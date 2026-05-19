import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const { searchParams } = new URL(request.url)
    const companyKey = searchParams.get('companyKey')
    const type = searchParams.get('type') || 'scores'
    
    // Validate type
    if (!['scores', 'history'].includes(type)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
    }

    // Resolve companyKey: default to user's own company if not provided
    const resolvedCompanyKey = companyKey || session.user.companyKey

    if (!resolvedCompanyKey && session.user.role !== 'CIO') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    // Validate companyKey if provided
    if (resolvedCompanyKey && !COMPANY_KEYS.includes(resolvedCompanyKey as (typeof COMPANY_KEYS)[number])) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 })
    }
    
    // Check authorization
    if (resolvedCompanyKey && session.user.companyKey !== resolvedCompanyKey && session.user.role !== 'CIO') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (type === 'scores') {
      const companies = await prisma.company.findMany({
        where: resolvedCompanyKey ? { key: resolvedCompanyKey } : {},
        select: {
          id: true,
          key: true,
          name: true,
          controls: { select: { status: true } }
        }
      })
      
      const report = companies.map(company => {
        const controls = company.controls || []
        const applicable = controls.filter(c => c.status !== 'NA')
        const score = applicable.length > 0
          ? Math.round((controls.filter(c => c.status === 'COMPLETED').length / applicable.length) * 100)
          : 0
        
        const statuses = controls.reduce((acc: Record<string, number>, c) => {
          acc[c.status] = (acc[c.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        return {
          key: company.key,
          name: company.name,
          score,
          ...statuses
        }
      })
      
      return NextResponse.json({ report })
    }
    
    if (type === 'history') {
      const companies = await prisma.company.findMany({
        where: resolvedCompanyKey ? { key: resolvedCompanyKey } : {},
        include: {
          complianceHistory: {
            orderBy: [{ year: 'desc' }, { month: 'desc' }],
            take: 12
          }
        }
      })
      
      return NextResponse.json({ 
        companies: companies.map(c => ({
          key: c.key,
          name: c.name,
          history: c.complianceHistory
        }))
      })
    }
    
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 })
  } catch (error) {
    console.error("Reports error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
