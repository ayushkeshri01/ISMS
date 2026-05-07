import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { COMPANY_KEYS } from "@/lib/constants"
import { SubsidiaryDashboardClient } from "@/components/dashboard/subsidiary-dashboard-client"

async function getCompanyData(companyKey: string, userId: string, userRole: string, department: string, userCompanyKey: string | null) {
  const company = await prisma.company.findUnique({
    where: { key: companyKey },
    include: {
      controls: {
        orderBy: { controlId: 'asc' }
      },
      complianceHistory: {
        orderBy: [{ year: 'asc' }, { month: 'asc' }]
      },
      evidence: {
        include: {
          control: true
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      },
      certificates: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })
  
  if (!company) return null
  
  // Group-level users (CIO, etc.) have companyKey: null and can see all controls
  // Company-specific users have a companyKey and may need filtering by department
  let filteredControls = company.controls
  
  // Filter for company-specific users (those with a companyKey)
  if (userCompanyKey !== null) {
    const MAKER_ROLES = ['IT_EXECUTIVE', 'HR_EXECUTIVE']
    const FULL_ACCESS_MANAGER_ROLES = ['CIO', 'IT_MANAGER', 'STQM_MANAGER']
    const DEPARTMENT_MANAGER_ROLES = ['HR_MANAGER', 'ADMIN_FACILITIES', 'LEGAL']

    if (MAKER_ROLES.includes(userRole)) {
      // Maker roles see all controls for their company
      filteredControls = company.controls
    } else if (FULL_ACCESS_MANAGER_ROLES.includes(userRole)) {
      // Manager roles (CIO, IT_MANAGER, STQM_MANAGER) see all controls for their company
      filteredControls = company.controls
    } else if (DEPARTMENT_MANAGER_ROLES.includes(userRole)) {
      // Department managers see controls based on their department
      filteredControls = company.controls.filter(c =>
        c.category === 'IT' && department === 'IT' ||
        c.category === 'HR' && department === 'HR' ||
        c.category === 'STQM' && department === 'STQM'
      )
    } else {
      // Other roles see controls based on their department
      filteredControls = company.controls.filter(c =>
        c.category === 'IT' && department === 'IT' ||
        c.category === 'HR' && department === 'HR' ||
        c.category === 'STQM' && department === 'STQM'
      )
    }
  }
   
  const activityLogs = await prisma.activityLog.findMany({
    where: { companyKey },
    orderBy: { createdAt: 'desc' },
    take: 100
  })
  
  return {
    company,
    controls: filteredControls,
    allControls: company.controls,
    activityLogs
  }
}

export default async function SubsidiaryDashboardPage({ 
  params 
}: { 
  params: { company: string } 
}) {
  const { company: companyKey } = params
  const normalizedKey = companyKey.toLowerCase()
  const session = await auth()
  
  if (!session) redirect("/login")
  
  const validKeys = COMPANY_KEYS.map(k => k.toLowerCase())
  if (!validKeys.includes(normalizedKey)) {
    redirect("/dashboard/master")
  }
  
  const data = await getCompanyData(
    normalizedKey,
    session.user.id,
    session.user.role,
    session.user.department,
    session.user.companyKey
  )
  
  if (!data) notFound()
  
  return (
    <SubsidiaryDashboardClient
      companyKey={normalizedKey}
      company={data.company}
      controls={data.controls}
      allControls={data.allControls}
      activityLogs={data.activityLogs}
      userRole={session.user.role}
      userTabs={session.user.tabs}
    />
  )
}
