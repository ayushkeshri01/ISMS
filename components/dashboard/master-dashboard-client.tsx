"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ExportModal } from "@/components/dashboard/export-modal"
import { FileArchive } from "lucide-react"
import { COMPANY_KEYS } from "@/lib/constants"

interface MasterDashboardClientProps {
  companies: Array<{
    key: string
    name: string
    score: number
    statuses: Record<string, number>
    controls: Array<{ status: string; category: string }>
    history: Array<{ month: number; score: number }>
  }>
}

export function MasterDashboardClient({ companies }: MasterDashboardClientProps) {
  const [isExporting, setIsExporting] = useState(false)

  const downloadAllEvidence = async () => {
    setIsExporting(true)
    try {
      const response = await fetch("/api/export/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyKeys: COMPANY_KEYS })
      })

      if (!response.ok) throw new Error("Export failed")

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `isms-all-evidence-${new Date().toISOString().split('T')[0]}.zip`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Download failed:", error)
      alert("Failed to download evidence. Please try again.")
    }
    setIsExporting(false)
  }

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        className="gap-2"
        onClick={downloadAllEvidence}
        disabled={isExporting}
      >
        <FileArchive className="h-4 w-4" />
        {isExporting ? "Downloading..." : "Download All Evidence (ZIP)"}
      </Button>
      <ExportModal companies={companies} />
    </div>
  )
}
