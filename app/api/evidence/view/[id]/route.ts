import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // Validate ID format
  if (!id || typeof id !== 'string' || id.length > 50) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const evidence = await prisma.evidence.findUnique({
    where: { id },
    include: { company: true }
  })

  if (!evidence) {
    return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
  }

  // Check authorization: must belong to same company or be CIO
  if (evidence.company?.key !== session.user.companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Validate file data exists
  if (!evidence.fileData || evidence.fileData.length === 0) {
    return NextResponse.json({ error: "File data not found" }, { status: 404 })
  }

  const fileType = evidence.fileType || "application/octet-stream"
  
  // Limit inline viewing to safe types
  const INLINE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const disposition = INLINE_TYPES.includes(fileType) ? 'inline' : 'attachment'

  const buffer = Buffer.isBuffer(evidence.fileData) ? evidence.fileData : Buffer.from(evidence.fileData)
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': fileType,
      'Content-Disposition': `${disposition}; filename="${evidence.filename.substring(0, 100)}"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}
