"use client"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { Menu } from "lucide-react"

interface TopbarProps {
  companyName:        string | null
  userId:             string
  userName:           string
  userRole:           string
  userAccess:         string
  onMobileMenuToggle: () => void
}

export function Topbar({
  onMobileMenuToggle,
}: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur sm:px-4">

      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Spacer pushes actions to the right */}
      <div className="flex-1" />

      {/* Right-side controls */}
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
