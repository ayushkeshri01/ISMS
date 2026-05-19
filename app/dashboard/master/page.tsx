import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { COMPANIES, COMPANY_KEYS } from "@/lib/constants"
import { TrendingUp, CheckCircle2, Clock, XCircle, BarChart3 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { MasterDashboardClient } from "@/components/dashboard/master-dashboard-client"

async function getDashboardData() {
  const companies = await Promise.all(
    COMPANY_KEYS.map(async (key) => {
      const controls = await prisma.control.findMany({
        where: { company: { key } },
        select: { status: true, category: true }
      })
      
      const history = await prisma.complianceHistory.findMany({
        where: { company: { key } },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 6
      })
      
      const statuses = controls.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const applicable = controls.filter(c => c.status !== 'NA')
      const score = applicable.length > 0
        ? Math.round((applicable.filter(c => c.status === 'COMPLETED').length / applicable.length) * 100)
        : 0
      
      return {
        key,
        name: COMPANIES[key].name,
        logo: COMPANIES[key].logo,
        controls,
        statuses,
        score,
        history: history.reverse()
      }
    })
  )
  
  return companies
}

export default async function MasterDashboardPage() {
  const session = await auth()
  if (!session) redirect("/login")

  if (session.user.companyKey) {
    redirect(`/dashboard/${session.user.companyKey}`)
  }

  const companies = await getDashboardData()

  const totalControls = companies.reduce((sum, c) => sum + c.controls.length, 0)
  const totalCompleted = companies.reduce((sum, c) => sum + (c.statuses.COMPLETED || 0), 0)
  const totalInProgress = companies.reduce((sum, c) => sum + (c.statuses.IN_PROGRESS || 0), 0)
  const totalNotStarted = companies.reduce((sum, c) => sum + (c.statuses.NOT_STARTED || 0), 0)
  const avgScore = Math.round(companies.reduce((sum, c) => sum + c.score, 0) / companies.length)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Master Compliance Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Group-wide ISO 27001:2022 compliance overview</p>
        </div>
        <MasterDashboardClient companies={companies} />
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <p className="text-muted-foreground text-sm uppercase tracking-wide">Overall Compliance</p>
              <div className="text-6xl font-bold mt-2">{avgScore}%</div>
              <Badge variant={avgScore >= 80 ? "default" : avgScore >= 60 ? "secondary" : "destructive"} className="mt-2">
                {avgScore >= 80 ? "Audit Ready" : avgScore >= 60 ? "In Progress" : "Early Stage"}
              </Badge>
            </div>
            
            <div className="flex-1 max-w-md w-full">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">Progress to 80%</span>
                <span className="font-medium">{avgScore}%</span>
              </div>
              <Progress value={avgScore} className="h-3" />
              <p className="text-xs text-muted-foreground mt-2">80% required for audit readiness</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CheckCircle2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalInProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <XCircle className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalNotStarted}</p>
                <p className="text-xs text-muted-foreground">Not Started</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalControls}</p>
                <p className="text-xs text-muted-foreground">Total Controls</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {companies.map((company) => (
          <Link key={company.key} href={`/dashboard/${company.key}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <Image src={company.logo} alt={company.name} width={40} height={40} className="h-10 w-10 object-contain rounded" />
                  <div>
                    <CardTitle className="text-lg">{company.key.toUpperCase()}</CardTitle>
                    <p className="text-xs text-muted-foreground">{company.name}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-2">{company.score}%</div>
                <Progress value={company.score} className="h-2 mb-3" />
                
                <div className="flex items-end gap-1 h-12">
                  {company.history.map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/50 rounded-t"
                      style={{ height: `${Math.max(4, h.score)}%` }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Compliance Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                {COMPANY_KEYS.map(key => (
                  <TableHead key={key} className="text-center">{key.toUpperCase()}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Overall Score</TableCell>
                {companies.map(c => (
                  <TableCell key={c.key} className="text-center">
                    <span>{c.score}%</span>
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Completed</TableCell>
                {companies.map(c => (
                  <TableCell key={c.key} className="text-center">
                    {c.statuses.COMPLETED || 0}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">In Progress</TableCell>
                {companies.map(c => (
                  <TableCell key={c.key} className="text-center">
                    {c.statuses.IN_PROGRESS || 0}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Not Started</TableCell>
                {companies.map(c => (
                  <TableCell key={c.key} className="text-center">
                    {c.statuses.NOT_STARTED || 0}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
