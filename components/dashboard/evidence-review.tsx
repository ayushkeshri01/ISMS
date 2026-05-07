"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { FileText, Check, X, Eye, ExternalLink } from "lucide-react"

interface Evidence {
  id: string
  filename: string
  fileType: string
  evidenceType: string
  status: string
  createdAt: Date
  uploadedByName: string
  controlId: string
  control?: { controlId: string; label: string }
}

interface Props {
  evidence?: Evidence[]
  companyKey?: string
}

export function EvidenceReview({ evidence = [] }: Props) {
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null)
  const [reviewNote, setReviewNote] = useState("")
  
  const pending = evidence.filter(e => e.status === 'PENDING')
  const approved = evidence.filter(e => e.status === 'APPROVED')
  const rejected = evidence.filter(e => e.status === 'REJECTED')
  
  const handleReview = async (evidenceId: string, decision: 'APPROVED' | 'REJECTED') => {
    if (decision === 'REJECTED' && !reviewNote.trim()) {
      alert("Please provide a reason for rejection")
      return
    }
    
    await fetch("/api/evidence/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        evidenceId,
        status: decision,
        reviewNote
      })
    })
    
    setSelectedEvidence(null)
    setReviewNote("")
    window.location.reload()
  }
  
  const EvidenceCard = ({ item }: { item: Evidence }) => (
    <Card className="bg-muted/50">
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
                <span className="text-xs text-muted-foreground">by {item.uploadedByName}</span>
                <Badge variant={
                  item.status === 'APPROVED' ? 'default' :
                  item.status === 'REJECTED' ? 'destructive' :
                  'secondary'
                }>
                  {item.status}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1 shrink-0">
            <a
              href={`/api/evidence/view/${item.id}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View Document"
              className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
            {item.status === 'PENDING' && (
              <Button variant="ghost" size="icon" onClick={() => setSelectedEvidence(item)}>
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
  
  return (
    <div className="space-y-4">
      {evidence.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p className="mb-2">No evidence uploaded yet</p>
          <p className="text-sm">Upload evidence in the &quot;Docs&quot; tab first.</p>
        </div>
      )}
      
      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approved ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({rejected.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {evidence.length === 0 ? "No evidence uploaded yet. Upload evidence first." : "No pending evidence to review"}
            </p>
          ) : (
            pending.map(e => <EvidenceCard key={e.id} item={e} />)
          )}
        </TabsContent>
        
        <TabsContent value="approved" className="space-y-3">
          {approved.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No approved evidence</p>
          ) : (
            approved.map(e => <EvidenceCard key={e.id} item={e} />)
          )}
        </TabsContent>
        
        <TabsContent value="rejected" className="space-y-3">
          {rejected.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No rejected evidence</p>
          ) : (
            rejected.map(e => <EvidenceCard key={e.id} item={e} />)
          )}
        </TabsContent>
      </Tabs>
      
      {selectedEvidence && (
        <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] flex flex-col">
            <CardHeader>
              <CardTitle>Review Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">File</p>
                  <p className="text-foreground">{selectedEvidence.filename}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Control</p>
                  <p className="text-foreground">{selectedEvidence.control?.controlId} - {selectedEvidence.control?.label}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded By</p>
                  <p className="text-foreground">{selectedEvidence.uploadedByName}</p>
                </div>
                <div>
                  <a
                    href={`/api/evidence/view/${selectedEvidence.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground mt-5"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open Full Document
                  </a>
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden bg-muted/30" style={{ height: '400px' }}>
                <iframe
                  src={`/api/evidence/view/${selectedEvidence.id}`}
                  className="w-full h-full"
                  title={selectedEvidence.filename}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Review Note {selectedEvidence.status === 'PENDING' && '(required for rejection)'}</Label>
                <Textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add your review note..."
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setSelectedEvidence(null); setReviewNote("") }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => handleReview(selectedEvidence.id, 'REJECTED')}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  variant="default"
                  onClick={() => handleReview(selectedEvidence.id, 'APPROVED')}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
