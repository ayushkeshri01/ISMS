import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET() {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ user: null })
  }

  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      role: session.user.role,
      department: session.user.department,
      companyKey: session.user.companyKey,
      companyName: session.user.companyName,
      access: session.user.access,
      tabs: session.user.tabs
    }
  })
}