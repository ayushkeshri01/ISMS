import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

// GET - Fetch certificates
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get('companyKey')

  // Resolve companyKey: default to user's own company if not provided
  const resolvedCompanyKey = companyKey || session.user.companyKey

  if (!resolvedCompanyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate companyKey if provided
  if (resolvedCompanyKey && !COMPANY_KEYS.includes(resolvedCompanyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company" }, { status: 400 })
  }

  // Users can only access their own company or CIO can access all
  if (resolvedCompanyKey && session.user.companyKey !== resolvedCompanyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const certificates = await prisma.certificate.findMany({
    where: resolvedCompanyKey ? { company: { key: resolvedCompanyKey } } : {},
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json({ certificates })
}

// POST - Add certificate
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.access !== 'write') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const { companyKey, body: certBody, number, validFrom, validTo, scope, isActive } = body

  // Validate required fields
   if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }

  if (!certBody || typeof certBody !== 'string' || certBody.length > 100) {
    return NextResponse.json({ error: "Invalid certifying body" }, { status: 400 })
  }

  if (!number || typeof number !== 'string' || number.length > 100) {
    return NextResponse.json({ error: "Invalid certificate number" }, { status: 400 })
  }

  if (!validFrom || !validTo) {
    return NextResponse.json({ error: "Valid from/to required" }, { status: 400 })
  }

  if (!scope || typeof scope !== 'string' || scope.length > 500) {
    return NextResponse.json({ error: "Invalid scope" }, { status: 400 })
  }

  if (typeof isActive !== 'boolean') {
    return NextResponse.json({ error: "Invalid isActive" }, { status: 400 })
  }

  // Users can only add to their own company or CIO
  if (session.user.companyKey !== companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // If setting as active, deactivate others
  if (isActive) {
    await prisma.certificate.updateMany({
      where: { company: { key: companyKey } },
      data: { isActive: false }
    })
  }

  const certificate = await prisma.certificate.create({
    data: {
      company: { connect: { key: companyKey } },
      body: certBody.substring(0, 100),
      number: number.substring(0, 100),
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      scope: scope.substring(0, 500),
      isActive: isActive || false
    }
  })

  return NextResponse.json({ success: true, certificate })
}
