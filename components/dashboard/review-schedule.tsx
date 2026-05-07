"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Loader2,
  History,
  Shield,
  Users,
  Monitor,
  Building2,
} from "lucide-react"

interface ControlInfo {
  id: string
  controlId: string
  label: string
  category: string
}

interface ScheduleItem {
  id: string
  controlId: string
  companyId: string
  frequency: string
  suggestedFrequency: string | null
  lastReviewedAt: string | null
  nextReviewAt: string | null
  createdAt: string
  updatedAt: string
  updatedById: string | null
  control: ControlInfo
  reviewCount: number
}

interface ReviewHistoryItem {
  id: string
  reviewScheduleId: string
  controlId: string
  controlLabel: string | null
  companyKey: string
  reviewedAt: string
  reviewedById: string
  reviewedByName: string
  frequency: string | null
  notes: string | null
}

interface Props {
  companyKey: string
}

function getStatus(nextReviewAt: string | null): { label: string; color: "default" | "secondary" | "destructive" | "outline"; variant: "default" | "secondary" | "destructive" | "outline" } {
  if (!nextReviewAt) return { label: "Not Reviewed", color: "outline", variant: "outline" }

  const now = new Date()
  const next = new Date(nextReviewAt)
  const diffMs = next.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, color: "destructive", variant: "destructive" }
  if (diffDays <= 15) return { label: `Due in ${diffDays}d`, color: "secondary", variant: "secondary" }
  return { label: `${diffDays}d remaining`, color: "default", variant: "default" }
}

