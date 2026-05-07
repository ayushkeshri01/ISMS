"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { COMPANIES, CONTROL_CATEGORIES } from "@/lib/constants"
import { CheckCircle, Clock, XCircle, BarChart3, Printer } from "lucide-react"
import { ControlAccordion } from "./control-accordion"
import { EvidenceUpload } from "./evidence-upload"
import { MandatoryDocuments } from "./mandatory-documents"
import { EvidenceReview } from "./evidence-review"
import { ActivityLogTable } from "./activity-log"
import { TrendChart } from "./trend-chart"
import { CertificateForm } from "./certificate-form"
import { UserManagement } from "./user-management"

interface Control {
  id: string
  controlId: string
  label: string
  description?: string | null
  status: string
  category: string
}

interface Props {
  companyKey: string
  company?: { 
    id: string; 
    key: string; 
    name: string; 
    logo?: string | null; 
    certificates?: Array<{ id: string; body: string; number: string; validFrom: Date; validTo: Date; isActive: boolean; scope: string; surveillanceAudit1?: Date | null; surveillanceAudit2?: Date | null; certificateFile?: string | null }>;
    complianceHistory?: Array<{ month: number; year: number; score: number }>; 
    evidence?: Array<{ id: string; status: string; controlId: string; filename: string; fileType: string; evidenceType: string; uploadedByName: string; createdAt: Date }> 
  }
  controls: Control[]
  allControls: Control[]
  activityLogs?: Array<{
    id: string;
    userName: string;
    userRole: string;
    action: string;
    controlId?: string | null;
    controlLabel?: string | null;
    fromStatus?: string | null;
    toStatus?: string | null;
    details?: string | null;
    isLocal?: boolean;
    createdAt: Date;
    companyKey?: string;
    userId?: string;
  }>
  userRole: string
  userTabs: string[]
}

