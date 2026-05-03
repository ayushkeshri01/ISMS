import { auth, signOut } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavbarLinks } from "@/components/navigation/navbar-links"
import { NotificationBellWrapper } from "@/components/dashboard/notification-bell-wrapper"
import { LogOut } from "lucide-react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/logos/vikasgrouplogo.png" alt="Vikas Group" width={100} height={32} className="h-8 w-auto" />
                <span className="font-bold text-foreground hidden sm:inline">VG ISMS</span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex">
              <span className="mr-1">●</span>Live
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <NavbarLinks showCurrentCompany />
            <NotificationBellWrapper userId={session.user.id || ''} />
            <ThemeToggle />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-foreground">{session.user.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{session.user.role.replace(/_/g, ' ').toLowerCase()}</p>
            </div>
            <form action={async () => {
              "use server"
              await signOut({ redirectTo: "/login" })
            }}>
              <Button variant="ghost" size="icon" type="submit">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      
      <main className="container max-w-7xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
