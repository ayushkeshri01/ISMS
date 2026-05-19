"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Server, Lock, Mail, Loader2, Eye, EyeOff, Shield } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function SettingsPage() {
  const { data: session, status } = useSession()

  const [smtpHost, setSmtpHost] = useState("")
  const [smtpPort, setSmtpPort] = useState("587")
  const [smtpSecure, setSmtpSecure] = useState("false")
  const [smtpUser, setSmtpUser] = useState("")
  const [smtpPass, setSmtpPass] = useState("")
  const [smtpFrom, setSmtpFrom] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login")
    }
    if (status === "authenticated" && session?.user?.role !== "CIO") {
      redirect("/dashboard/master")
    }
  }, [status, session])

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings")
        const data = await res.json()
        if (data.settings) {
          setSmtpHost(data.settings.smtp_host || "")
          setSmtpPort(data.settings.smtp_port || "587")
          setSmtpSecure(data.settings.smtp_secure || "false")
          setSmtpUser(data.settings.smtp_user || "")
          setSmtpPass(data.settings.smtp_pass || "")
          setSmtpFrom(data.settings.smtp_from || "")
        }
      } catch {
        setError("Failed to load settings")
      } finally {
        setFetching(false)
      }
    }
    if (status === "authenticated") load()
  }, [status])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_secure: smtpSecure,
          smtp_user: smtpUser,
          smtp_pass: smtpPass,
          smtp_from: smtpFrom,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Failed to save")
        return
      }

      setSuccess("SMTP settings saved successfully")
    } catch {
      setError("Connection error")
    } finally {
      setLoading(false)
    }
  }

  if (status === "loading" || fetching) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (session?.user?.access !== "write") return null

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure SMTP for sending OTP emails</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            These settings are used to send OTP emails for login verification. Stored in the database.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_host" className="flex items-center gap-1.5">
                  <Server className="h-3.5 w-3.5" />
                  SMTP Host
                </Label>
                <Input id="smtp_host" placeholder="smtp.gmail.com" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_port">Port</Label>
                <Input id="smtp_port" placeholder="587" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="smtp_from" className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                From Address
              </Label>
              <Input id="smtp_from" placeholder="noreply@vikasgroup.com" value={smtpFrom} onChange={(e) => setSmtpFrom(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="smtp_user" className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  Username
                </Label>
                <Input id="smtp_user" placeholder="user@gmail.com" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="smtp_pass" className="flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="smtp_pass"
                    type={showPass ? "text" : "password"}
                    placeholder="••••••••"
                    value={smtpPass}
                    onChange={(e) => setSmtpPass(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="smtp_secure"
                checked={smtpSecure === "true"}
                onCheckedChange={(checked) => setSmtpSecure(checked ? "true" : "false")}
              />
              <Label htmlFor="smtp_secure" className="flex items-center gap-1.5 cursor-pointer">
                <Shield className="h-3.5 w-3.5" />
                Use SSL/TLS (port 465)
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Saving…" : "Save Settings"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
