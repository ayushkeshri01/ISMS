"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, ExternalLink, Inbox, Loader2 } from "lucide-react"
import { STATUS_COLORS } from "@/lib/constants"

interface MyEvidence {
  id: string
  filename: string
  fileType: string
  evidenceType: string
  status: string
  createdAt: string
  controlId: string
  control?: { controlId: string; label: string }
  reviewNote?: string | null
  reviewedAt?: string | null
}

interface Props {
  companyKey: string
}

export function MyUploads({ companyKey }: Props) {
  const [evidence, setEvidence] = useState<MyEvidence[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setLoading(true)
  }

  useEffect(() => {
    fetch(`/api/evidence?companyKey=${companyKey}&uploadedByMe=true&page=${page}`)
      .then(res => res.json())
      .then(data => {
        setEvidence(data.evidence || [])
        setTotalPages(data.pagination?.totalPages || 1)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [companyKey, page])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Inbox className="h-12 w-12 mx-auto mb-3 opacity-40" />
        <p className="font-medium mb-1">No uploads yet</p>
        <p className="text-sm">Upload evidence in the Controls or Docs tab first.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {evidence.map(item => (
        <Card key={item.id} className="bg-muted/50">
          <CardContent className="py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{item.filename}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {item.control?.controlId} - {item.control?.label}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <Badge variant="outline" className="text-xs">{item.evidenceType}</Badge>
                    <Badge variant={STATUS_COLORS[item.status] || "secondary"}>
                      {item.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {item.reviewNote && (
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Review note: {item.reviewNote}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={`/api/evidence/view/${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-muted hover:text-foreground shrink-0"
                title="View Document"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </CardContent>
        </Card>
      ))}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => handlePageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => handlePageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
