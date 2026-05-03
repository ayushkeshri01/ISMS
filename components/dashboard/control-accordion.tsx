"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Upload } from "lucide-react"
import { EvidenceUpload } from "./evidence-upload"
import { CONTROL_CATEGORIES } from "@/lib/constants"
import { cn } from "@/lib/utils"

interface Control {
  id: string
  controlId: string
  label: string
  description?: string | null
  status: string
  category: string
}

interface Props {
  controls: Control[]
  companyKey: string
  userRole: string
}

const STATUS_OPTIONS = [
  { value: "NOT_STARTED", label: "Not Started" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "NA", label: "N/A" }
]

interface StatusSelectProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  isPending?: boolean
}

function StatusSelect({ value, onChange, disabled, isPending }: StatusSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!disabled && !isPending) {
      onChange(e.target.value)
    }
  }
  
  return (
    <select
      value={value}
      onChange={handleChange}
      disabled={disabled || isPending}
      className={cn(
        "h-8 min-w-[110px] rounded-lg border bg-background px-2 py-1 text-sm",
        "border-input hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring",
        (disabled || isPending) && "opacity-50 cursor-not-allowed"
      )}
    >
      {STATUS_OPTIONS.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export function ControlAccordion({ controls, companyKey, userRole }: Props) {
  const [localControls, setLocalControls] = useState<Control[]>(() => controls || [])
  const [pendingControls, setPendingControls] = useState<Set<string>>(new Set())
  
  const isWriter = useMemo(() =>
    ['CIO', 'IT_MANAGER', 'STQM_MANAGER', 'HR_MANAGER', 'ADMIN_FACILITIES', 'LEGAL', 'IT_EXECUTIVE', 'HR_EXECUTIVE'].includes(userRole),
    [userRole]
  )
  
  const handleStatusChange = useCallback(async (controlId: string, newStatus: string) => {
    const currentControl = localControls.find(c => c.controlId === controlId)
    if (currentControl?.status === newStatus) return
    if (pendingControls.has(controlId)) return // Prevent double-click
    
    // Mark as pending
    setPendingControls(prev => new Set(prev).add(controlId))
    
    // Optimistic update
    setLocalControls(prev =>
      prev.map(c => c.controlId === controlId ? { ...c, status: newStatus } : c)
    )
    
    try {
      console.log('[StatusChange] Sending PATCH:', { companyKey, controlId, newStatus })
      
      const res = await fetch(`/api/controls`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ companyKey, controlId, status: newStatus })
      })
      
      const data = await res.json()
      console.log('[StatusChange] Response:', { status: res.status, data })
      
      if (!res.ok) {
        // Revert optimistic update on failure
        setLocalControls(prev =>
          prev.map(c => c.controlId === controlId ? { ...c, status: currentControl?.status || 'NOT_STARTED' } : c)
        )
        alert(`Failed: ${data.error || 'Unknown error'} (status ${res.status})`)
      }
    } catch (err) {
      console.error('[StatusChange] Network error:', err)
      // Revert optimistic update on failure
      setLocalControls(prev =>
        prev.map(c => c.controlId === controlId ? { ...c, status: currentControl?.status || 'NOT_STARTED' } : c)
      )
      alert('Network error: Could not update status. Check console for details.')
    } finally {
      setPendingControls(prev => {
        const next = new Set(prev)
        next.delete(controlId)
        return next
      })
    }
  }, [companyKey, localControls, pendingControls])
  
  const sortedControls = useMemo(() => {
    const sortControls = (a: Control, b: Control) => {
      const parseControlId = (id: string) => {
        if (id.startsWith('A.')) {
          const match = id.match(/A\.(\d+)\.(\d+)/)
          if (match) return [0, parseInt(match[1]), parseInt(match[2])]
        } else if (/^\d+\.\d+$/.test(id)) {
          const match = id.match(/(\d+)\.(\d+)/)
          if (match) return [1, parseInt(match[1]), parseInt(match[2])]
        }
        return [2, 0, 0]
      }
      const [prefixA, mainA, subA] = parseControlId(a.controlId)
      const [prefixB, mainB, subB] = parseControlId(b.controlId)
      if (prefixA !== prefixB) return prefixA - prefixB
      if (mainA !== mainB) return mainA - mainB
      return subA - subB
    }
    return (localControls || []).sort(sortControls)
  }, [localControls])

  const groupedControls = useMemo(() => {
    const getCategoryKey = (control: Control): string => {
      if (control.controlId.startsWith('A.')) return control.category || 'Other'
      if (/^\d+\.\d+$/.test(control.controlId)) return 'clauses'
      return 'Other'
    }
    
    return sortedControls.reduce((acc, control) => {
      const category = getCategoryKey(control)
      if (!acc[category]) acc[category] = []
      acc[category].push(control)
      return acc
    }, {} as Record<string, Control[]>)
  }, [sortedControls])

  const prevControlsRef = useRef<string>(JSON.stringify(controls || []))
  
  useEffect(() => {
    const safeControls = controls || []
    const controlsString = JSON.stringify(safeControls)
    if (prevControlsRef.current !== controlsString) {
      prevControlsRef.current = controlsString
      setLocalControls(safeControls)
    }
  }, [controls])
  
  return (
    <Accordion defaultValue={[]} className="space-y-4">
      {Object.entries(groupedControls).map(([category, categoryControls]) => {
        const lookupKey = category.replace('annex_a_', 'ANNEX_A_').toUpperCase() as keyof typeof CONTROL_CATEGORIES
        const categoryInfo = CONTROL_CATEGORIES[lookupKey]
        const displayName = categoryInfo?.name || category
        
        return (
        <AccordionItem key={category} value={category} className="border rounded-lg">
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center gap-3">
              <span className="font-semibold">{displayName}</span>
              <Badge variant="secondary">{categoryControls.length}</Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            {categoryInfo?.objective && (
              <p className="text-sm text-muted-foreground px-4 pb-3">{categoryInfo.objective}</p>
            )}
            <div className="grid gap-2 p-4 pt-0">
              {categoryControls.map(control => (
                <Card key={control.controlId} className="bg-muted/50">
                  <CardContent className="py-3">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-primary">{control.controlId}</span>
                          <span className="text-foreground">{control.label}</span>
                        </div>
                        {control.description && (
                          <p className="text-xs text-muted-foreground mt-1">{control.description}</p>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isWriter && (
                          <StatusSelect
                            value={control.status}
                            onChange={(val) => handleStatusChange(control.controlId, val)}
                            isPending={pendingControls.has(control.controlId)}
                          />
                        )}
                        
                        <Badge variant={
                          control.status === 'COMPLETED' ? 'default' :
                          control.status === 'IN_PROGRESS' ? 'secondary' :
                          control.status === 'NA' ? 'outline' :
                          'destructive'
                        }>
                          {control.status.replace('_', ' ')}
                        </Badge>
                        
                        <Dialog>
                          <DialogTrigger render={<Button variant="ghost" size="icon">
                            <Upload className="h-4 w-4" />
                          </Button>} />
                          <DialogContent>
                            <EvidenceUpload
                              controls={[control]}
                              companyKey={companyKey}
                              preselectedControl={control.controlId}
                            />
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        )
      })}
    </Accordion>
  )
}
