import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"

function determineFrequency(controlId: string, label: string, description: string | null, category: string): "QUARTERLY" | "ANNUAL" {
  const text = `${controlId} ${label} ${description ?? ""}`.toLowerCase()

  const quarterlyKeywords = [
    "threat intelligence",
    "access control",
    "identity management",
    "authentication",
    "access rights",
    "privileged access",
    "access restriction",
    "secure authentication",
    "capacity management",
    "malware",
    "technical vulnerabilities",
    "configuration management",
    "information deletion",
    "data masking",
    "data leakage",
    "backup",
    "redundancy",
    "logging",
    "monitoring",
    "clock synchronization",
    "privileged utility",
    "software installation",
    "network security",
    "network services",
    "segregation of network",
    "web filtering",
    "cryptography",
    "secure development",
    "application security",
    "secure system architecture",
    "secure coding",
    "security testing",
    "outsourced development",
    "separation of development",
    "change management",
    "test information",
    "audit testing",
    "end point device",
    "incident management",
    "incident response",
    "security events",
    "response to information",
    "learning from",
    "collection of evidence",
    "disruption",
    "business continuity",
    "ict readiness",
    "information security awareness",
    "event reporting",
    "physical security monitoring",
    "equipment maintenance",
    "secure disposal",
    "storage media",
    "assets off-premises",
    "clear desk",
    "physical entry",
    "physical security perimeter",
    "independent review",
    "compliance with policies",
    "supplier services",
    "monitoring.*review.*supplier",
  ]

  const annualKeywords = [
    "policy",
    "roles and responsibilities",
    "segregation of duties",
    "management responsibilities",
    "contact with authorities",
    "contact with special interest",
    "project management",
    "inventory",
    "acceptable use",
    "return of assets",
    "classification",
    "labelling",
    "information transfer",
    "supplier relationship",
    "supplier agreement",
    "supply chain",
    "cloud services",
    "legal",
    "statutory",
    "regulatory",
    "intellectual property",
    "protection of records",
    "privacy",
    "pii",
    "documented operating",
    "screening",
    "terms and conditions",
    "employment",
    "disciplinary",
    "termination",
    "confidentiality",
    "non-disclosure",
    "remote working",
    "securing offices",
    "physical.*environmental",
    "working in secure areas",
    "equipment siting",
    "supporting utilities",
    "cabling security",
    "source code",
    "access to source code",
    "understanding the organisation",
    "needs and expectations",
    "determining the scope",
    "leadership and commitment",
    "organisational roles",
    "actions to address risks",
    "information security objectives",
    "resources",
    "competence",
    "communication",
    "operational planning",
    "risk assessment",
    "risk treatment",
    "continual improvement",
    "nonconformity",
    "corrective action",
    "internal audit",
    "management review",
    "information security policy",
  ]

  for (const keyword of quarterlyKeywords) {
    if (keyword.includes("*")) {
      const pattern = new RegExp(keyword.replace(/\.\*/g, ".*"), "i")
      if (pattern.test(text)) return "QUARTERLY"
    } else if (text.includes(keyword)) {
      return "QUARTERLY"
    }
  }

  for (const keyword of annualKeywords) {
    if (keyword.includes("*")) {
      const pattern = new RegExp(keyword.replace(/\.\*/g, ".*"), "i")
      if (pattern.test(text)) return "ANNUAL"
    } else if (text.includes(keyword)) {
      return "ANNUAL"
    }
  }

  if (category === "annex_a_8") return "QUARTERLY"
  if (category === "clauses") return "ANNUAL"

  return "ANNUAL"
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const companyKey = searchParams.get("companyKey")

  if (!companyKey || !COMPANY_KEYS.includes(companyKey as (typeof COMPANY_KEYS)[number])) {
    return NextResponse.json({ error: "Invalid company key" }, { status: 400 })
  }

  if (session.user.companyKey !== companyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const company = await prisma.company.findUnique({ where: { key: companyKey } })
  if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 })

  const controls = await prisma.control.findMany({
    where: { companyId: company.id },
    orderBy: { controlId: "asc" },
  })

  let created = 0
  let updated = 0

  for (const control of controls) {
    const suggested = determineFrequency(control.controlId, control.label, control.description, control.category)
    const existing = await prisma.reviewSchedule.findUnique({
      where: { controlId_companyId: { controlId: control.id, companyId: company.id } },
    })

    if (existing) {
      if (!existing.suggestedFrequency) {
        await prisma.reviewSchedule.update({
          where: { id: existing.id },
          data: { suggestedFrequency: suggested },
        })
        updated++
      }
    } else {
      await prisma.reviewSchedule.create({
        data: {
          controlId: control.id,
          companyId: company.id,
          frequency: suggested,
          suggestedFrequency: suggested,
        },
      })
      created++
    }
  }

  const total = await prisma.reviewSchedule.count({
    where: { companyId: company.id },
  })

  return NextResponse.json({ success: true, created, updated, total })
}
