"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { Button } from "@/components/ui/button"

interface NavbarLinksProps {
  showCurrentCompany?: boolean
  showMasterLink?: boolean
}

function getCurrentCompanyKey(pathname: string) {
  const segments = pathname.split("/").filter(Boolean)

  if (segments[0] !== "dashboard") return null
  if (!segments[1]) return null
  if (segments[1] === "master") return null

  return segments[1]
}

export function NavbarLinks({ showCurrentCompany = false, showMasterLink = true }: NavbarLinksProps) {
  const pathname = usePathname()

  const isPortalHome = pathname === "/"
  const isMasterDashboard = pathname === "/dashboard/master"
  const currentCompanyKey = showCurrentCompany ? getCurrentCompanyKey(pathname) : null

  return (
    <div className="flex items-center gap-2">
      <Link href="/">
        <Button
          variant={isPortalHome ? "default" : "ghost"}
          aria-current={isPortalHome ? "page" : undefined}
        >
          Portal Home
        </Button>
      </Link>

      {showMasterLink ? (
        <Link href="/dashboard/master" className="hidden sm:inline-flex">
          <Button
            variant={isMasterDashboard ? "default" : "ghost"}
            aria-current={isMasterDashboard ? "page" : undefined}
          >
            Master Dashboard
          </Button>
        </Link>
      ) : null}

      {currentCompanyKey ? (
        <Link href={pathname} className="hidden md:inline-flex">
          <Button variant="default" aria-current="page">
            {currentCompanyKey.toUpperCase()} Dashboard
          </Button>
        </Link>
      ) : null}
    </div>
  )
}
