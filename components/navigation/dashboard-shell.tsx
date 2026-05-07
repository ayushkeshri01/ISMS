"use client"

import { useState, Suspense } from "react"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/navigation/sidebar"
import { Topbar } from "@/components/navigation/topbar"

interface DashboardShellProps {
  children:    React.ReactNode
  userRole:    string
  userTabs:    string[]
  companyKey:  string | null
  companyName: string | null
  userId:      string
  userName:    string
  userAccess:  string
}

export function DashboardShell({
  children,
  userRole,
  userTabs,
  companyKey,
  companyName,
  userId,
  userName,
  userAccess,
}: DashboardShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">

      {/* ── Mobile overlay backdrop ─────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      {/* On mobile: fixed overlay, slides from left.
          On desktop (md+): normal in-flow sidebar. */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <Suspense fallback={<div className="h-full w-60 border-r bg-card" />}>
          <Sidebar
            userRole={userRole}
            userTabs={userTabs}
            companyKey={companyKey}
            companyName={companyName}
            userName={userName}
            onClose={() => setMobileOpen(false)}
          />
        </Suspense>
      </div>

      {/* ── Main column ────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Topbar
          companyName={companyName}
          userId={userId}
          userName={userName}
          userRole={userRole}
          userAccess={userAccess}
          userTabs={userTabs}
          onMobileMenuToggle={() => setMobileOpen((o) => !o)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
