import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const SAFE_DOWNLOAD_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'application/zip',
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const { id } = params
  
  if (!id || typeof id !== 'string' || id.length > 100) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }
  
  const evidence = await prisma.evidence.findUnique({
    where: { id },
    select: {
      id: true,
      filename: true,
      fileType: true,
      fileData: true,
      company: { select: { key: true } }
    }
  })
  
  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
  }
  
  if (!evidence.company || (evidence.company.key !== session.user.companyKey && session.user.role !== 'CIO')) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  
  if (!evidence.fileData || evidence.fileData.length === 0) {
    return NextResponse.json({ error: "File data not found" }, { status: 404 })
  }
  
  const fileType = SAFE_DOWNLOAD_TYPES.includes(evidence.fileType) 
    ? evidence.fileType 
    : 'application/octet-stream'
  
  const filename = evidence.filename
    .replace(/[\/\\]/g, '_')
    .substring(0, 255)
  
  return new NextResponse(new Uint8Array(evidence.fileData), {
    headers: {
      'Content-Type': fileType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'X-Content-Type-Options': 'nosniff',
      'Content-Length': evidence.fileData.length.toString()
    }
  })
}