function getDaysRemaining(nextReviewAt: string | null): number | null {
  if (!nextReviewAt) return null
  const now = new Date()
  const next = new Date(nextReviewAt)
  return Math.ceil((next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function ReviewSchedule({ companyKey }: Props) {
  const [schedules, setSchedules] = useState<ScheduleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [historyDialog, setHistoryDialog] = useState<{ open: boolean; schedule: ScheduleItem | null; history: ReviewHistoryItem[] }>({
    open: false,
    schedule: null,
    history: [],
  })
  const [historyLoading, setHistoryLoading] = useState(false)

  const fetchSchedules = useCallback(async () => {
    try {
      const res = await fetch(`/api/review-schedule?companyKey=${companyKey}`)
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      setSchedules(data.schedules)
    } catch (err) {
      toast.error("Failed to load review schedule")
    } finally {
      setLoading(false)
    }
  }, [companyKey])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleInit = async () => {
    setInitializing(true)
    try {
      const res = await fetch(`/api/review-schedule/init?companyKey=${companyKey}`, { method: "POST" })
      if (!res.ok) throw new Error("Init failed")
      const data = await res.json()
      toast.success(`AI analysis complete: ${data.created} created, ${data.updated} updated`)
      await fetchSchedules()
    } catch {
      toast.error("Failed to initialize review schedule")
    } finally {
      setInitializing(false)
    }
  }

  const handleFrequencyChange = async (scheduleId: string, frequency: string) => {
    try {
      const res = await fetch("/api/review-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, companyKey, action: "update-frequency", frequency }),
      })
      if (!res.ok) throw new Error("Update failed")
      setSchedules(prev => prev.map(s => s.id === scheduleId ? { ...s, frequency } : s))
      toast.success("Review frequency updated")
    } catch {
      toast.error("Failed to update frequency")
    }
  }

  const handleMarkReviewed = async (scheduleId: string) => {
    try {
      const res = await fetch("/api/review-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, companyKey, action: "mark-reviewed" }),
      })
      if (!res.ok) throw new Error("Mark reviewed failed")
      toast.success("Review completed! Next review date calculated.")
      await fetchSchedules()
    } catch {
      toast.error("Failed to mark as reviewed")
    }
  }

  const handleUnmarkReviewed = async (scheduleId: string) => {
    try {
      const res = await fetch("/api/review-schedule", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduleId, companyKey, action: "unmark-reviewed" }),
      })
      if (!res.ok) throw new Error("Unmark failed")
      toast.success("Review status cleared.")
      await fetchSchedules()
    } catch {
      toast.error("Failed to unmark review")
    }
  }

  const openHistory = async (schedule: ScheduleItem) => {
    setHistoryDialog({ open: true, schedule, history: [] })
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/review-schedule/history?companyKey=${companyKey}&scheduleId=${schedule.id}`)
      if (!res.ok) throw new Error("Failed to fetch history")
      const data = await res.json()
      setHistoryDialog(prev => ({ ...prev, history: data.history }))
    } catch {
      toast.error("Failed to load review history")
    } finally {
      setHistoryLoading(false)
    }
  }

  const needsInit = !loading && schedules.length === 0

  const filtered = schedules.filter(s => {
    if (filter === "quarterly" && s.frequency !== "QUARTERLY") return false
    if (filter === "annual" && s.frequency !== "ANNUAL") return false
    if (filter === "due-soon") {
      const days = getDaysRemaining(s.nextReviewAt)
      if (days === null || days > 15) return false
    }
    if (filter === "overdue") {
      const days = getDaysRemaining(s.nextReviewAt)
      if (days === null || days >= 0) return false
    }
    if (filter === "completed" && !s.lastReviewedAt) return false

    if (search) {
      const q = search.toLowerCase()
      const c = s.control
      if (!c.controlId.toLowerCase().includes(q) &&
          !c.label.toLowerCase().includes(q) &&
          !s.frequency.toLowerCase().includes(q)) {
        const status = getStatus(s.nextReviewAt)
        if (!status.label.toLowerCase().includes(q)) return false
      }
    }
    return true
  })

  const stats = {
    total: schedules.length,
    quarterly: schedules.filter(s => s.frequency === "QUARTERLY").length,
    annual: schedules.filter(s => s.frequency === "ANNUAL").length,
    dueThisMonth: schedules.filter(s => {
      const days = getDaysRemaining(s.nextReviewAt)
      return days !== null && days >= 0 && days <= 30
    }).length,
    overdue: schedules.filter(s => {
      const days = getDaysRemaining(s.nextReviewAt)
      return days !== null && days < 0
    }).length,
    recentlyReviewed: schedules.filter(s => {
      if (!s.lastReviewedAt) return false
      return new Date(s.lastReviewedAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000
    }).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (needsInit) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Calendar className="h-16 w-16 text-muted-foreground" />
        <h3 className="text-xl font-semibold">Review Schedule Not Initialized</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Click below to let AI analyze all {schedules.length > 0 ? schedules.length : "ISO 27001:2022"} controls and suggest review frequencies based on industry best practices.
        </p>
        <Button onClick={handleInit} disabled={initializing} size="lg">
          {initializing ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyzing Controls…</>
          ) : (
            <><RefreshCw className="mr-2 h-4 w-4" /> Initialize Review Schedule</>
          )}
        </Button>
      </div>
    )
  }

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case "annex_a_5": return <Building2 className="h-3.5 w-3.5" />
      case "annex_a_6": return <Users className="h-3.5 w-3.5" />
      case "annex_a_7": return <Shield className="h-3.5 w-3.5" />
      case "annex_a_8": return <Monitor className="h-3.5 w-3.5" />
      default: return <FileText className="h-3.5 w-3.5" />
    }
  }

  const categoryColor = (cat: string) => {
    switch (cat) {
      case "annex_a_5": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      case "annex_a_6": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case "annex_a_7": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case "annex_a_8": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      default: return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
    }
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-primary/10">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.total}</p>
                <p className="text-[10px] text-muted-foreground">Total Controls</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/30">
                <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.quarterly}</p>
                <p className="text-[10px] text-muted-foreground">Quarterly</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                <Calendar className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.annual}</p>
                <p className="text-[10px] text-muted-foreground">Annual</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-yellow-100 dark:bg-yellow-900/30">
                <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-xl font-bold">{stats.dueThisMonth}</p>
                <p className="text-[10px] text-muted-foreground">Due This Month</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-red-100 dark:bg-red-900/30">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.overdue}</p>
                <p className="text-[10px] text-muted-foreground">Overdue</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-green-100 dark:bg-green-900/30">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.recentlyReviewed}</p>
                <p className="text-[10px] text-muted-foreground">Reviewed (30d)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {[
            { key: "all", label: "All Controls" },
            { key: "quarterly", label: "Quarterly" },
            { key: "annual", label: "Annual" },
            { key: "due-soon", label: "Due Soon" },
            { key: "overdue", label: "Overdue" },
            { key: "completed", label: "Completed" },
          ].map(f => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
              className="text-xs h-8"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search controls…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 h-9 text-sm w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="sm" onClick={handleInit} disabled={initializing} className="h-9 text-xs">
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${initializing ? "animate-spin" : ""}`} />
            Re-analyze
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Control ID</TableHead>
                <TableHead className="min-w-[220px]">Control Name</TableHead>
                <TableHead className="w-[100px]">Frequency</TableHead>
                <TableHead className="w-[130px]">Last Reviewed</TableHead>
                <TableHead className="w-[130px]">Next Review</TableHead>
                <TableHead className="w-[130px]">Countdown</TableHead>
                <TableHead className="w-[130px]">Status</TableHead>
                <TableHead className="w-[140px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    No controls match the current filter
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(s => {
                  const days = getDaysRemaining(s.nextReviewAt)
                  const status = getStatus(s.nextReviewAt)
                  const isOverdue = days !== null && days < 0
                  const isDueSoon = days !== null && days >= 0 && days <= 15
                  const isReviewed = !!s.lastReviewedAt

                  return (
                    <TableRow key={s.id} className={isOverdue ? "bg-red-50/50 dark:bg-red-950/10" : ""}>
                      <TableCell>
                        <span className="font-mono text-xs font-medium">{s.control.controlId}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded ${categoryColor(s.control.category)}`}>
                            {categoryIcon(s.control.category)}
                          </span>
                          <span className="text-sm">{s.control.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={s.frequency}
                          onValueChange={v => handleFrequencyChange(s.id, v)}
                        >
                          <SelectTrigger className="h-7 text-xs w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="ANNUAL">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(s.lastReviewedAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(s.nextReviewAt)}
                      </TableCell>
                      <TableCell>
                        {days !== null ? (
                          <span className={`text-xs font-medium tabular-nums ${
                            isOverdue ? "text-red-600 dark:text-red-400" :
                            isDueSoon ? "text-amber-600 dark:text-amber-400" :
                            "text-muted-foreground"
                          }`}>
                            {isOverdue
                              ? `${Math.abs(days)} days overdue`
                              : `${days} days remaining`
                            }
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status.variant} className="text-[10px] px-1.5 py-0">
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {isReviewed ? (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleMarkReviewed(s.id)}
                              >
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Re-review
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleUnmarkReviewed(s.id)}
                              >
                                Unmark
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleMarkReviewed(s.id)}
                            >
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Mark Reviewed
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => openHistory(s)}
                            title="View review history"
                          >
                            <History className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* History Dialog */}
      <Dialog open={historyDialog.open} onOpenChange={open => setHistoryDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center gap-2">
              <History className="h-4 w-4" />
              Review History
            </DialogTitle>
            <DialogDescription>
              {historyDialog.schedule?.control.controlId} — {historyDialog.schedule?.control.label}
            </DialogDescription>
          </DialogHeader>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : historyDialog.history.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">No review history recorded yet.</p>
          ) : (
            <div className="space-y-2">
              {historyDialog.history.map(h => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-lg border text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <div>
                      <p className="font-medium">{h.reviewedByName}</p>
                      <p className="text-xs text-muted-foreground">
                        {h.frequency === "QUARTERLY" ? "Quarterly" : "Annual"} review
                        {h.notes && <> — {h.notes}</>}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDate(h.reviewedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
