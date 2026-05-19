import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendOtpEmail } from "@/lib/email"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const { allowed, resetAt } = rateLimit(ip)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Try again later." },
        { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)) } }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true, email: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ success: true, message: "If the email exists, an OTP has been sent." })
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { otp, otpExpiresAt },
    })

    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER

    if (smtpConfigured) {
      try {
        await sendOtpEmail(emailNormalized, otp)
      } catch {
        return NextResponse.json({ error: "Failed to send OTP. Check SMTP configuration." }, { status: 500 })
      }
      return NextResponse.json({ success: true, message: "OTP sent to your email" })
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      otp: process.env.NODE_ENV === "development" ? otp : undefined,
    })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
