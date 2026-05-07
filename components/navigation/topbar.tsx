"use client"

import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBell } from "@/components/dashboard/notification-bell"
import { Menu } from "lucide-react"

const TAB_LABELS: Record<string, string> = {
  overview:      "Overview",
  "my-controls": "Controls",
  docs:          "Documents",
  review:        "Review",
  certificates:  "Certificates",
  users:         "Users",
  trend:         "Trend",
  log:           "Activity Log",
  exec:          "Executive Summary",
}

interface TopbarProps {
  companyName:        string | null
  userId:             string
  userName:           string
  userRole:           string
  userAccess:         string
  userTabs:           string[]
  onMobileMenuToggle: () => void
}

export function Topbar({
  userTabs,
  onMobileMenuToggle,
}: TopbarProps) {
  const searchParams = useSearchParams()
  const tabParam     = searchParams.get("tab")
  // Resolve active tab: URL param if valid, otherwise first tab
  const activeTab    = tabParam && TAB_LABELS[tabParam] ? tabParam : (userTabs[0] ?? "")
  const sectionLabel = TAB_LABELS[activeTab] ?? ""

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b bg-background/95 px-3 backdrop-blur sm:px-4">

      {/* Hamburger — mobile only */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0 md:hidden"
        onClick={onMobileMenuToggle}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Current section label */}
      {sectionLabel && (
        <span className="text-sm font-semibold tracking-tight">
          {sectionLabel}
        </span>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right-side controls */}
      <div className="flex shrink-0 items-center gap-1">
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  )
}
