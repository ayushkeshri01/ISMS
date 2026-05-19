"use client"

import { ExportModal } from "@/components/dashboard/export-modal"

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
  return (
    <div className="flex gap-2">
      <ExportModal companies={companies} />
    </div>
  )
}
