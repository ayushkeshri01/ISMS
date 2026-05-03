import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const companies = await prisma.company.findMany({
      select: {
        id: true,
        key: true,
        name: true,
        logo: true
      }
    })

    // Filter companies based on user access
    const accessibleCompanies = session.user.role === 'CIO' 
      ? companies 
      : companies.filter(c => c.key === session.user.companyKey)

    return NextResponse.json({ 
      companies: accessibleCompanies.map(c => ({
        id: c.id,
        key: c.key,
        name: c.name,
        logo: c.logo
      })) 
    })
  } catch (error) {
    console.error('Companies fetch error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
