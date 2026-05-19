"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signIn, useSession } from "next-auth/react"
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
import { AlertCircle, Loader2, Mail, Lock, ShieldCheck, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  const [step, setStep] = useState<"credentials" | "otp">("credentials")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [otp, setOtp] = useState(["", "", "", "", "", ""])

  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const otpRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dest = session.user.companyKey
        ? `/dashboard/${session.user.companyKey}`
        : "/dashboard/master"
      router.replace(dest)
    }
  }, [status, session, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        <p className="text-muted-foreground">Checking session…</p>
      </div>
    )
  }

  if (session?.user) return null

  const otpFilled = otp.every((d) => d !== "")
  const maskedEmail = email.replace(/^(.)(.*)(.@)/, (_, a, b, c) => a + "*".repeat(b.length) + c)

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError("Please enter your email and password.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid email or password.")
        return
      }

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

    if (next.every((d) => d !== "") && value && index === 5) {
      handleOtpSubmit(next.join(""))
    }
  }

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus()
    }
  }

  const handleOtpSubmit = async (otpValue: string) => {
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        otp: otpValue,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid or expired OTP. Please try again.")
        setOtp(["", "", "", "", "", ""])
        setTimeout(() => otpRefs[0].current?.focus(), 50)
      } else {
        window.location.href = "/dashboard/master"
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setError("")
    setOtp(["", "", "", "", "", ""])

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Failed to resend OTP.")
        return
      }

      setTimeout(() => otpRefs[0].current?.focus(), 100)
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setResending(false)
    }
  }

  const handleBack = () => {
    setStep("credentials")
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
            {step === "otp" && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <ArrowLeft className="h-3 w-3" />
                Back
              </button>
            )}
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {step === "credentials" ? "Sign In" : "Verify OTP"}
            </CardTitle>
            <CardDescription>
              {step === "credentials"
                ? "Enter your credentials to receive a one-time password."
                : `Enter the 6-digit code sent to ${maskedEmail}`}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "credentials" ? (
              <form onSubmit={handleCredentialsSubmit} className="space-y-4">
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

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-1.5">
                    <Lock className="h-3.5 w-3.5" />
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                <div className="flex items-center justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !email || !password}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP…
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>
              </form>
            ) : (
              <div className="space-y-5">
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
                        aria-label={`Digit ${idx + 1} of OTP`}
                        className="w-11 h-12 rounded-lg border border-input bg-background text-center text-xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    ))}
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={!otpFilled || loading}
                  onClick={() => handleOtpSubmit(otp.join(""))}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify & Sign In"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive the code?{" "}
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="font-medium text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending ? "Resending…" : "Resend OTP"}
                  </button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Vikas Group ISMS Portal &copy; {new Date().getFullYear()} &nbsp;·&nbsp; Secured with OTP
        </p>
      </div>
    </div>
  )
}
