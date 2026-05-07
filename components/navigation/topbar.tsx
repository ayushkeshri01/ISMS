import { auth, signOut } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NotificationBellWrapper } from "@/components/dashboard/notification-bell-wrapper"
import { LogOut, User } from "lucide-react"

export async function Topbar() {
  const session = await auth()
  if (!session) return null

  const user = session.user

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center border-b bg-background/95 backdrop-blur px-4 gap-4">
      {/* Page context (left side — can be extended with a breadcrumb later) */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {user.companyName ?? "Vikas Group"}
        </p>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2 shrink-0">
        <NotificationBellWrapper userId={user.id || ""} />

        <ThemeToggle />

        {/* User chip */}
        <div className="hidden sm:flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <User className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="text-left leading-tight">
            <p className="text-xs font-semibold">{user.name}</p>
            <p className="text-[10px] text-muted-foreground capitalize">
              {user.role?.replace(/_/g, " ").toLowerCase()}
            </p>
          </div>
          {user.access && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
              {user.access}
            </Badge>
          )}
        </div>

        {/* Logout */}
        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
        >
          <Button variant="ghost" size="icon" type="submit" className="h-8 w-8" title="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  )
}
