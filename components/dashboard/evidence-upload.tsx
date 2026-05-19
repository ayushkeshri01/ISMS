"use client"

import { useState, useRef } from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EVIDENCE_TYPES } from "@/lib/constants"
import { Upload, X, File, Search, CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Control {
  id: string
  controlId: string
  label: string
}

interface Props {
  controls: Control[]
  companyKey: string
  preselectedControl?: string
}

const ALLOWED_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
]

export function EvidenceUpload({ controls, companyKey, preselectedControl }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [formData, setFormData] = useState({
    controlId: preselectedControl || "",
    title: "",
    referenceNo: "",
    evidenceType: "",
    version: "",
    dateOfDocument: ""
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  const validateFile = (selectedFile: File): boolean => {
    if (selectedFile.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB")
      return false
    }
    if (!ALLOWED_MIMES.includes(selectedFile.type)) {
      toast.error("Invalid file type. Allowed: PDF, Word, Excel, Images.")
      return false
    }
    return true
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (validateFile(selectedFile)) {
        setFile(selectedFile)
      }
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile && validateFile(droppedFile)) {
      setFile(droppedFile)
    }
  }

  const handleSubmit = async () => {
    if (!file || !formData.controlId || !formData.evidenceType) {
      toast.error("Please fill all required fields")
      return
    }
    
    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    setUploading(true)
    setUploadProgress(0)
    
    try {
      // Convert file to base64 with progress tracking
      setUploadProgress(10)
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(',')[1]
          resolve(base64Data)
        }
        reader.onerror = () => reject(new Error("File reading failed"))
        reader.onprogress = (e) => {
          if (e.lengthComputable) {
            setUploadProgress(10 + Math.round((e.loaded / e.total) * 40))
          }
        }
        reader.readAsDataURL(file)
      })
      
      setUploadProgress(55)
      
      const timeoutId = setTimeout(() => abortRef.current?.abort(), 60000)
      
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyKey,
          controlId: formData.controlId,
          filename: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileData: base64,
          evidenceType: formData.evidenceType,
          title: formData.title,
          referenceNo: formData.referenceNo,
          version: formData.version,
          dateOfDocument: formData.dateOfDocument || null
        }),
        signal: abortRef.current.signal
      })
      
      clearTimeout(timeoutId)
      setUploadProgress(100)
      
      if (response.ok) {
        const result = await response.json()
        toast.success(result.duplicate ? "Evidence updated (re-upload)!" : "Evidence uploaded successfully!")
        setFile(null)
        setFormData({ controlId: "", title: "", referenceNo: "", evidenceType: "", version: "", dateOfDocument: "" })
        if (fileInputRef.current) fileInputRef.current.value = ''
      } else {
        const error = await response.json().catch(() => ({ error: "Unknown error" }))
        toast.error("Upload failed: " + (error.error || "Server error"))
      }
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        toast.error("Upload timed out. Please try again.")
      } else {
        toast.error("Upload error: " + (err instanceof Error ? err.message : "Unknown"))
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
      abortRef.current = null
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Upload className="h-5 w-5" />
          <span className="font-semibold">Upload Evidence</span>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Control *</Label>
              <Popover>
                <PopoverTrigger
                  render={<Button variant="outline" role="combobox" className="w-full justify-between" />}
                >
                  {formData.controlId
                    ? controls.find(c => c.controlId === formData.controlId)
                      ? `${controls.find(c => c.controlId === formData.controlId)!.controlId} - ${controls.find(c => c.controlId === formData.controlId)!.label}`
                      : formData.controlId
                    : "-- Select control --"}
                  <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <Command>
                    <CommandInput placeholder="Search controls..." />
                    <CommandList>
                      <CommandEmpty>No control found.</CommandEmpty>
                      <CommandGroup>
                        {controls.map(c => (
                          <CommandItem
                            key={c.controlId}
                            value={`${c.controlId} ${c.label}`}
                            onSelect={() => setFormData(prev => ({ ...prev, controlId: c.controlId }))}
                          >
                            <span className="font-mono text-xs">{c.controlId}</span>
                            <span className="ml-2">{c.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          
            <div className="space-y-2">
              <Label>Evidence Type *</Label>
              <Select
                value={formData.evidenceType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, evidenceType: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- Select type --" />
                </SelectTrigger>
                <SelectContent>
                  {EVIDENCE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selected: {formData.evidenceType || "none"}</p>
            </div>
          
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Document title"
              />
            </div>
          
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                value={formData.referenceNo}
                onChange={(e) => setFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                placeholder="Doc/Ref number"
              />
            </div>
          
            <div className="space-y-2">
              <Label>Version/Remarks</Label>
              <Input
                value={formData.version}
                onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                placeholder="v1.0"
              />
            </div>
          
            <div className="space-y-2">
              <Label>Date of Document</Label>
              <Popover>
                <PopoverTrigger className={cn(buttonVariants({ variant: "outline" }), "w-full justify-start text-left font-normal", !formData.dateOfDocument && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.dateOfDocument ? format(new Date(formData.dateOfDocument + 'T00:00:00'), "PPP") : <span>Pick a date</span>}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.dateOfDocument ? new Date(formData.dateOfDocument + 'T00:00:00') : undefined}
                    onSelect={(date) => setFormData(prev => ({
                      ...prev,
                      dateOfDocument: date ? format(date, "yyyy-MM-dd") : ""
                    }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div
            className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
            />
            
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <File className="h-8 w-8 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Drag & drop or click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images up to 5MB</p>
              </>
            )}
          </div>
          
          {uploading && (
            <div className="space-y-1">
              <div className="w-full bg-muted rounded-full h-2.5">
                <div
                  className="bg-primary h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">{uploadProgress}%</p>
            </div>
          )}
          <Button
            className="w-full"
            disabled={!file || !formData.controlId || !formData.evidenceType || uploading}
            onClick={handleSubmit}
          >
            {uploading ? "Uploading..." : "Upload Evidence"}
          </Button>
        </div>
      </div>
    </div>
  )
}
