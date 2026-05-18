import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SETTING_KEYS = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.access !== "write") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const settings = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  })

  const result: Record<string, string> = {}
  for (const s of settings) {
    result[s.key] = s.value
  }

  return NextResponse.json({ settings: result })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.access !== "write") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()

    for (const key of SETTING_KEYS) {
      if (body[key] !== undefined) {
        await prisma.setting.upsert({
          where: { key },
          update: { value: String(body[key]) },
          create: { key, value: String(body[key]) },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
