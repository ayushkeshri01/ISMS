"use client"

import { useState, useRef, useEffect } from "react"
import { signIn, useSession } from "next-auth/react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { AlertCircle, Building2, ShieldCheck } from "lucide-react"
import Image from "next/image"

// ─── Company catalogue ────────────────────────────────────────────────────────
const COMPANIES = [
  { key: "ecocat",  label: "ECOCAT India Pvt. Ltd.",     logo: "/logos/ecologo.jpg"     },
  { key: "pranav",  label: "Pranav Vikas India Ltd.",     logo: "/logos/pranavlogo.png"  },
  { key: "sanden",  label: "Sanden Vikas India Ltd.",     logo: "/logos/sandenlogo.jpg"  },
  { key: "sata",    label: "SATA Vikas India Ltd.",       logo: "/logos/satalogo.webp"   },
  { key: "group",   label: "Vikas Group (CIO / MD)",      logo: "/logos/vikasgrouplogo.png" },
]

// ─── Roles per company type ───────────────────────────────────────────────────
const SUBSIDIARY_ROLES = [
  { value: "IT_MANAGER",       label: "IT Manager"        },
  { value: "STQM_MANAGER",     label: "STQM Manager"      },
  { value: "IT_EXECUTIVE",     label: "IT Executive"      },
  { value: "HR_EXECUTIVE",     label: "HR Executive"      },
  { value: "ADMIN_FACILITIES", label: "Admin / Facilities" },
  { value: "LEGAL",            label: "Legal / Compliance" },
]

const GROUP_ROLES = [
  { value: "CIO",      label: "CIO / Group IT Head" },
  { value: "MD_CEO",   label: "MD / CEO"            },
  { value: "HR_MANAGER", label: "HR Manager"        },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function LoginPage() {
  const { data: session, status } = useSession()

  // All hooks declared before any early return (Rules of Hooks)
  const [selectedCompany, setSelectedCompany] = useState("")
  const [selectedRole,    setSelectedRole]    = useState("")
  const [pin,             setPin]             = useState(["", "", "", ""])
  const [error,           setError]           = useState("")
  const [loading,         setLoading]         = useState(false)

  const pinRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ]

  // Already logged in → hard redirect so the server-side auth() sees the cookie
  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/auth/redirect")
    }
  }, [status])

  // Show a spinner while the session is being resolved
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Checking session…</p>
      </div>
    )
  }

  // Already authenticated — render nothing while the redirect above fires
  if (session) return null

  const isGroup   = selectedCompany === "group"
  const roleList  = isGroup ? GROUP_ROLES : SUBSIDIARY_ROLES
  const pinReady  = selectedCompany !== "" && selectedRole !== ""
  const pinFilled = pin.every((d) => d !== "")

  // Reset role when company changes
  const handleCompanyChange = (value: string) => {
    setSelectedCompany(value)
    setSelectedRole("")
    setPin(["", "", "", ""])
    setError("")
  }

  const handleRoleChange = (value: string) => {
    setSelectedRole(value)
    setPin(["", "", "", ""])
    setError("")
    // Focus first PIN box
    setTimeout(() => pinRefs[0].current?.focus(), 100)
  }

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const next = [...pin]
    next[index] = value
    setPin(next)
    setError("")

    if (value && index < 3) {
      pinRefs[index + 1].current?.focus()
    }

    // Auto-submit when 4th digit entered
    if (next.every((d) => d !== "") && value && index === 3) {
      handleSubmit(next.join(""))
    }
  }

  const handlePinKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      pinRefs[index - 1].current?.focus()
    }
  }

  const handleSubmit = async (pinValue: string) => {
    if (!selectedCompany || !selectedRole) {
      setError("Please select a company and role first.")
      return
    }
    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        pin:        pinValue,
        companyKey: selectedCompany,
        role:       selectedRole,
        redirect:   false,
      })

      if (result?.error) {
        setError("Invalid PIN for the selected company and role. Please try again.")
        setPin(["", "", "", ""])
        setTimeout(() => pinRefs[0].current?.focus(), 50)
      } else {
        // Hard navigation: forces a fresh request so the server-side auth()
        // in /auth/redirect receives the session cookie NextAuth just set.
        // Using router.push here causes a race condition where the SSR render
        // fires before the cookie is readable, creating an infinite redirect loop.
        window.location.href = "/auth/redirect"
      }
    } catch {
      setError("Connection error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const selectedCompanyInfo = COMPANIES.find((c) => c.key === selectedCompany)

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand header */}
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
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Sign In
            </CardTitle>
            <CardDescription>
              Select your company and role, then enter your 4-digit PIN.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Step 1 — Company */}
            <div className="space-y-2">
              <Label htmlFor="company-select" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5" />
                Company
              </Label>
              <select
                id="company-select"
                value={selectedCompany}
                onChange={(e) => handleCompanyChange(e.target.value)}
                disabled={loading}
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>Select company…</option>
                {COMPANIES.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>

            {/* Step 2 — Role (shown after company selected) */}
            {selectedCompany && (
              <div className="space-y-2">
                <Label htmlFor="role-select">Role</Label>
                <select
                  id="role-select"
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  disabled={loading}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="" disabled>Select role…</option>
                  {roleList.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Divider + Step 3 — PIN (shown after both selected) */}
            {pinReady && (
              <>
                <Separator />

                {/* Identity chip */}
                {selectedCompanyInfo && (
                  <div className="flex items-center gap-3 rounded-lg border bg-muted/40 px-3 py-2">
                    <Image
                      src={selectedCompanyInfo.logo}
                      alt={selectedCompanyInfo.label}
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded object-contain"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{selectedCompanyInfo.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {roleList.find((r) => r.value === selectedRole)?.label}
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Label>Enter 4-Digit PIN</Label>
                  <div className="flex gap-3 justify-center">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={pinRefs[idx]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={pin[idx]}
                        onChange={(e) => handlePinChange(idx, e.target.value)}
                        onKeyDown={(e) => handlePinKeyDown(idx, e)}
                        disabled={loading}
                        autoFocus={idx === 0}
                        className="w-14 h-14 rounded-lg border border-input bg-background text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      />
                    ))}
                  </div>

                  <Button
                    className="w-full"
                    disabled={!pinFilled || loading}
                    onClick={() => handleSubmit(pin.join(""))}
                  >
                    {loading ? "Signing in…" : "Sign In"}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Vikas Group ISMS Portal &copy; {new Date().getFullYear()} &nbsp;·&nbsp; PIN-protected access
        </p>
      </div>
    </div>
  )
}
