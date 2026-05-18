import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { sendOtpEmail } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true, email: true, password: true, name: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
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
