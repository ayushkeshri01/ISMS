"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, FileArchive } from "lucide-react"

type ExportType = "scores" | "monthly" | "yearly" | "evidence" | "full"

interface ExportModalProps {
  companies: Array<{
    key: string
    name: string
    score: number
    statuses: Record<string, number>
    history?: Array<{ month: number; score: number }>
  }>
}

export function ExportModal({ companies }: ExportModalProps) {
  const [open, setOpen] = useState(false)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(companies.map(c => c.key))
  const [exportType, setExportType] = useState<ExportType>("full")
  const [isExporting, setIsExporting] = useState(false)

  const toggleCompany = (key: string) => {
    setSelectedCompanies(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    )
  }

  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      if (exportType === "evidence" || exportType === "full") {
        await exportAllEvidence()
      } else {
        const data = companies.filter(c => selectedCompanies.includes(c.key))
        
        switch (exportType) {
          case "scores":
            exportScores(data)
            break
          case "monthly":
            exportMonthlyTrend()
            break
          case "yearly":
            exportYearlySummary()
            break
        }
      }
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    }
    
    setIsExporting(false)
    setOpen(false)
  }

  const exportAllEvidence = async () => {
    const response = await fetch("/api/export/evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyKeys: selectedCompanies })
    })
    
    if (!response.ok) {
      throw new Error("Failed to export evidence")
    }
    
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `isms-evidence-${new Date().toISOString().split('T')[0]}.zip`
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportScores = (data: typeof companies) => {
    const csv = [
      ["Company", "Score", "Completed", "In Progress", "Not Started"].join(","),
      ...data.map(c => [
        c.key.toUpperCase(),
        c.score,
        c.statuses.COMPLETED || 0,
        c.statuses.IN_PROGRESS || 0,
        c.statuses.NOT_STARTED || 0
      ].join(","))
    ].join("\n")
    
    downloadCSV(csv, "isms-compliance-scores.csv")
  }
  
  const months = Array.from({ length: 12 }, (_, i) => i + 1)
  
  const exportMonthlyTrend = () => {
    const csv = [
      ["Company", "Month", "Score", "Completed", "In Progress", "Not Started"].join(","),
      ...companies.map(c => [
        c.key.toUpperCase(),
        ...months.map(m => {
          const monthData = c.history?.find((h: { month: number }) => h.month === m)
          return monthData ? monthData.score : ""
        })
      ].join(","))
    ].join("\n")
    downloadCSV(csv, "isms-monthly-trend.csv")
  }
  
  const exportYearlySummary = () => {
    const csv = [
      ["Company", "Year", "Average Score", "Total Controls", "Highest Score", "Lowest Score"].join(","),
      ...companies.map(c => [
        c.key.toUpperCase(),
        new Date().getFullYear(),
        c.score,
        Object.values(c.statuses).reduce((a, b) => a + b, 0),
        c.score,
        c.score
      ].join(","))
    ].join("\n")
    downloadCSV(csv, "isms-yearly-summary.csv")
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Download Report
      </Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Compliance Report</DialogTitle>
          <DialogDescription>Select companies and report type to export</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Export Type</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={exportType === "full" ? "default" : "outline"}
                size="sm"
                className="col-span-2"
                onClick={() => setExportType("full")}
              >
                <FileArchive className="h-4 w-4 mr-2" />
                All Evidence (ZIP)
              </Button>
              <Button
                variant={exportType === "scores" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("scores")}
              >
                Compliance Scores
              </Button>
              <Button
                variant={exportType === "monthly" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("monthly")}
              >
                Monthly Trend
              </Button>
              <Button
                variant={exportType === "yearly" ? "default" : "outline"}
                size="sm"
                onClick={() => setExportType("yearly")}
              >
                Yearly Summary
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Companies</Label>
            <div className="space-y-2">
              {companies.map(company => (
                <div key={company.key} className="flex items-center gap-2">
                  <Checkbox
                    id={company.key}
                    checked={selectedCompanies.includes(company.key)}
                    onCheckedChange={() => toggleCompany(company.key)}
                  />
                  <Label htmlFor={company.key} className="cursor-pointer">
                    {company.key.toUpperCase()} - {company.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleExport} disabled={selectedCompanies.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
