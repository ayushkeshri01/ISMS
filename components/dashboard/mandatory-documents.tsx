"use client"

import { useState, useMemo, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Upload, ArrowUpDown, Filter } from "lucide-react"
import { EvidenceUpload } from "./evidence-upload"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Control {
  id: string
  controlId: string
  label: string
  status: string
  category: string
}

interface Evidence {
  id: string
  status: string
  controlId: string
}

interface Props {
  controls: Control[]
  evidence?: Evidence[]
  companyKey: string
}

const MANDATORY_DOCS = [
  { name: "ISMS Scope Document", clause: "4.3", group: "clause", description: "Defines the boundaries and applicability of the ISMS" },
  { name: "Information Security Policy", clause: "5.2", group: "clause", description: "Top-level policy for information security" },
  { name: "Risk Assessment Procedure", clause: "8.2", group: "clause", description: "Methodology for identifying and analyzing information security risks" },
  { name: "Statement of Applicability (SoA)", clause: "6.1.3", group: "clause", description: "List of all Annex A controls with applicability justification" },
  { name: "Risk Treatment Plan", clause: "8.3", group: "clause", description: "Documented approach to treat identified risks" },
  { name: "Information Security Objectives", clause: "6.2", group: "clause", description: "Set of objectives for information security" },
  { name: "Competence Evidence (HR Records)", clause: "7.2", group: "clause", description: "Records of personnel skills, training and qualifications" },
  { name: "Operational Planning Documents", clause: "8.1", group: "clause", description: "Documents describing how ISMS processes are planned" },
  { name: "Security Metrics", clause: "9.1", group: "clause", description: "Defined metrics for measuring security performance" },
  { name: "Internal Audit Program", clause: "9.2", group: "clause", description: "Program and schedule for internal audits" },
  { name: "Management Review Records", clause: "9.3", group: "clause", description: "Evidence of management review meetings" },
  { name: "Nonconformity & CAPA Records", clause: "10.2", group: "clause", description: "Records of nonconformities and corrective actions" },
  { name: "Asset Inventory", clause: "A.5.9", group: "annex_a", description: "Inventory of information and associated assets" },
  { name: "Access Control Policy", clause: "A.5.15", group: "annex_a", description: "Policy for controlling access to information" },
  { name: "Acceptable Use Policy", clause: "A.5.10", group: "annex_a", description: "Rules for acceptable use of information assets" },
  { name: "Classification Policy", clause: "A.5.12", group: "annex_a", description: "Policy for information classification" },
  { name: "Data Retention Policy", clause: "A.5.33", group: "annex_a", description: "Policy for retention and disposal of records" },
  { name: "Incident Response Procedure", clause: "A.5.26", group: "annex_a", description: "Procedures for responding to security incidents" },
  { name: "Business Continuity Plan", clause: "A.5.30", group: "annex_a", description: "ICT readiness for business continuity" },
  { name: "Backup Policy", clause: "A.8.13", group: "annex_a", description: "Policy for information backup" },
  { name: "Physical Security Policy", clause: "A.7.1", group: "annex_a", description: "Policy for physical security" },
  { name: "HR Security Policy", clause: "A.6.1", group: "annex_a", description: "Personnel security policies" },
  { name: "Change Management Procedure", clause: "A.8.32", group: "annex_a", description: "Procedure for managing changes" },
  { name: "Supplier Agreements", clause: "A.5.20", group: "annex_a", description: "Agreements with suppliers regarding security" },
  { name: "NDA Template", clause: "A.6.6", group: "annex_a", description: "Non-disclosure agreement template" },
  { name: "Remote Working Policy", clause: "A.6.7", group: "annex_a", description: "Security measures for remote working" },
  { name: "Cryptography Policy", clause: "A.8.24", group: "annex_a", description: "Policy for use of cryptographic controls" },
  { name: "Configuration Management", clause: "A.8.9", group: "annex_a", description: "Policy for system configuration" },
]

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
]

