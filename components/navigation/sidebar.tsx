"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  Building2,
  LogOut,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
  FileText,
  ClipboardCheck,
  Award,
  Users,
  TrendingUp,
  Activity,
  BarChart3,
  Calendar,
} from "lucide-react"
import { COMPANIES, COMPANY_KEYS } from "@/lib/constants"

const TAB_META: Record<string, { label: string; icon: React.ElementType }> = {
  overview:    { label: "Overview",     icon: LayoutDashboard },
  "my-controls": { label: "Controls",  icon: ClipboardList   },
  docs:        { label: "Documents",   icon: FileText         },
  review:      { label: "Review",      icon: ClipboardCheck   },
  "review-schedule": { label: "Review Schedule", icon: Calendar },
  certificates:{ label: "Certificates",icon: Award            },
  users:       { label: "Users",       icon: Users            },
  trend:       { label: "Trend",       icon: TrendingUp       },
  log:         { label: "Activity Log",icon: Activity         },
  exec:        { label: "Executive",   icon: BarChart3        },
}

interface SidebarProps {
  userRole:    string
  userTabs:    string[]
  companyKey:  string | null
  companyName: string | null
  userName:    string
  onClose:     () => void
}

export function Sidebar({
  userRole,
  userTabs,
  companyKey,
  companyName,
  userName,
  onClose,
}: SidebarProps) {
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [collapsed, setCollapsed] = useState(false)
  const isMaster  = pathname.includes("/dashboard/master")
  const isCIO     = userRole === "CIO"
  const activeTab = searchParams.get("tab") ?? userTabs[0] ?? "overview"
  // Show tab nav only when on a company dashboard page
  const isCompanyPage = !!companyKey && pathname.includes(`/dashboard/${companyKey}`) && !isMaster

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(stored === "true")
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  // Friendly role label
  const roleLabel   = userRole.replace(/_/g, " ").toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
  const companyShort = companyName
    ? companyName.split(" ").slice(0, 2).join(" ")
    : "Vikas Group"

  // Determine what to show in the top header
  const companyInfo = companyKey
    ? COMPANIES[companyKey as keyof typeof COMPANIES]
    : null

  const headerLogo = companyInfo?.logo ?? "/logos/vikasgrouplogo.png"
  const headerName = companyName ?? "Vikas Group"

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
        "w-64 md:w-auto",
        collapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* ── Header: company logo + name ─────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-4",
          collapsed && "md:justify-center md:px-0"
        )}
      >
        <Link
          href={isCIO ? "/dashboard/master" : `/dashboard/${companyKey ?? ""}`}
          className="flex min-w-0 items-center gap-2.5"
          onClick={onClose}
        >
          <Image
            src={headerLogo}
            alt={headerName}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded object-contain"
          />
          <span className={cn("truncate font-bold text-sm", collapsed && "md:hidden")}>
            {headerName}
          </span>
        </Link>

        {/* Mobile close button */}
        <button
          onClick={onClose}
          className="ml-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">

        {/* CIO: Master Dashboard link */}
        {isCIO && (
          <NavItem
            href="/dashboard/master"
            label="Master Dashboard"
            icon={LayoutDashboard}
            active={isMaster}
            collapsed={collapsed}
            onClose={onClose}
          />
        )}

        {/* CIO: all subsidiaries */}
        {isCIO && (
          <>
            <div className={cn("px-3 py-1", collapsed && "md:px-1")}>
              <Separator />
            </div>
            <p className={cn(
              "px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
              collapsed && "md:hidden"
            )}>
              Subsidiaries
            </p>
            {COMPANY_KEYS.map((key) => {
              const co     = COMPANIES[key]
              const href   = `/dashboard/${key}`
              const active = pathname.startsWith(href) && !isMaster
              return (
                <NavItem
                  key={key}
                  href={href}
                  label={co.name.split(" ")[0]}
                  icon={Building2}
                  active={active}
                  collapsed={collapsed}
                  logo={co.logo}
                  onClose={onClose}
                />
              )
            })}
          </>
        )}

        {/* Tab nav items — shown when on a company page (non-CIO) */}
        {isCompanyPage && !isCIO && userTabs.length > 0 && (
          <>
            <div className={cn("px-3 py-1", collapsed && "md:px-1")}>
              <Separator />
            </div>
            {userTabs.map((tab) => {
              const meta = TAB_META[tab]
              if (!meta) return null
              return (
                <NavItem
                  key={tab}
                  href={`/dashboard/${companyKey}?tab=${tab}`}
                  label={meta.label}
                  icon={meta.icon}
                  active={activeTab === tab}
                  collapsed={collapsed}
                  onClose={onClose}
                />
              )
            })}
          </>
        )}

        {/* CIO on company page: also show tab nav */}
        {isCIO && !isMaster && companyKey && userTabs.length > 0 && (
          <>
            <div className={cn("px-3 py-1", collapsed && "md:px-1")}>
              <Separator />
            </div>
            <p className={cn(
              "px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
              collapsed && "md:hidden"
            )}>
              Sections
            </p>
            {userTabs.map((tab) => {
              const meta = TAB_META[tab]
              if (!meta) return null
              return (
                <NavItem
                  key={tab}
                  href={`/dashboard/${companyKey}?tab=${tab}`}
                  label={meta.label}
                  icon={meta.icon}
                  active={activeTab === tab}
                  collapsed={collapsed}
                  onClose={onClose}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* ── Footer: user card + logout ──────────────────────────────── */}
      <div className="border-t">
        <div className={cn(
          "flex items-center gap-3 px-3 py-3",
          collapsed && "md:justify-center md:px-0 md:py-3"
        )}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm select-none">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>

          <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
            <p className="truncate text-sm font-semibold leading-tight">{userName}</p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
              {roleLabel}
              {companyName && (
                <span className="before:content-['·'] before:mx-1">{companyShort}</span>
              )}
            </p>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-md",
              "text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors",
              collapsed && "md:hidden"
            )}
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Collapse toggle (desktop only) ──────────────────────────── */}
      <button
        onClick={toggleCollapsed}
        className="absolute -right-3 top-16 z-10 hidden h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors md:flex"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft  className="h-3 w-3" />
        }
      </button>
    </aside>
  )
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
interface NavItemProps {
  href:      string
  label:     string
  icon:      React.ElementType
  active:    boolean
  collapsed: boolean
  onClose:   () => void
  logo?:     string
}

function NavItem({ href, label, icon: Icon, active, collapsed, onClose, logo }: NavItemProps) {
  return (
    <Link href={href} className="block px-2" onClick={onClose}>
      <span
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
          collapsed && "md:justify-center md:px-0",
          active
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        title={collapsed ? label : undefined}
      >
        {logo ? (
          <Image
            src={logo}
            alt={label}
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 rounded object-contain"
          />
        ) : (
          <Icon className="h-4 w-4 shrink-0" />
        )}
        <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
      </span>
    </Link>
  )
}
