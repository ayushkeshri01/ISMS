import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/navigation/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const { role, tabs, companyKey, companyName, id, name, access } = session.user

  return (
    <DashboardShell
      userRole={role    ?? ""}
      userTabs={tabs    ?? []}
      companyKey={companyKey  ?? null}
      companyName={companyName ?? null}
      userId={id     ?? ""}
      userName={name   ?? ""}
      userAccess={access ?? ""}
    >
      {children}
    </DashboardShell>
  )
}
