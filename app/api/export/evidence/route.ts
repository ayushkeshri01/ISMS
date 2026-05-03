import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import JSZip from "jszip"
import { COMPANY_KEYS } from "@/lib/constants"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    
    const companyKeys = Array.isArray(body.companyKeys) 
      ? body.companyKeys.filter((k: unknown): k is typeof COMPANY_KEYS[number] => 
          typeof k === 'string' && COMPANY_KEYS.includes(k as (typeof COMPANY_KEYS)[number]))
      : []
    
    const allowedKeys = session.user.role === 'CIO' 
      ? companyKeys 
      : companyKeys.filter((k: string) => k === session.user.companyKey)
    
    if (allowedKeys.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const evidence = await prisma.evidence.findMany({
      where: allowedKeys.length > 0 ? {
        company: { key: { in: allowedKeys } }
      } : {},
      include: {
        control: true,
        company: true
      },
      orderBy: [
        { company: { key: 'asc' }},
        { controlId: 'asc' }
      ]
    })
    
    if (evidence.length === 0) {
      return NextResponse.json({ error: "No evidence found" }, { status: 404 })
    }

    const zip = new JSZip()
    
    for (const item of evidence) {
      try {
        const companyKey = item.company?.key || 'unknown'
        const companyFolder = zip.folder(companyKey)
        const controlFolder = companyFolder?.folder(item.controlId.replace(/\./g, '-'))
        
        if (item.fileData && item.fileData.length > 0) {
          const fileName = `${item.controlId}_${item.id}_${(item.filename || 'file').substring(0, 100)}`
          controlFolder?.file(fileName, Buffer.from(item.fileData))
        }
      } catch (err) {
        console.error(`Failed to add evidence ${item.id}:`, err)
      }
    }
    
    const content = await zip.generateAsync({ type: "arraybuffer" })
    
    return new NextResponse(content, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="isms-evidence-${new Date().toISOString().split('T')[0]}.zip"`,
        "Content-Length": content.byteLength.toString()
      }
    })
    
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Failed to export evidence" }, { status: 500 })
  }
}
