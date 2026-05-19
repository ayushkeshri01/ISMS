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

  if (!id || typeof id !== 'string' || id.length > 50) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const certificate = await prisma.certificate.findUnique({
    where: { id },
    include: { company: true }
  })

  if (!certificate) {
    return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
  }

  if (certificate.company?.key !== session.user.companyKey && session.user.role !== 'CIO') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (!certificate.fileData || certificate.fileData.length === 0) {
    return NextResponse.json({ error: "No file attached to this certificate" }, { status: 404 })
  }

  const fileType = certificate.fileType || "application/octet-stream"

  return new NextResponse(certificate.fileData.buffer.slice(certificate.fileData.byteOffset, certificate.fileData.byteOffset + certificate.fileData.byteLength) as ArrayBuffer, {
    headers: {
      'Content-Type': fileType,
      'Content-Disposition': `inline; filename="certificate-${certificate.number}.pdf"`,
      'Cache-Control': 'private, max-age=3600',
      'X-Content-Type-Options': 'nosniff'
    }
  })
}
