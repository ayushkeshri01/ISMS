import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"
import { decrypt, isEncrypted } from "@/lib/crypto"

async function getSmtpConfig() {
  const settings = await prisma.setting.findMany({
    where: { key: { in: ["smtp_host", "smtp_port", "smtp_secure", "smtp_user", "smtp_pass", "smtp_from"] } },
  })

  const map: Record<string, string> = {}
  for (const s of settings) map[s.key] = s.value

  const storedPass = map.smtp_pass || process.env.SMTP_PASS || ""
  const pass = storedPass && isEncrypted(storedPass) ? decrypt(storedPass) : storedPass

  return {
    host: map.smtp_host || process.env.SMTP_HOST || "",
    port: parseInt(map.smtp_port || process.env.SMTP_PORT || "587", 10),
    secure: (map.smtp_secure || process.env.SMTP_SECURE || "false") === "true",
    user: map.smtp_user || process.env.SMTP_USER || "",
    pass,
    from: map.smtp_from || process.env.SMTP_FROM || "noreply@vikasgroup.in",
  }
}

export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const config = await getSmtpConfig()

  if (!config.host || !config.user) {
    throw new Error("SMTP not configured")
  }

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })

  await transporter.sendMail({
    from: config.from,
    to,
    subject: "VG ISMS Portal — OTP for Login",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="font-size: 20px; color: #111827; margin: 0;">VG ISMS Portal</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0;">One-Time Password</p>
        </div>
        <p style="font-size: 14px; color: #374151;">Use the following OTP to complete your login. This code is valid for <strong>10 minutes</strong>.</p>
        <div style="text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827; background: #f3f4f6; padding: 12px 24px; border-radius: 8px; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">If you did not request this code, please ignore this email.</p>
      </div>
    `,
  })
}
