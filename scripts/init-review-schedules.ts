import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

function determineFrequency(controlId: string, label: string, description: string | null, category: string): "QUARTERLY" | "ANNUAL" {
  const text = `${controlId} ${label} ${description ?? ""}`.toLowerCase()

  const quarterlyKeywords = [
    "threat intelligence", "access control", "identity management", "authentication",
    "access rights", "privileged access", "access restriction", "secure authentication",
    "capacity management", "malware", "technical vulnerabilities", "configuration management",
    "information deletion", "data masking", "data leakage", "backup", "redundancy",
    "logging", "monitoring", "clock synchronization", "privileged utility",
    "software installation", "network security", "network services", "segregation of network",
    "web filtering", "cryptography", "secure development", "application security",
    "secure system architecture", "secure coding", "security testing", "outsourced development",
    "separation of development", "change management", "test information", "audit testing",
    "end point device", "incident management", "incident response", "security events",
    "response to information", "learning from", "collection of evidence", "disruption",
    "business continuity", "ict readiness", "information security awareness", "event reporting",
    "physical security monitoring", "equipment maintenance", "secure disposal", "storage media",
    "assets off-premises", "clear desk", "physical entry", "physical security perimeter",
    "independent review", "compliance with policies", "supplier services",
  ]

  const annualKeywords = [
    "policy", "roles and responsibilities", "segregation of duties", "management responsibilities",
    "contact with authorities", "contact with special interest", "project management",
    "inventory", "acceptable use", "return of assets", "classification", "labelling",
    "information transfer", "supplier relationship", "supplier agreement", "supply chain",
    "cloud services", "legal", "statutory", "regulatory", "intellectual property",
    "protection of records", "privacy", "pii", "documented operating", "screening",
    "terms and conditions", "employment", "disciplinary", "termination", "confidentiality",
    "non-disclosure", "remote working", "securing offices", "working in secure areas",
    "equipment siting", "supporting utilities", "cabling security", "source code",
    "access to source code", "understanding the organisation", "needs and expectations",
    "determining the scope", "leadership and commitment", "organisational roles",
    "actions to address risks", "information security objectives", "resources", "competence",
    "communication", "operational planning", "risk assessment", "risk treatment",
    "continual improvement", "nonconformity", "corrective action", "internal audit",
    "management review", "information security policy",
  ]

  for (const keyword of quarterlyKeywords) {
    if (text.includes(keyword)) return "QUARTERLY"
  }
  for (const keyword of annualKeywords) {
    if (text.includes(keyword)) return "ANNUAL"
  }
  if (category === "annex_a_8") return "QUARTERLY"
  if (category === "clauses") return "ANNUAL"
  return "ANNUAL"
}

async function main() {
  console.log("Initializing review schedules for all companies…")

  const companies = await prisma.company.findMany()
  let totalCreated = 0
  let totalUpdated = 0

  for (const company of companies) {
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

    console.log(`  ${company.key}: ${created} created, ${updated} updated (${controls.length} controls)`)
    totalCreated += created
    totalUpdated += updated
  }

  console.log(`\nDone! Total: ${totalCreated} created, ${totalUpdated} updated across ${companies.length} companies`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
