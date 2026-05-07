import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Sidebar } from "@/components/navigation/sidebar"
import { Topbar } from "@/components/navigation/topbar"
import { Suspense } from "react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { role, tabs, companyKey, companyName } = session.user

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left sidebar */}
      <Suspense fallback={<div className="w-60 border-r bg-card" />}>
        <Sidebar
          userRole={role ?? ""}
          userTabs={tabs ?? []}
          companyKey={companyKey ?? null}
          companyName={companyName ?? null}
        />
      </Suspense>

      {/* Main column */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Slim top bar */}
        <Topbar />

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
