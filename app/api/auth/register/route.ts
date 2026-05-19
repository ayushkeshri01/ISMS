import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS, VALID_ROLES } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.access !== 'write') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, password, name, role, department, companyKey } = body

    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    if (!email || !password || !name || !role || !department) {
      return NextResponse.json({ error: "Missing required fields (email, password, name, role, department)" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (name.length > 100 || department.length > 100) {
      return NextResponse.json({ error: "Field too long" }, { status: 400 })
    }

    if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    if (companyKey && !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
      return NextResponse.json({ error: "Invalid company" }, { status: 400 })
    }

    const existingEmail = await prisma.user.findUnique({ where: { email: emailNormalized } })
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email: emailNormalized,
        password: hashedPassword,
        name: name.substring(0, 100),
        role,
        department: department.substring(0, 100),
        companyKey: companyKey || null,
        isCustom: true,
        createdById: session.user.id
      }
    })

    return NextResponse.json({ success: true, user: { id: user.id, name: user.name, email: user.email } })
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
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (!user.isCustom) {
      return NextResponse.json({ error: "Cannot delete built-in users" }, { status: 400 })
    }

    // Tenant validation: only CIO can delete users from other companies
    if (session.user.role !== "CIO" && session.user.companyKey !== user.companyKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.user.delete({ where: { id: userId } })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user || session.user.access !== 'write') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, email, name, role, department } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Tenant validation: only CIO can edit users from other companies
    if (session.user.role !== "CIO" && session.user.companyKey !== user.companyKey) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const updateData: Record<string, string | undefined> = {}

    if (email !== undefined) {
      const emailNormalized = email.toLowerCase().trim()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalized)) {
        return NextResponse.json({ error: "Invalid email format" }, { status: 400 })
      }
      const existing = await prisma.user.findFirst({
        where: { email: emailNormalized, id: { not: id } },
      })
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 400 })
      }
      updateData.email = emailNormalized
    }

    if (name !== undefined) {
      if (name.length > 100) return NextResponse.json({ error: "Name too long" }, { status: 400 })
      updateData.name = name
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role as typeof VALID_ROLES[number])) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 })
      }
      updateData.role = role
    }

    if (department !== undefined) {
      if (department.length > 100) return NextResponse.json({ error: "Department too long" }, { status: 400 })
      updateData.department = department
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    await prisma.user.update({ where: { id }, data: updateData })

    return NextResponse.json({ success: true, message: "User updated" })
  } catch (error) {
    console.error('Update user error:', error)
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
        email: true,
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
