"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  ShieldCheck,
  CheckSquare,
  BarChart3,
  ScrollText,
  Award,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
  X,
} from "lucide-react"
import { COMPANIES, COMPANY_KEYS } from "@/lib/constants"

// ─── Tab icon map ──────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  overview:      LayoutDashboard,
  "my-controls": ShieldCheck,
  docs:          BookOpen,
  review:        CheckSquare,
  trend:         BarChart3,
  log:           ScrollText,
  certificates:  Award,
  users:         Users,
  exec:          BarChart3,
}

function tabLabel(tab: string) {
  const MAP: Record<string, string> = {
    overview:      "Overview",
    "my-controls": "Controls",
    docs:          "Documents",
    review:        "Review",
    trend:         "Trend",
    log:           "Activity Log",
    certificates:  "Certificates",
    users:         "Users",
    exec:          "Executive View",
  }
  return MAP[tab] ?? tab.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface SidebarProps {
  userRole:    string
  userTabs:    string[]
  companyKey:  string | null
  companyName: string | null
  userName:    string
  onClose:     () => void
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
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
  const activeTab    = searchParams.get("tab")

  const [collapsed, setCollapsed] = useState(false)
  const isMaster = pathname.includes("/dashboard/master")
  const isCIO    = userRole === "CIO"

  // Restore collapsed preference (desktop only)
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
  const roleLabel = userRole.replace(/_/g, " ").toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())

  // Short company label for user card
  const companyShort = companyName
    ? companyName.split(" ").slice(0, 2).join(" ")
    : "Vikas Group"

  return (
    <aside
      className={cn(
        "relative flex h-full flex-col border-r bg-card transition-all duration-300 ease-in-out",
        "w-64 md:w-auto",
        collapsed ? "md:w-16" : "md:w-60"
      )}
    >
      {/* ── Header: logo + mobile close ─────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-3 border-b px-4 py-4",
          collapsed && "md:justify-center md:px-0"
        )}
      >
        <Link
          href="/dashboard/master"
          className="flex min-w-0 items-center gap-2.5"
          onClick={onClose}
        >
          <Image
            src="/logos/vikasgrouplogo.png"
            alt="Vikas Group"
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 object-contain"
          />
          <span className={cn("truncate font-bold text-sm", collapsed && "md:hidden")}>
            VG ISMS
          </span>
        </Link>

        <Badge
          variant="outline"
          className={cn("ml-auto shrink-0 px-1.5 py-0 text-xs", collapsed && "md:hidden")}
        >
          <span className="mr-1 opacity-70">●</span>Live
        </Badge>

        {/* Mobile-only close button */}
        <button
          onClick={onClose}
          className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md hover:bg-muted md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">

        {/* Master Dashboard (CIO only) */}
        {isCIO && (
          <>
            <NavItem
              href="/dashboard/master"
              label="Master Dashboard"
              icon={LayoutDashboard}
              active={isMaster}
              collapsed={collapsed}
              onClose={onClose}
            />
            <div className={cn("px-3 py-1", collapsed && "md:px-1")}>
              <Separator />
            </div>
          </>
        )}

        {/* CIO: list all subsidiaries to navigate to */}
        {isCIO && (
          <>
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
            <div className={cn("px-3 py-1", collapsed && "md:px-1")}>
              <Separator />
            </div>
          </>
        )}

        {/* Section tabs */}
        {userTabs.length > 0 && (
          <>
            <p className={cn(
              "px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground",
              collapsed && "md:hidden"
            )}>
              {isMaster ? "Dashboard" : "Sections"}
            </p>
            {userTabs.map((tab) => {
              const Icon    = TAB_ICONS[tab] ?? ShieldCheck
              const tabPath = companyKey
                ? `/dashboard/${companyKey}?tab=${tab}`
                : pathname
              const isActive =
                activeTab === tab || (!activeTab && tab === userTabs[0])
              return (
                <NavItem
                  key={tab}
                  href={tabPath}
                  label={tabLabel(tab)}
                  icon={Icon}
                  active={isActive && !isMaster}
                  collapsed={collapsed}
                  onClose={onClose}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* ── Footer: user card with inline logout ────────────────────── */}
      <div className="border-t">
        <div className={cn(
          "flex items-center gap-3 px-3 py-3",
          collapsed && "md:justify-center md:px-0 md:py-3"
        )}>
          {/* Avatar circle */}
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary font-semibold text-sm select-none">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>

          {/* Name + role + company */}
          <div className={cn("min-w-0 flex-1", collapsed && "md:hidden")}>
            <p className="truncate text-sm font-semibold leading-tight">{userName}</p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
              {roleLabel}
              {companyName && (
                <span className="before:content-['·'] before:mx-1">{companyShort}</span>
              )}
            </p>
          </div>

          {/* Logout icon (replaces down arrow) */}
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
