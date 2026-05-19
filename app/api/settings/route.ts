import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt, decrypt, isEncrypted } from "@/lib/crypto"

const SETTING_KEYS = ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"] as const

export async function GET() {
  const session = await auth()
  if (!session?.user || session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const settings = await prisma.setting.findMany({
    where: { key: { in: [...SETTING_KEYS] } },
  })

  const result: Record<string, string> = {}
  for (const s of settings) {
    if (s.key === "smtp_pass" && s.value && isEncrypted(s.value)) {
      result[s.key] = decrypt(s.value)
    } else {
      result[s.key] = s.value
    }
  }

  return NextResponse.json({ settings: result })
}

export async function PUT(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const body = await request.json()

    for (const key of SETTING_KEYS) {
      if (body[key] !== undefined) {
        let value = String(body[key])
        if (key === "smtp_pass" && value) {
          value = encrypt(value)
        }
        await prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      }
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 })
  }
}
