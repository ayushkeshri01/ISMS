"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, FileText, Upload, X, CalendarIcon, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import { formatDate, cn } from "@/lib/utils"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Certificate {
  id: string
  isActive: boolean
  body: string
  number: string
  validFrom: Date
  validTo: Date
  scope: string
  surveillanceAudit1?: Date | null
  surveillanceAudit2?: Date | null
  certificateFile?: string | null
}

interface Props {
  certificates?: Certificate[]
  companyKey: string
}

export function CertificateForm({ certificates = [], companyKey }: Props) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    body: "",
    number: "",
    validFrom: "",
    validTo: "",
    scope: "",
    isActive: false,
    surveillanceAudit1: "",
    surveillanceAudit2: "",
    certificateFile: null as File | null
  })
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB")
        return
      }
      setFormData(prev => ({ ...prev, certificateFile: selectedFile }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setUploading(true)
    
    try {
      let fileData = null
      let fileType = null
      
      if (formData.certificateFile) {
        const arrayBuffer = await formData.certificateFile.arrayBuffer()
        fileData = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
        fileType = formData.certificateFile.type
      }
      
      const res = await fetch("/api/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyKey,
          ...formData,
          surveillanceAudit1: formData.surveillanceAudit1 || null,
          surveillanceAudit2: formData.surveillanceAudit2 || null,
          fileData,
          fileType
        })
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }))
        toast.error("Failed: " + (err.error || "Server error"))
        return
      }
      
      toast.success("Certificate saved successfully!")
      setShowForm(false)
      setFormData({ body: "", number: "", validFrom: "", validTo: "", scope: "", isActive: false, surveillanceAudit1: "", surveillanceAudit2: "", certificateFile: null })
      router.refresh()
    } catch {
      toast.error("Failed to save certificate")
    } finally {
      setUploading(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ISO Certificates</CardTitle>
          <Button onClick={() => setShowForm(!showForm)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Certificate
          </Button>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certifying Body *</Label>
                  <Input
                    value={formData.body}
                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Certificate Number *</Label>
                  <Input
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valid From *</Label>
                  <Popover>
                    <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal", !formData.validFrom && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validFrom ? format(new Date(formData.validFrom + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.validFrom ? new Date(formData.validFrom + 'T00:00:00') : undefined}
                        onSelect={(date) => setFormData(prev => ({
                          ...prev,
                          validFrom: date ? format(date, "yyyy-MM-dd") : ""
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Valid To *</Label>
                  <Popover>
                    <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal", !formData.validTo && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.validTo ? format(new Date(formData.validTo + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.validTo ? new Date(formData.validTo + 'T00:00:00') : undefined}
                        onSelect={(date) => setFormData(prev => ({
                          ...prev,
                          validTo: date ? format(date, "yyyy-MM-dd") : ""
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Surveillance Audit 1 Date</Label>
                  <Popover>
                    <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal", !formData.surveillanceAudit1 && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.surveillanceAudit1 ? format(new Date(formData.surveillanceAudit1 + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.surveillanceAudit1 ? new Date(formData.surveillanceAudit1 + 'T00:00:00') : undefined}
                        onSelect={(date) => setFormData(prev => ({
                          ...prev,
                          surveillanceAudit1: date ? format(date, "yyyy-MM-dd") : ""
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label>Surveillance Audit 2 Date</Label>
                  <Popover>
                    <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal", !formData.surveillanceAudit2 && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.surveillanceAudit2 ? format(new Date(formData.surveillanceAudit2 + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.surveillanceAudit2 ? new Date(formData.surveillanceAudit2 + 'T00:00:00') : undefined}
                        onSelect={(date) => setFormData(prev => ({
                          ...prev,
                          surveillanceAudit2: date ? format(date, "yyyy-MM-dd") : ""
                        }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Scope *</Label>
                <Textarea
                  value={formData.scope}
                  onChange={(e) => setFormData(prev => ({ ...prev, scope: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Certificate PDF/Image</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.png,.jpg,.jpeg"
                  />
                  
                  {formData.certificateFile ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileText className="h-6 w-6 text-primary" />
                      <div className="text-left">
                        <p className="text-foreground font-medium">{formData.certificateFile.name}</p>
                        <p className="text-sm text-muted-foreground">{(formData.certificateFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFormData(prev => ({ ...prev, certificateFile: null })) }}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-muted-foreground text-sm">Click or drag to upload certificate</p>
                      <p className="text-xs text-muted-foreground mt-1">PDF, PNG, JPG up to 10MB</p>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: !!checked }))}
                />
                <Label htmlFor="isActive">Set as current active certificate</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); if (fileInputRef.current) fileInputRef.current.value = '' }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Saving..." : "Save Certificate"}
                </Button>
              </div>
            </form>
          )}
          
          <div className="space-y-3">
            {certificates.map(cert => (
              <Card key={cert.id} className={cert.isActive ? "border-primary/50" : ""}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{cert.body}</p>
                          {cert.isActive && (
                            <Badge>Active</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">#{cert.number}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(cert.validFrom)} - {formatDate(cert.validTo)}
                        </p>
                        {cert.surveillanceAudit1 && (
                          <p className="text-sm text-muted-foreground">Surveillance Audit 1: {formatDate(cert.surveillanceAudit1)}</p>
                        )}
                        {cert.surveillanceAudit2 && (
                          <p className="text-sm text-muted-foreground">Surveillance Audit 2: {formatDate(cert.surveillanceAudit2)}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">{cert.scope}</p>
                      </div>
                     </div>
                     <a
                       href={`/api/certificates/view/${cert.id}`}
                       target="_blank"
                       rel="noopener noreferrer"
                       className="inline-flex items-center justify-center h-8 w-8 rounded-md border border-input bg-background hover:bg-muted hover:text-foreground shrink-0"
                       title="View Certificate"
                     >
                       <ExternalLink className="h-4 w-4" />
                     </a>
                   </div>
                 </CardContent>
               </Card>
             ))}
            {certificates.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium mb-1">No certificates added yet</p>
                <p className="text-sm">Click &ldquo;Add Certificate&rdquo; to upload ISO certificates for this subsidiary.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
