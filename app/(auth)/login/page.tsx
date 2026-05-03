"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Image from "next/image"

export default function LoginPage() {
  const router = useRouter()
  const [pin, setPin] = useState(["", "", "", ""])
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return

    const newPin = [...pin]
    newPin[index] = value
    setPin(newPin)
    setError("")

    if (value && index < 3) {
      const nextInput = document.getElementById(`pin-${index + 1}`)
      nextInput?.focus()
    }

    if (newPin.every(p => p !== "") && newPin.join("").length === 4) {
      handleSubmit(newPin.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      const prevInput = document.getElementById(`pin-${index - 1}`)
      prevInput?.focus()
    }
  }

  const handleSubmit = async (pinValue: string) => {
    setLoading(true)
    setError("")
    
    try {
      // Use NextAuth's built-in redirect
      const result = await signIn("credentials", {
        pin: pinValue,
        redirect: true,
        callbackUrl: "/auth/redirect"
      })
    } catch {
      // This won't execute if redirect: true (NextAuth throws a redirect error)
      setError("Connection error. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <Image src="/logos/vikasgrouplogo.png" alt="Vikas Group" width={200} height={64} className="h-16 w-auto" />
            </div>
          <CardTitle className="text-2xl font-bold">ISMS Portal</CardTitle>
          <CardDescription>Enter your 4-digit PIN to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="pin-0">PIN</Label>
            <div className="flex gap-2 justify-center">
              {[0, 1, 2, 3].map((index) => (
                <Input
                  key={index}
                  id={`pin-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index]}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-2xl font-mono"
                  disabled={loading}
                  autoFocus={index === 0}
                />
              ))}
            </div>
          </div>

          {loading && (
            <p className="text-center text-sm text-muted-foreground">Authenticating...</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
