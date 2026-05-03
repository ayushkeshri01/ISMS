import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { COMPANIES, COMPANY_KEYS } from "@/lib/constants"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavbarLinks } from "@/components/navigation/navbar-links"
import { Shield, BarChart3, Users, Building2 } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/logos/vikasgrouplogo.png" 
                alt="Vikas Group" 
                width={100}
                height={32}
                className="h-8 w-auto"
              />
              <span className="font-bold text-foreground hidden sm:inline">VG ISMS</span>
            </Link>
            <Badge variant="outline" className="hidden sm:inline-flex">
              <span className="mr-1">●</span>
              Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <NavbarLinks showMasterLink={false} />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
            <Shield className="h-10 w-10 text-primary" />
          </div>
          <h2 className="text-4xl font-bold mb-4">
            Vikas Group ISMS Portal
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            ISO/IEC 27001:2022 Compliance Management System for Vikas Group and Subsidiaries
          </p>
        </div>

        {/* Master Dashboard Button */}
        <div className="flex justify-center mb-16">
          <Link href="/dashboard/master">
            <Button size="lg" className="text-lg px-8 py-6 h-auto gap-3 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <BarChart3 className="h-6 w-6" />
              Master Compliance Dashboard
            </Button>
          </Link>
        </div>

        {/* Subsidiary Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {COMPANY_KEYS.map((key) => {
            const company = COMPANIES[key]
            return (
              <Link key={key} href={`/dashboard/${key}`}>
                <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer group">
                  <CardHeader className="text-center pb-2">
                    <div className="flex justify-center mb-4">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        <Image 
                          src={company.logo} 
                          alt={company.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-contain"
                        />
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {key.toUpperCase()}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {company.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button variant="outline" className="w-full group-hover:bg-primary/10">
                      Open Dashboard
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">ISO 27001:2022</h3>
                  <p className="text-sm text-muted-foreground">
                    Full compliance with international information security standards
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Role-Based Access</h3>
                  <p className="text-sm text-muted-foreground">
                    Secure PIN authentication with role-based permissions
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Group Coverage</h3>
                  <p className="text-sm text-muted-foreground">
                    Centralized monitoring across all Vikas Group subsidiaries
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t mt-auto py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Vikas Group ISMS Portal © {new Date().getFullYear()}</p>
          <p className="mt-1">PIN-protected access • All data encrypted</p>
        </div>
      </footer>
    </div>
  )
}
