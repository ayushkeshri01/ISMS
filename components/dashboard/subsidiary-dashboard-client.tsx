"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
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
import { ReviewSchedule } from "./review-schedule"

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
  
  const toggleCioReview = (checked: boolean) => {
    setCioReviewEnabled(checked)
    localStorage.setItem(`cio-review-${companyKeyLower}`, String(checked))
    // If hiding review tab and currently on it, navigate to first available tab
    if (!checked && activeTab === 'review') {
      const firstTab = userTabs.filter(t => t !== 'review')[0] || 'overview'
      const params = new URLSearchParams(searchParams.toString())
      params.set('tab', firstTab)
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  }

  const effectiveTabs = userRole === 'CIO' && !cioReviewEnabled
    ? userTabs.filter(tab => tab !== 'review')
    : userTabs

  const requestedTab = searchParams.get("tab")
  const activeTab = requestedTab && effectiveTabs.includes(requestedTab)
    ? requestedTab
    : (effectiveTabs[0] || "overview")

  useEffect(() => {
    if (!requestedTab && effectiveTabs.length > 0) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("tab", effectiveTabs[0])
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Conditional return AFTER all hooks
  if (!company) {
    return (
      <div className="space-y-4 p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg border p-6">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-4 w-20 mt-2" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    )
  }
  
  const companyInfo = COMPANIES[companyKeyLower as keyof typeof COMPANIES]
  
  if (!companyInfo) {
    router.push("/dashboard/master")
    return null
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

      {activeTab === "overview" && (
        <div className="space-y-4">
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
          </div>
        )}

      {activeTab === "exec" && (
        <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Executive Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.score}%</p>
                    <p className="text-xs text-muted-foreground">Compliance Score</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.completed}/{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Controls Met</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.inProgress}</p>
                    <p className="text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-2xl font-bold">{stats.notStarted}</p>
                    <p className="text-xs text-muted-foreground">Not Started</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-2">Category Breakdown</h3>
                  {Object.entries(controlsByCategory).map(([key, items]) => {
                    const categoryItems = items as Control[]
                    const completed = categoryItems.filter(c => c.status === 'COMPLETED').length
                    const score = categoryItems.length > 0 ? Math.round((completed / categoryItems.length) * 100) : 0
                    const lookupKey = key.replace('annex_a_', 'ANNEX_A_').toUpperCase() as keyof typeof CONTROL_CATEGORIES
                    const categoryInfo = CONTROL_CATEGORIES[lookupKey]
                    const categoryName = categoryInfo?.name || key
                    return (
                      <div key={key} className="flex items-center gap-3 py-1.5">
                        <span className="text-xs text-muted-foreground w-32 truncate">{categoryName}</span>
                        <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${score}%` }} />
                        </div>
                        <span className="text-xs font-medium w-12 text-right">{score}%</span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {activeTab === "my-controls" && (
        <div className="space-y-4">
            <ControlAccordion
              controls={controls}
              companyKey={companyKey}
              userRole={userRole}
            />
          </div>
        )}

      {activeTab === "docs" && (
        <div className="space-y-4">
            <MandatoryDocuments
              controls={allControls}
              evidence={company?.evidence}
              companyKey={companyKey}
            />
          </div>
        )}

      {activeTab === "maker-controls" && (
        <div className="space-y-4">
            <EvidenceUpload
              controls={controls}
              companyKey={companyKey}
            />
          </div>
        )}
      
      {activeTab === "trend" && (
        <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Trend (Monthly)</CardTitle>
              </CardHeader>
              <CardContent>
                <TrendChart data={company?.complianceHistory} />
              </CardContent>
            </Card>
          </div>
        )}

      {activeTab === "log" && (
        <div className="space-y-4">
            <ActivityLogTable logs={activityLogs} />
          </div>
        )}

      {activeTab === "certificates" && (
        <div className="space-y-4">
            <CertificateForm
              certificates={company?.certificates}
              companyKey={companyKey}
            />
          </div>
        )}

      {activeTab === "users" && (
        <div className="space-y-4">
            <UserManagement companyKey={companyKey} />
          </div>
        )}

      {activeTab === "review" && (
        <div className="space-y-4">
            <EvidenceReview
              evidence={company?.evidence}
            />
          </div>
        )}

      {activeTab === "review-schedule" && (
        <div className="space-y-4">
            <ReviewSchedule companyKey={companyKey} />
          </div>
        )}
    </div>
  )
}
