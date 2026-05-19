import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Only specific roles can review
  const VALID_REVIEWERS = ['CIO', 'IT_MANAGER', 'STQM_MANAGER', 'HR_MANAGER']
  if (!VALID_REVIEWERS.includes(session.user.role as typeof VALID_REVIEWERS[number])) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    const { evidenceId, status, reviewNote } = body

    if (!evidenceId || typeof evidenceId !== 'string' || evidenceId.length > 50) {
      return NextResponse.json({ error: "Invalid evidence ID" }, { status: 400 })
    }

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    if (status === 'REJECTED' && (!reviewNote || typeof reviewNote !== 'string' || reviewNote.trim().length === 0)) {
      return NextResponse.json({ error: "Reason required for rejection" }, { status: 400 })
    }

    const evidence = await prisma.evidence.findUnique({
      where: { id: evidenceId },
      include: { control: { include: { company: true } } }
    })

    if (!evidence) {
      return NextResponse.json({ error: "Evidence not found" }, { status: 404 })
    }

    // Check authorization: must belong to same company or be CIO
    const companyKey = evidence.control?.company?.key
    if (companyKey !== session.user.companyKey && session.user.role !== 'CIO') {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.evidence.update({
      where: { id: evidenceId },
      data: {
        status,
        reviewedById: session.user.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote ? reviewNote.substring(0, 500) : null
      }
    })

    try {
      await prisma.activityLog.create({
        data: {
          companyKey: companyKey || '',
          userId: session.user.id,
          userName: session.user.name || '',
          userRole: session.user.role,
          action: `EVIDENCE_${status}`,
          controlId: evidence.controlId,
          details: reviewNote ? reviewNote.substring(0, 500) : null
        }
      })
    } catch (err) {
      console.error('Activity log error:', err)
    }

    if (evidence.uploadedById) {
      try {
        const statusText = status === 'APPROVED' ? 'approved' : 'rejected'
        await prisma.notification.create({
          data: {
            userId: evidence.uploadedById,
            type: `evidence_${statusText}`,
            message: `Your evidence "${evidence.filename.substring(0, 100)}" has been ${statusText} by ${session.user.name}.${reviewNote ? ` Reason: ${reviewNote.substring(0, 200)}` : ''}`,
          }
        })
      } catch (err) {
        console.error('Failed to create notification:', err)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Review error:', error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
