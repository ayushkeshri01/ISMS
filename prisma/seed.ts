import "dotenv/config"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const CLAUSE_CONTROLS = [
  { controlId: "4.1", label: "Understanding the organisation and its context", description: "The organisation shall determine external and internal issues that are relevant to its purpose and that affect the achievement of its information security objectives.", category: "clauses", subCategory: "Context" },
  { controlId: "4.2", label: "Understanding the needs and expectations of interested parties", description: "The organisation shall determine the interested parties that are relevant to the information security management system and the requirements of these interested parties.", category: "clauses", subCategory: "Context" },
  { controlId: "4.3", label: "Determining the scope of the ISMS", description: "The organisation shall determine the boundaries and applicability of the information security management system to establish its scope.", category: "clauses", subCategory: "Context" },
  { controlId: "4.4", label: "Information security management system", description: "The organisation shall establish, implement, maintain and continually improve an information security management system.", category: "clauses", subCategory: "Context" },
  { controlId: "5.1", label: "Leadership and commitment", description: "Top management shall demonstrate leadership and commitment with respect to the information security management system.", category: "clauses", subCategory: "Leadership" },
  { controlId: "5.2", label: "Information security policy", description: "A policy for information security shall be defined, approved by management, published and communicated to and acknowledged by relevant personnel.", category: "clauses", subCategory: "Leadership" },
  { controlId: "5.3", label: "Organisational roles, responsibilities and authorities", description: "Top management shall ensure that responsibilities and authorities for roles relevant to information security are assigned and communicated.", category: "clauses", subCategory: "Leadership" },
  { controlId: "6.1", label: "Actions to address risks and opportunities", description: "The organisation shall plan actions to address information security risks and opportunities.", category: "clauses", subCategory: "Planning" },
  { controlId: "6.2", label: "Information security objectives and planning to achieve them", description: "The organisation shall establish information security objectives and plan how to achieve them.", category: "clauses", subCategory: "Planning" },
  { controlId: "7.1", label: "Resources", description: "The organisation shall determine and provide the resources needed for the establishment, implementation, maintenance and continual improvement of the ISMS.", category: "clauses", subCategory: "Support" },
  { controlId: "7.2", label: "Competence", description: "The organisation shall ensure that personnel are competent on the basis of appropriate education, training or experience.", category: "clauses", subCategory: "Support" },
  { controlId: "7.3", label: "Awareness", description: "Personnel shall be aware of the information security policy and their contributions to the effectiveness of the ISMS.", category: "clauses", subCategory: "Support" },
  { controlId: "7.4", label: "Communication", description: "The organisation shall determine the relevant internal and external communications relevant to the ISMS.", category: "clauses", subCategory: "Support" },
  { controlId: "7.5", label: "Documented information", description: "The organisation shall create and update documented information as required and ensure they are protected.", category: "clauses", subCategory: "Support" },
  { controlId: "8.1", label: "Operational planning and control", description: "The organisation shall plan, implement and control the processes needed to meet information security requirements.", category: "clauses", subCategory: "Operation" },
  { controlId: "8.2", label: "Information security risk assessment", description: "The organisation shall perform information security risk assessments at planned intervals.", category: "clauses", subCategory: "Operation" },
  { controlId: "8.3", label: "Information security risk treatment", description: "The organisation shall implement information security risk treatment plans.", category: "clauses", subCategory: "Operation" },
  { controlId: "9.1", label: "Monitoring, measurement, analysis and evaluation", description: "The organisation shall evaluate the information security performance and the effectiveness of the ISMS.", category: "clauses", subCategory: "Performance" },
  { controlId: "9.2", label: "Internal audit", description: "The organisation shall conduct internal audits at planned intervals.", category: "clauses", subCategory: "Performance" },
  { controlId: "9.3", label: "Management review", description: "Top management shall review the organisation's ISMS at planned intervals.", category: "clauses", subCategory: "Performance" },
  { controlId: "10.1", label: "Continual improvement", description: "The organisation shall continually improve the suitability, adequacy and effectiveness of the ISMS.", category: "clauses", subCategory: "Improvement" },
  { controlId: "10.2", label: "Nonconformity and corrective action", description: "The organisation shall react to nonconformities and take corrective actions.", category: "clauses", subCategory: "Improvement" },
]

