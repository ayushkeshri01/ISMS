import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.access !== 'write') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { pin, name, role, department, companyKey } = body

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!pin || !name || !role || !department) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be 4 digits" }, { status: 400 })
    }

    if (name.length > 100 || department.length > 100) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 })
    }

    const VALID_ROLES = ['IT_MANAGER', 'STQM_MANAGER', 'HR_MANAGER', 'ADMIN_FACILITIES', 'LEGAL', 'IT_EXECUTIVE', 'HR_EXECUTIVE']
    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (companyKey && !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { pin } })
    if (existing) {
      return NextResponse.json({ error: "PIN already in use" }, { status: 400 })
    }

    const user = await prisma.user.create({
      data: {
        pin,
        name: name.substring(0, 100),
        role,
        department: department.substring(0, 100),
        companyKey: companyKey || null,
        isCustom: true,
        createdById: session.user.id
      }
    })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.access !== 'write') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user && !user.isCustom) {
      return NextResponse.json({ error: "Cannot delete built-in users" }, { status: 400 })
    }

    await prisma.user.delete({ where: { id: userId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        department: true,
        companyKey: true,
        isCustom: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json({ users })
  } catch (error) {
    console.error('List users error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