function formatTabLabel(tab: string) {
  return tab
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

export function SubsidiaryDashboardClient({
  companyKey,
  company,
  controls,
  allControls,
  activityLogs,
  userRole,
  userTabs
}: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const companyKeyLower = companyKey.toLowerCase()
  
  // All hooks must be called before any conditional returns
  const [cioReviewEnabled, setCioReviewEnabled] = useState(false)
  
  useEffect(() => {
    if (userRole === 'CIO') {
      const stored = localStorage.getItem(`cio-review-${companyKeyLower}`)
      setTimeout(() => {
        setCioReviewEnabled(stored === 'true')
      }, 0)
    }
  }, [userRole, companyKeyLower])
  
  // Conditional return AFTER all hooks
  if (!company) {
    return <div className="p-8 text-center">Loading company data...</div>
  }
  
  const companyInfo = COMPANIES[companyKeyLower as keyof typeof COMPANIES]
  
  if (!companyInfo) {
    router.push("/dashboard/master")
    return null
  }
  
  const toggleCioReview = (checked: boolean) => {
    setCioReviewEnabled(checked)
    localStorage.setItem(`cio-review-${companyKeyLower}`, String(checked))
  }
  
  // Compute effective tabs based on CIO toggle
  const effectiveTabs = userRole === 'CIO' && !cioReviewEnabled
    ? userTabs.filter(tab => tab !== 'review')
    : userTabs

  const requestedTab = searchParams.get("tab")
  const activeTab = requestedTab && effectiveTabs.includes(requestedTab)
    ? requestedTab
    : (effectiveTabs[0] || "overview")

  // On first load (no tab param), push the default tab into the URL so the
  // topbar and sidebar both reflect the active section immediately.
  useEffect(() => {
    if (!requestedTab && effectiveTabs.length > 0) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", effectiveTabs[0])
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleTabChange = (tabValue: string) => {
    if (!effectiveTabs.includes(tabValue) || tabValue === activeTab) {
      return
    }
    
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", tabValue)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }
  
  const stats = {
    total: allControls.length,
    completed: allControls.filter((c: Control) => c.status === 'COMPLETED').length,
    inProgress: allControls.filter((c: Control) => c.status === 'IN_PROGRESS').length,
    notStarted: allControls.filter((c: Control) => c.status === 'NOT_STARTED').length,
    score: allControls.length > 0
      ? Math.round((allControls.filter((c: Control) => c.status === 'COMPLETED').length / allControls.filter((c: Control) => c.status !== 'NA').length) * 100)
      : 0
  }
  
  const controlsByCategory = {
    clauses: allControls.filter((c: Control) => /^\d+\.\d+$/.test(c.controlId)),
    annex_a_5: allControls.filter((c: Control) => c.controlId.startsWith('A.5')),
    annex_a_6: allControls.filter((c: Control) => c.controlId.startsWith('A.6')),
    annex_a_7: allControls.filter((c: Control) => c.controlId.startsWith('A.7')),
    annex_a_8: allControls.filter((c: Control) => c.controlId.startsWith('A.8')),
  }
  
  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={(value) => handleTabChange(String(value))}>
        {/* Tab bar — full width, scrollable on mobile */}
        <div className="flex flex-col gap-3 mb-4">
          <div className="flex justify-center overflow-x-auto">
            <TabsList className="h-auto flex-wrap justify-center gap-0.5">
              {effectiveTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} className="px-3 py-1.5">
                  {formatTabLabel(tab)}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Actions row */}
          <div className="flex items-center justify-end gap-2">
            {userRole === 'CIO' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="cio-review-toggle"
                  checked={cioReviewEnabled}
                  onCheckedChange={(checked) => toggleCioReview(checked as boolean)}
                />
                <Label htmlFor="cio-review-toggle" className="text-sm cursor-pointer whitespace-nowrap">
                  Review Tab
                </Label>
              </div>
            )}
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {effectiveTabs.includes("overview") && (
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.score}%</p>
                      <p className="text-xs text-muted-foreground">Overall Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <CheckCircle className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{stats.completed}</p>
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
                      <p className="text-2xl font-bold">{stats.inProgress}</p>
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
                      <p className="text-2xl font-bold">{stats.notStarted}</p>
                      <p className="text-xs text-muted-foreground">Not Started</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(controlsByCategory).map(([key, items]) => {
                  const categoryItems = items as Control[]
                  const completed = categoryItems.filter(c => c.status === 'COMPLETED').length
                  const score = categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0
                  const lookupKey = key.replace('annex_a_', 'ANNEX_A_').toUpperCase() as keyof typeof CONTROL_CATEGORIES
                  const categoryInfo = CONTROL_CATEGORIES[lookupKey]
                  const categoryName = categoryInfo?.name || key
                  
                  return (
                    <div key={key} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{categoryName}</span>
                        <span className="font-medium">
                          {score}% ({completed}/{categoryItems.length})
                        </span>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {effectiveTabs.includes("exec") && (
          <TabsContent value="exec" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={company?.complianceHistory} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {effectiveTabs.includes("my-controls") && (
          <TabsContent value="my-controls" className="space-y-4">
            <ControlAccordion
              controls={controls}
              companyKey={companyKey}
              userRole={userRole}
            />
          </TabsContent>
        )}

        {effectiveTabs.includes("docs") && (
          <TabsContent value="docs" className="space-y-4">
            <MandatoryDocuments
              controls={allControls}
              evidence={company?.evidence}
              companyKey={companyKey}
            />
          </TabsContent>
        )}

        {effectiveTabs.includes("maker-controls") && (
          <TabsContent value="maker-controls" className="space-y-4">
            <EvidenceUpload
              controls={controls}
              companyKey={companyKey}
            />
          </TabsContent>
          )}
        
        {effectiveTabs.includes("trend") && (
          <TabsContent value="trend" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trend (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={company?.complianceHistory} />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {effectiveTabs.includes("log") && (
          <TabsContent value="log" className="space-y-4">
            <ActivityLogTable logs={activityLogs} />
          </TabsContent>
        )}

        {effectiveTabs.includes("certificates") && (
          <TabsContent value="certificates" className="space-y-4">
            <CertificateForm
              certificates={company?.certificates}
              companyKey={companyKey}
            />
          </TabsContent>
        )}

        {effectiveTabs.includes("users") && (
          <TabsContent value="users" className="space-y-4">
            <UserManagement companyKey={companyKey} />
          </TabsContent>
        )}

        {effectiveTabs.includes("review") && (
          <TabsContent value="review" className="space-y-4">
            <EvidenceReview
              evidence={company?.evidence}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
