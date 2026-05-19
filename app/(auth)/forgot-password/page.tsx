"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2, Mail, Lock, ArrowLeft, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email")
  const [email, setEmail] = useState("")
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [debugOtp, setDebugOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  const maskedEmail = email.replace(/^(.)(.*)(.@)/, (_, a, b, c) => a + "*".repeat(b.length) + c)
  const otpFilled = otp.every((d) => d !== "")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError("Please enter your email.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to send OTP.")
        return
      }

      setDebugOtp(data.otp || "")
      setStep("otp")
      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const next = [...otp]
    next[index] = value
    setOtp(next)
    setError("")

    if (value && index < 5) {
      otpRefs[index + 1].current?.focus()
    }

  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword || !confirmPassword) {
      setError("Please enter and confirm your new password.")
      return
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.join(""), newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to reset password.")
        return
      }

      setSuccess("Password reset successfully! You can now sign in with your new password.")
      setStep("email")
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = () => {
    if (!otpFilled) return
    setError("")
    setStep("reset")
  }

  const handleBackToEmail = () => {
    setStep("email")
    setError("")
    setOtp(["", "", "", "", "", ""])
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Image
              src="/logos/vikasgrouplogo.png"
              alt="Vikas Group"
              width={180}
              height={56}
              className="h-14 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">VG ISMS Portal</h1>
          <p className="text-sm text-muted-foreground">
            ISO/IEC 27001:2022 Compliance Management
          </p>
        </div>

        <Card>
          <CardHeader className="pb-4">
            {step !== "email" && (
              <button
                onClick={handleBackToEmail}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {step === "email" ? "Forgot Password" : step === "otp" ? "Verify OTP" : "Reset Password"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email to receive a password reset OTP."
                : step === "otp"
                  ? `Enter the 6-digit code sent to ${maskedEmail}`
                  : "Choose a new password for your account."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert variant="default" className="border-green-500/50 text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {step === "email" && !success && (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    autoFocus
                    autoComplete="email"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !email}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            )}

            {step === "otp" && (
              <div className="space-y-5">
                {debugOtp && (
                  <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 px-3 py-2 text-center text-sm">
                    <span className="text-muted-foreground">Dev OTP: </span>
                    <span className="font-mono font-bold text-foreground tracking-widest">{debugOtp}</span>
                  </div>
                )}
                <div className="space-y-3">
                  <Label>Enter 6-Digit OTP</Label>
                  <div className="flex gap-2 justify-center">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        ref={otpRefs[idx]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otp[idx]}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        disabled={loading}
                        autoFocus={idx === 0}
                        className="w-11 h-12 rounded-lg border border-input bg-background text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!otpFilled || loading}
                  onClick={handleVerifyOtp}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    <>
                      Verify OTP
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            )}

            {step === "reset" && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    New Password
                  </Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={loading}
                    autoFocus
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading || !newPassword || !confirmPassword}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            {success && (
              <Link href="/login">
                <Button className="w-full">
                  Back to Sign In
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Back to Sign In
          </Link>
          &nbsp;·&nbsp; Vikas Group ISMS Portal &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
