import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS, EVIDENCE_TYPES } from "@/lib/constants"

const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/jpeg',
  'image/png',
  'image/gif'
]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

// GET - Fetch evidence for a company
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get('companyKey')
  
  if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }
  
  // Check if user belongs to this company or is CIO
  if (session.user.companyKey !== companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  const evidence = await prisma.evidence.findMany({
    where: { company: { key: companyKey } },
    include: { control: true },
    orderBy: { createdAt: 'desc' }
  })
  
  return NextResponse.json({ evidence })
}

// POST - Upload evidence
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  try {
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { companyKey, controlId, filename, fileType, fileSize, fileData, evidenceType, title, referenceNo, version } = body
    
    // Validate inputs
    if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
      return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
    }
    
    if (!controlId || typeof controlId !== 'string' || controlId.length > 50) {
      return NextResponse.json({ error: "Invalid control ID" }, { status: 400 })
    }
    
    if (!filename || typeof filename !== 'string' || filename.length > 255) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 })
    }
    
    if (!ALLOWED_FILE_TYPES.includes(fileType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 })
    }
    
    if (typeof fileSize !== 'number' || fileSize > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File too large. Maximum 5MB." }, { status: 400 })
    }
    
    if (!EVIDENCE_TYPES.includes(evidenceType)) {
      return NextResponse.json({ error: "Invalid evidence type" }, { status: 400 })
    }
    
    if (session.user.companyKey !== companyKey && session.user.role !== 'CIO') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    
    const company = await prisma.company.findUnique({
      where: { key: companyKey }
    })
    
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }
    
    const control = await prisma.control.findFirst({
      where: { controlId, companyId: company.id }
    })
    
    if (!control) {
      return NextResponse.json({ error: "Control not found" }, { status: 404 })
    }
    
    let bytes: Buffer
    try {
      if (!fileData || typeof fileData !== 'string') {
        return NextResponse.json({ error: "Invalid file data" }, { status: 400 })
      }
      bytes = Buffer.from(fileData, 'base64')
      
      if (bytes.length !== fileSize) {
        return NextResponse.json({ error: "File size mismatch" }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: "Invalid file data" }, { status: 400 })
    }
    
    const evidence = await prisma.evidence.create({
      data: {
        controlId: control.id,
        companyId: company.id,
        filename: filename.substring(0, 255),
        fileType: fileType.substring(0, 100),
        fileSize: Math.min(fileSize, MAX_FILE_SIZE),
        fileData: bytes,
        evidenceType: evidenceType.substring(0, 50),
        title: title ? title.substring(0, 200) : null,
        referenceNo: referenceNo ? referenceNo.substring(0, 100) : null,
        version: version ? version.substring(0, 50) : null,
        status: 'PENDING',
        uploadedById: session.user.id,
        uploadedByName: session.user.name || ''
      }
    })
    
    try {
      await prisma.activityLog.create({
        data: {
          companyKey,
          userId: session.user.id,
          userName: session.user.name || '',
          userRole: session.user.role,
          action: 'EVIDENCE_UPLOAD',
          controlId,
          details: filename
        }
      })
    } catch (err) {
      console.error('Activity log error:', err)
    }
    
    return NextResponse.json({ success: true, evidence: { id: evidence.id, filename: evidence.filename } })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