const FILTER_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "linked", label: "Linked" },
  { value: "not_started", label: "Not Started" },
]

const GROUP_OPTIONS = [
  { value: "all", label: "All Groups" },
  { value: "clause", label: "Clause Documents" },
  { value: "annex_a", label: "Annex A Controls" },
]

const SORT_OPTIONS = [
  { value: "clause", label: "Clause" },
  { value: "name", label: "Name" },
  { value: "status", label: "Status" },
]

function CustomSelect({ value, onChange, options, className }: {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  className?: string
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-8 min-w-[120px] rounded-lg border bg-background px-2 py-1 text-sm",
        "border-input hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
        className
      )}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function MandatoryDocuments({ controls, evidence = [], companyKey }: Props) {
  const router = useRouter()
  const [sortBy, setSortBy] = useState<string>("clause")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [groupFilter, setGroupFilter] = useState<string>("all")

  // Memoize control map for O(1) lookups
  const controlMap = useMemo(() => {
    const map = new Map<string, Control>()
    controls.forEach(ctrl => map.set(ctrl.controlId, ctrl))
    return map
  }, [controls])

  // Memoize evidence map for O(1) lookups
  const evidenceMap = useMemo(() => {
    const map = new Map<string, Evidence[]>()
    evidence.forEach(e => {
      const existing = map.get(e.controlId) || []
      existing.push(e)
      map.set(e.controlId, existing)
    })
    return map
  }, [evidence])

  // Memoize clause to control mapping
  const clauseControlMap = useMemo(() => {
    const map = new Map<string, Control | null>()
    MANDATORY_DOCS.forEach(doc => {
      const clauses = doc.clause.split(',').map(c => c.trim())
      for (const c of clauses) {
        const found = controlMap.get(c)
        if (found) {
          map.set(doc.clause, found)
          return
        }
      }
      map.set(doc.clause, null)
    })
    return map
  }, [controlMap])

  // Memoize status calculations - single pass
  const statusMap = useMemo(() => {
    const map = new Map<string, string>()
    MANDATORY_DOCS.forEach(doc => {
      const control = clauseControlMap.get(doc.clause)
      if (control?.status === 'COMPLETED') {
        map.set(doc.clause, "COMPLETED")
        return
      }
      if (control?.status === 'IN_PROGRESS') {
        map.set(doc.clause, "IN_PROGRESS")
        return
      }
      
      const docEvidence = control ? (evidenceMap.get(control.controlId) || []) : []
      const hasApproved = docEvidence.some(e => e.status === 'APPROVED')
      const hasPending = docEvidence.some(e => e.status === 'PENDING')
      
      if (hasApproved) map.set(doc.clause, "COMPLETED")
      else if (hasPending) map.set(doc.clause, "IN_PROGRESS")
      else map.set(doc.clause, "NOT_STARTED")
    })
    return map
  }, [clauseControlMap, evidenceMap])

  const handleStatusChange = useCallback(async (clause: string, newStatus: string) => {
    const control = clauseControlMap.get(clause)
    if (!control) return

    try {
      const res = await fetch(`/api/controls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyKey, controlId: control.controlId, status: newStatus })
      })
      
      if (res.ok) {
        router.refresh()
      }
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }, [companyKey, router, clauseControlMap])

  // Memoize filtered and sorted docs
  const processedDocs = useMemo(() => {
    const docs = MANDATORY_DOCS.filter(doc => {
      if (statusFilter !== "all") {
        const status = statusMap.get(doc.clause) || "NOT_STARTED"
        if (statusFilter === "linked") return status !== "NOT_STARTED"
        if (statusFilter === "not_started") return status === "NOT_STARTED"
      }
      if (groupFilter !== "all") return doc.group === groupFilter
      return true
    })

    return docs.sort((a, b) => {
      if (sortBy === "clause") {
        const aClause = a.clause.replace(/,/g, '').replace(/A\./, '9')
        const bClause = b.clause.replace(/,/g, '').replace(/A\./, '9')
        return aClause.localeCompare(bClause, undefined, { numeric: true })
      }
      if (sortBy === "name") return a.name.localeCompare(b.name)
      if (sortBy === "status") {
        const statusOrder: Record<string, number> = { "COMPLETED": 0, "IN_PROGRESS": 1, "NOT_STARTED": 2 }
        const aStatus = statusMap.get(a.clause) || "NOT_STARTED"
        const bStatus = statusMap.get(b.clause) || "NOT_STARTED"
        return (statusOrder[aStatus] ?? 3) - (statusOrder[bStatus] ?? 3)
      }
      return 0
    })
  }, [statusFilter, groupFilter, sortBy, statusMap])

  // Memoize grouped docs
  const groupedDocs = useMemo(() => {
    const groups: Record<string, typeof MANDATORY_DOCS> = {}
    processedDocs.forEach(doc => {
      if (!groups[doc.group]) groups[doc.group] = []
      groups[doc.group].push(doc)
    })
    return groups
  }, [processedDocs])

  return (
    <div className="space-y-4">
      <div className="bg-muted/50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">ISO 27001:2022 Mandatory Documents</h3>
        <p className="text-sm text-muted-foreground">
          These are the core documents required for ISO 27001:2022 certification. 
          Upload evidence for each document or link to existing controls.
        </p>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <CustomSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={FILTER_OPTIONS}
          />
        </div>

        <CustomSelect
          value={groupFilter}
          onChange={setGroupFilter}
          options={GROUP_OPTIONS}
        />

        <div className="flex items-center gap-2 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <CustomSelect
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {groupFilter === "all" ? (
        Object.entries(groupedDocs).map(([groupKey, docs]) => (
          <div key={groupKey} className="space-y-2">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-4">
              {groupKey === "clause" ? "Clause Documents" : "Annex A Controls"}
            </h4>
            <div className="grid gap-3">
              {docs.map((doc) => {
                const status = statusMap.get(doc.clause) || "NOT_STARTED"
                const isLinked = status !== "NOT_STARTED"
                const control = clauseControlMap.get(doc.clause)

                return (
                  <Card key={doc.name} className="bg-muted/30">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-primary">{doc.clause}</span>
                            <span className="font-medium">{doc.name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{doc.description}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CustomSelect
                            value={status}
                            onChange={(val) => handleStatusChange(doc.clause, val)}
                            options={STATUS_OPTIONS}
                            className="min-w-[130px]"
                          />
                          <Dialog>
                            <DialogTrigger render={(props) => (
                              <Button variant={isLinked ? "outline" : "default"} size="sm" {...props}>
                                <Upload className="h-4 w-4 mr-2" />
                                {isLinked ? "View" : "Upload"}
                              </Button>
                            )} />
                            <DialogContent>
                              <EvidenceUpload
                                controls={controls}
                                companyKey={companyKey}
                                preselectedControl={control?.controlId}
                              />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="grid gap-3">
          {processedDocs.map((doc) => {
            const status = statusMap.get(doc.clause) || "NOT_STARTED"
            const isLinked = status !== "NOT_STARTED"
            const control = clauseControlMap.get(doc.clause)

            return (
              <Card key={doc.name} className="bg-muted/30">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-sm text-primary">{doc.clause}</span>
                        <span className="font-medium">{doc.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{doc.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <CustomSelect
                        value={status}
                        onChange={(val) => handleStatusChange(doc.clause, val)}
                        options={STATUS_OPTIONS}
                        className="min-w-[130px]"
                      />
                      <Dialog>
                        <DialogTrigger render={(props) => (
                          <Button variant={isLinked ? "outline" : "default"} size="sm" {...props}>
                            <Upload className="h-4 w-4 mr-2" />
                            {isLinked ? "View" : "Upload"}
                          </Button>
                        )} />
                        <DialogContent>
                          <EvidenceUpload
                            controls={controls}
                            companyKey={companyKey}
                            preselectedControl={control?.controlId}
                          />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
