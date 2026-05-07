"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  LayoutDashboard,
  ShieldCheck,
  FileText,
  CheckSquare,
  BarChart3,
  ScrollText,
  Award,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Building2,
} from "lucide-react"
import { COMPANIES, COMPANY_KEYS } from "@/lib/constants"

// ─── Tab icon map ──────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, React.ElementType> = {
  overview:     LayoutDashboard,
  "my-controls": ShieldCheck,
  docs:         BookOpen,
  review:       CheckSquare,
  trend:        BarChart3,
  log:          ScrollText,
  certificates: Award,
  users:        Users,
  exec:         BarChart3,
}

function tabLabel(tab: string) {
  const MAP: Record<string, string> = {
    overview:       "Overview",
    "my-controls":  "Controls",
    docs:           "Documents",
    review:         "Review",
    trend:          "Trend",
    log:            "Activity Log",
    certificates:   "Certificates",
    users:          "Users",
    exec:           "Executive View",
  }
  return MAP[tab] ?? tab.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

interface SidebarProps {
  userRole:    string
  userTabs:    string[]
  companyKey:  string | null
  companyName: string | null
}

export function Sidebar({ userRole, userTabs, companyKey, companyName }: SidebarProps) {
  const pathname    = usePathname()
  const searchParams = useSearchParams()
  const activeTab   = searchParams.get("tab")
  const [collapsed, setCollapsed] = useState(false)
  const isMaster    = pathname.includes("/dashboard/master")
  const isCIO       = userRole === "CIO"

  // Persist collapsed state
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed")
    if (stored !== null) setCollapsed(stored === "true")
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem("sidebar-collapsed", String(next))
  }

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300 ease-in-out shrink-0",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center gap-3 px-4 py-4 border-b", collapsed && "justify-center px-0")}>
        <Link href="/dashboard/master" className="flex items-center gap-2.5 min-w-0">
          <Image
            src="/logos/vikasgrouplogo.png"
            alt="Vikas Group"
            width={32}
            height={32}
            className="h-8 w-8 object-contain shrink-0"
          />
          {!collapsed && (
            <span className="font-bold text-sm leading-tight truncate">VG ISMS</span>
          )}
        </Link>
        {!collapsed && (
          <Badge variant="outline" className="ml-auto shrink-0 text-xs px-1.5 py-0">
            <span className="mr-1 opacity-70">●</span>Live
          </Badge>
        )}
      </div>

      {/* Nav content */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-1">

        {/* Master Dashboard — always visible for CIO */}
        {isCIO && (
          <>
            <NavItem
              href="/dashboard/master"
              label="Master Dashboard"
              icon={LayoutDashboard}
              active={isMaster}
              collapsed={collapsed}
            />
            <div className={cn("px-3 py-1", collapsed && "px-1")}>
              <Separator />
            </div>
          </>
        )}

        {/* Company section heading */}
        {!collapsed && (
          <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {isCIO ? "Subsidiaries" : companyName || "Company"}
          </p>
        )}

        {/* Company links */}
        {isCIO
          ? COMPANY_KEYS.map((key) => {
              const co     = COMPANIES[key]
              const href   = `/dashboard/${key}`
              const active = pathname.startsWith(href) && !isMaster
              return (
                <NavItem
                  key={key}
                  href={href}
                  label={co.name.split(" ")[0]}  // Short name
                  icon={Building2}
                  active={active}
                  collapsed={collapsed}
                  logo={co.logo}
                />
              )
            })
          : companyKey && (
              <NavItem
                href={`/dashboard/${companyKey}`}
                label={companyName || companyKey.toUpperCase()}
                icon={Building2}
                active={!isMaster}
                collapsed={collapsed}
                logo={COMPANIES[companyKey as keyof typeof COMPANIES]?.logo}
              />
            )
        }

        {/* Tab navigation for current company page */}
        {!isMaster && userTabs.length > 0 && (
          <>
            <div className={cn("px-3 py-1", collapsed && "px-1")}>
              <Separator />
            </div>
            {!collapsed && (
              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Sections
              </p>
            )}
            {userTabs.map((tab) => {
              const Icon     = TAB_ICONS[tab] ?? ShieldCheck
              const tabPath  = companyKey
                ? `/dashboard/${companyKey}?tab=${tab}`
                : pathname
              const isActive = activeTab === tab || (!activeTab && tab === userTabs[0])
              return (
                <NavItem
                  key={tab}
                  href={tabPath}
                  label={tabLabel(tab)}
                  icon={Icon}
                  active={isActive}
                  collapsed={collapsed}
                />
              )
            })}
          </>
        )}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggleCollapsed}
        className={cn(
          "absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted transition-colors"
        )}
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

// ─── Individual nav item ───────────────────────────────────────────────────────
interface NavItemProps {
  href:      string
  label:     string
  icon:      React.ElementType
  active:    boolean
  collapsed: boolean
  logo?:     string
}

function NavItem({ href, label, icon: Icon, active, collapsed, logo }: NavItemProps) {
  return (
    <Link href={href} className="block px-2">
      <span
        className={cn(
          "flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
          collapsed && "justify-center px-0",
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
            className="h-4 w-4 object-contain rounded shrink-0"
          />
        ) : (
          <Icon className="h-4 w-4 shrink-0" />
        )}
        {!collapsed && <span className="truncate">{label}</span>}
      </span>
    </Link>
  )
}