const ANNEX_A_5_CONTROLS = [
  { controlId: "A.5.1", label: "Policies for Information Security", description: "Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant interested parties, and reviewed at planned intervals and if significant changes occur.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.2", label: "Information security roles and responsibilities", description: "Information security roles and responsibilities shall be defined and allocated according to the organization needs.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.3", label: "Segregation of duties", description: "Conflicting duties and conflicting areas of responsibility shall be segregated.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.4", label: "Management responsibilities", description: "Management shall require all personnel to apply information security in accordance with the established information security policy, topic-specific policies and procedures of the organization.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.5", label: "Contact with authorities", description: "The organization shall establish and maintain contact with relevant authorities.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.6", label: "Contact with special interest groups", description: "The organization shall establish and maintain contact with special interest groups or other specialist security forums and professional associations.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.7", label: "Threat intelligence", description: "Information relating to information security threats shall be collected and analysed to produce threat intelligence.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.8", label: "Information security in project management", description: "Information security shall be integrated into project management.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.9", label: "Inventory of information and other associated assets", description: "An inventory of information and other associated assets, including owners, shall be developed and maintained.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.10", label: "Acceptable use of information and other associated assets", description: "Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.11", label: "Return of assets", description: "Personnel and other interested parties as appropriate shall return all the organization's assets in their possession upon change or termination of their employment, contract or agreement.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.12", label: "Classification of information", description: "Information shall be classified according to the information security needs of the organization based on confidentiality, integrity, availability and relevant interested party requirements.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.13", label: "Labelling of information", description: "An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.14", label: "Information transfer", description: "Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.15", label: "Access Control", description: "Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.16", label: "Identity Management", description: "The full life cycle of identities shall be managed.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.17", label: "Authentication Information", description: "Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.18", label: "Access Rights", description: "Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization's topic-specific policy on and rules for access control.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.19", label: "Information security in supplier relationships", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier's products or services.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.20", label: "Addressing information security within supplier agreements", description: "Relevant information security requirements shall be established and agreed with each supplier based on the type of supplier relationship.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.21", label: "Managing information security in the ICT Supply chain", description: "Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.22", label: "Monitoring, review and change management of supplier services", description: "The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.23", label: "Information Security for use of cloud service", description: "Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization's information security requirements.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.24", label: "Information security incident management planning and preparation", description: "The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.25", label: "Assessment and decision on information security events", description: "The organization shall assess information security events and decide if they are to be categorized as information security incidents.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.26", label: "Response to information security incidents", description: "Information security incidents shall be responded to in accordance with the documented procedures.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.27", label: "Learning from information security incidents", description: "Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.28", label: "Collection of evidence", description: "The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of evidence related to information security events.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.29", label: "Information security during disruption", description: "The organization shall plan how to maintain information security at an appropriate level during disruption.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.30", label: "ICT readiness for business continuity", description: "ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.31", label: "Legal, statutory, regulatory and contractual requirements", description: "Legal, statutory, regulatory and contractual requirements relevant to information security and the organization's approach to meet these requirements shall be identified, documented and kept up to date.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.32", label: "Intellectual property rights", description: "The organization shall implement appropriate procedures to protect intellectual property rights.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.33", label: "Protection of records", description: "The organization shall implement appropriate procedures to protect records.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.34", label: "Privacy and protection of personal identifiable information (PII)", description: "The organization shall identify and meet the requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.35", label: "Independent review of information security", description: "The organization's approach to managing information security and its implementation including people, processes and technologies shall be reviewed independently at planned intervals, or when significant changes occur.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.36", label: "Compliance with policies, rules and standards for information security", description: "Compliance with the organization's information security policy, topic-specific policies, rules and standards shall be regularly reviewed.", category: "annex_a_5", subCategory: null },
  { controlId: "A.5.37", label: "Documented operating procedures", description: "Operating procedures for information processing facilities shall be documented and made available to personnel who need them.", category: "annex_a_5", subCategory: null },
]

const ANNEX_A_6_CONTROLS = [
  { controlId: "A.6.1", label: "Screening", description: "Background verification checks on all candidates to become personnel shall be carried out prior to joining the organization and on an ongoing basis.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.2", label: "Terms and conditions of employment", description: "The employment contractual agreements shall state the personnel's and the organization's responsibilities for information security.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.3", label: "Information security awareness, education and training", description: "Personnel of the organization shall receive appropriate information security awareness, education and training.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.4", label: "Disciplinary process", description: "A disciplinary process shall be formalized and communicated to take actions against personnel who have committed an information security policy violation.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.5", label: "Responsibilities after termination or change of employment", description: "Information security responsibilities and duties that remain valid after termination or change of employment shall be defined and communicated.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.6", label: "Confidentiality or non-disclosure agreements", description: "Confidentiality or non-disclosure agreements reflecting the organisation's needs for the protection of information shall be signed.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.7", label: "Remote working", description: "Security measures shall be implemented when personnel are working remotely to protect information accessed outside the organisation's premises.", category: "annex_a_6", subCategory: null },
  { controlId: "A.6.8", label: "Information security event reporting", description: "The organisation shall provide a mechanism for personnel to report observed or suspected information security events.", category: "annex_a_6", subCategory: null },
]

const ANNEX_A_7_CONTROLS = [
  { controlId: "A.7.1", label: "Physical security perimeters", description: "Security perimeters shall be defined and used to protect areas that contain information and other associated assets.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.2", label: "Physical entry", description: "Secure areas shall be protected by appropriate entry controls and access points.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.3", label: "Securing offices, rooms and facilities", description: "Physical security for offices, rooms and facilities shall be designed and implemented.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.4", label: "Physical security monitoring", description: "Premises shall be continuously monitored for unauthorized physical access.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.5", label: "Protecting against physical and environmental threats", description: "Protection against physical and environmental threats shall be designed and implemented.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.6", label: "Working in secure areas", description: "Security measures for working in secure areas shall be designed and implemented.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.7", label: "Clear desk and clear screen", description: "Clear desk rules for papers and removable storage media and clear screen rules shall be defined and enforced.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.8", label: "Equipment siting and protection", description: "Equipment shall be sited securely and protected.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.9", label: "Security of assets off-premises", description: "Off-site assets shall be protected.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.10", label: "Storage media", description: "Storage media shall be managed through their life cycle of acquisition, use, transportation and disposal.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.11", label: "Supporting utilities", description: "Information processing facilities shall be protected from power failures and other disruptions.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.12", label: "Cabling security", description: "Cables carrying power, data or supporting information services shall be protected from interception or damage.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.13", label: "Equipment maintenance", description: "Equipment shall be maintained correctly to ensure availability, integrity and confidentiality of information.", category: "annex_a_7", subCategory: null },
  { controlId: "A.7.14", label: "Secure disposal or re-use of equipment", description: "Items of equipment containing storage media shall be verified to ensure sensitive data has been removed prior to disposal.", category: "annex_a_7", subCategory: null },
]

const ANNEX_A_8_CONTROLS = [
  { controlId: "A.8.1", label: "User end point devices", description: "Information stored on, processed by or accessible via user end point devices shall be protected.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.2", label: "Privileged access rights", description: "The allocation and use of privileged access rights shall be restricted and managed.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.3", label: "Information access restriction", description: "Access to information and other associated assets shall be restricted in accordance with the access control policy.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.4", label: "Access to source code", description: "Read and write access to source code, development tools and software libraries shall be appropriately managed.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.5", label: "Secure authentication", description: "Secure authentication technologies and procedures shall be implemented.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.6", label: "Capacity management", description: "The use of resources shall be monitored and adjusted in line with current and expected capacity requirements.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.7", label: "Protection against malware", description: "Protection against malware shall be implemented and supported by appropriate user awareness.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.8", label: "Management of technical vulnerabilities", description: "Information about technical vulnerabilities of information systems in use shall be obtained and appropriate measures taken.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.9", label: "Configuration management", description: "Configurations of hardware, software, services and networks shall be established, documented and implemented.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.10", label: "Information deletion", description: "Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.11", label: "Data masking", description: "Data masking shall be used in accordance with the organisation's topic-specific policy on access control.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.12", label: "Data leakage prevention", description: "Data leakage prevention measures shall be applied to systems, networks and devices that process sensitive information.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.13", label: "Information backup", description: "Backup copies of information, software and systems shall be maintained and regularly tested.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.14", label: "Redundancy of information processing facilities", description: "Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.15", label: "Logging", description: "Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.16", label: "Monitoring activities", description: "Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.17", label: "Clock synchronization", description: "The clocks of information processing systems used by the organisation shall be synchronized to approved time sources.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.18", label: "Use of privileged utility programs", description: "The use of utility programs that can override system and application controls shall be restricted and tightly controlled.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.19", label: "Installation of software on operational systems", description: "Procedures and measures shall be implemented to securely manage software installation on operational systems.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.20", label: "Networks security", description: "Networks and network devices shall be secured, managed and controlled to protect information in systems and applications.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.21", label: "Security of network services", description: "Security mechanisms, service levels and service requirements of network services shall be identified and implemented.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.22", label: "Segregation of networks", description: "Groups of information services, users and information systems shall be segregated in the organisation's networks.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.23", label: "Web filtering", description: "Access to external websites shall be managed to reduce exposure to malicious content.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.24", label: "Use of cryptography", description: "Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.25", label: "Secure development life cycle", description: "Rules for the secure development of software and systems shall be established and applied.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.26", label: "Application security requirements", description: "Information security requirements shall be identified when developing or acquiring applications.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.27", label: "Secure system architecture and engineering principles", description: "Principles for engineering secure systems shall be established, documented and applied.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.28", label: "Secure coding", description: "Secure coding principles shall be applied to software development.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.29", label: "Security testing in development and acceptance", description: "Security testing processes shall be defined and implemented in the development life cycle.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.30", label: "Outsourced development", description: "The organisation shall direct, monitor and review the activities related to outsourced system development.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.31", label: "Separation of development, test and production environments", description: "Development, testing and production environments shall be separated and secured.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.32", label: "Change management", description: "Changes to information processing facilities and information systems shall be subject to change management procedures.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.33", label: "Test information", description: "Test information shall be appropriately selected, protected and managed.", category: "annex_a_8", subCategory: null },
  { controlId: "A.8.34", label: "Protection of information systems during audit testing", description: "Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed.", category: "annex_a_8", subCategory: null },
]

async function main() {
  console.log("Seeding database (fresh)…")

  const companiesData = [
    { key: "ecocat", name: "ECOCAT India Pvt Ltd", logo: "/logos/ecologo.jpg" },
    { key: "pranav", name: "Pranav Vikas India Ltd", logo: "/logos/pranavlogo.png" },
    { key: "sanden", name: "Sanden Vikas India Ltd", logo: "/logos/sandenlogo.jpg" },
    { key: "sata", name: "SATA Vikas India Ltd", logo: "/logos/satalogo.webp" },
  ]

  const createdCompanies = []
  for (const company of companiesData) {
    const created = await prisma.company.create({ data: company })
    createdCompanies.push(created)
  }

  const users = [
    // Group-level (no companyKey)
    { pin: "2701", name: "CIO / Group IT Head",  role: "CIO",              department: "IT"      },
    { pin: "3801", name: "HR Manager",            role: "HR_MANAGER",       department: "HR"      },
    { pin: "4901", name: "Admin / Facilities",    role: "ADMIN_FACILITIES", department: "ADMIN"   },
    { pin: "5012", name: "Legal / Compliance",    role: "LEGAL",            department: "LEGAL"   },
    { pin: "9001", name: "MD / CEO",              role: "MD_CEO",           department: "FINANCE" },

    // IT Managers per subsidiary
    { pin: "2702", name: "IT Manager - ECOCAT",  role: "IT_MANAGER",   department: "IT",  companyKey: "ecocat" },
    { pin: "2703", name: "IT Manager - PRANAV",  role: "IT_MANAGER",   department: "IT",  companyKey: "pranav" },
    { pin: "2704", name: "IT Manager - SANDEN",  role: "IT_MANAGER",   department: "IT",  companyKey: "sanden" },
    { pin: "2705", name: "IT Manager - SATA",    role: "IT_MANAGER",   department: "IT",  companyKey: "sata"   },

    // STQM Managers per subsidiary
    { pin: "3702", name: "STQM Manager - ECOCAT", role: "STQM_MANAGER", department: "STQM", companyKey: "ecocat" },
    { pin: "3703", name: "STQM Manager - PRANAV", role: "STQM_MANAGER", department: "STQM", companyKey: "pranav" },
    { pin: "3704", name: "STQM Manager - SANDEN", role: "STQM_MANAGER", department: "STQM", companyKey: "sanden" },
    { pin: "3705", name: "STQM Manager - SATA",   role: "STQM_MANAGER", department: "STQM", companyKey: "sata"   },

    // IT Executives per subsidiary
    { pin: "1101", name: "IT Executive - ECOCAT",  role: "IT_EXECUTIVE",  department: "IT", companyKey: "ecocat" },
    { pin: "1102", name: "IT Executive - PRANAV",  role: "IT_EXECUTIVE",  department: "IT", companyKey: "pranav" },
    { pin: "1103", name: "IT Executive - SANDEN",  role: "IT_EXECUTIVE",  department: "IT", companyKey: "sanden" },
    { pin: "1104", name: "IT Executive - SATA",    role: "IT_EXECUTIVE",  department: "IT", companyKey: "sata"   },

    // HR Executives per subsidiary
    { pin: "1201", name: "HR Executive - ECOCAT",  role: "HR_EXECUTIVE",  department: "HR", companyKey: "ecocat" },
    { pin: "1202", name: "HR Executive - PRANAV",  role: "HR_EXECUTIVE",  department: "HR", companyKey: "pranav" },
    { pin: "1203", name: "HR Executive - SANDEN",  role: "HR_EXECUTIVE",  department: "HR", companyKey: "sanden" },
    { pin: "1204", name: "HR Executive - SATA",    role: "HR_EXECUTIVE",  department: "HR", companyKey: "sata"   },
  ]

  for (const user of users) {
    await prisma.user.create({ data: user })
  }

  const allControlsPerCompany = [
    ...CLAUSE_CONTROLS,
    ...ANNEX_A_5_CONTROLS,
    ...ANNEX_A_6_CONTROLS,
    ...ANNEX_A_7_CONTROLS,
    ...ANNEX_A_8_CONTROLS,
  ]

  let totalControls = 0
  for (const company of createdCompanies) {
    for (const ctrl of allControlsPerCompany) {
      await prisma.control.create({
        data: {
          companyId: company.id,
          controlId: ctrl.controlId,
          label: ctrl.label,
          description: ctrl.description || null,
          category: ctrl.category,
          subCategory: ctrl.subCategory,
          status: "NOT_STARTED",
        },
      })
      totalControls++
    }
  }

  console.log(`Seeded database with ${users.length} users, ${companiesData.length} companies, and ${totalControls} controls`)
  console.log(`Controls breakdown per company:`)
  console.log(`  - Clauses 4-10 (Mandatory): ${CLAUSE_CONTROLS.length}`)
  console.log(`  - Annex A Organisational (A.5): ${ANNEX_A_5_CONTROLS.length}`)
  console.log(`  - Annex A People (A.6): ${ANNEX_A_6_CONTROLS.length}`)
  console.log(`  - Annex A Physical (A.7): ${ANNEX_A_7_CONTROLS.length}`)
  console.log(`  - Annex A Technological (A.8): ${ANNEX_A_8_CONTROLS.length}`)
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect())