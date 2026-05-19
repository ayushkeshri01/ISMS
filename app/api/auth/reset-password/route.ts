import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { email, otp, newPassword } = await request.json()

    if (!email || !otp || !newPassword) {
      return NextResponse.json({ error: "Email, OTP, and new password are required" }, { status: 400 })
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 })
    }

    const emailNormalized = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true, otp: true, otpExpiresAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 })
    }

    if (!user.otp || !user.otpExpiresAt) {
      return NextResponse.json({ error: "No OTP requested. Please request a new one." }, { status: 400 })
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 })
    }

    if (new Date() > user.otpExpiresAt) {
      return NextResponse.json({ error: "OTP has expired. Please request a new one." }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otp: null,
        otpExpiresAt: null,
      },
    })

    return NextResponse.json({ success: true, message: "Password reset successfully" })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
