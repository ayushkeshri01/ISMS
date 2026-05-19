# Vikas Group — ISMS Portal Security & QA Assessment Report

**Prepared For:** Executive Management & Development Teams  
**Status:** Completed  
**Target Environment:** Local Port 3000 / Development  
**Assessment Date:** May 19, 2026  

---

## 📋 Executive Summary

A comprehensive quality assurance, functional, and security assessment of the **Vikas Group ISMS Portal** was conducted to verify application security controls, role-based access mechanisms, logic correctness, and overall stability. 

### Key Accomplishments
1. **Compilation Issues Resolved**: Rectified legacy `DialogTrigger` rendering syntax issues in the mandatory documents component, establishing a **100% buildable production bundle** (zero compilation errors).
2. **End-to-End Authentication Verified**: Tested and validated the complete login, development-mode OTP interception, and dashboard routing for subsidiary managers (`prakash@ecocatindia.com` - ECOCAT IT Manager).
3. **Deep Security Discovery**: Conducted a thorough white-box security review of server components and API routes. Multiple high-impact Insecure Direct Object Reference (IDOR) and Authorization Bypass vulnerabilities were identified and mapped.

---

## 🛡️ Vulnerability & Defect Inventory

The following security vulnerabilities and logical defects are prioritized by severity:

### 🚨 Critical Severity

#### 1. Insecure Direct Object Reference (IDOR) on Company Dashboards
* **Target File**: `app/dashboard/[company]/page.tsx`
* **Threat Profile**: Broken Object Level Authorization (OWASP API1:2023)
* **Description**: The Subsidiary Dashboard server component reads the `company` route parameter (e.g. `/dashboard/ecocat`) and fetches company statistics, evidence records, and compliance lists without comparing it against the authenticated user’s own `companyKey` or confirming if the user holds the Group `CIO` role.
* **Impact**: Any logged-in user (regardless of their subsidiary or access level, e.g. an IT Executive from Sanden) can type `/dashboard/ecocat` or `/dashboard/pranav` and instantly view the entire compliance score, file attachment lists, and certificates of another entity.
* **Remediation**:
  Insert authorization checks inside `SubsidiaryDashboardPage`:
  ```typescript
  if (session.user.companyKey && session.user.companyKey !== company && session.user.role !== "CIO") {
    redirect(`/dashboard/${session.user.companyKey}`)
  }
  ```

#### 2. Certificates API Global Authorization Bypass
* **Target File**: `app/api/certificates/route.ts`
* **Threat Profile**: Privilege Escalation / Information Disclosure
* **Description**: In the certificates endpoint, if the `companyKey` query parameter is omitted entirely from the HTTP request, the checks for tenant boundary validation are completely bypassed:
  ```typescript
  if (companyKey && session.user.companyKey !== companyKey && session.user.role !== "CIO") { ... }
  ```
  Since `companyKey` is falsy, this block does not execute. The code then falls through and returns ALL certificates in the database: `prisma.certificate.findMany({ where: {} })`.
* **Impact**: Any authenticated low-privilege user can execute `GET /api/certificates` (leaving `companyKey` empty) and obtain the complete list of certificates, active domains, and upload timestamps for all entities.
* **Remediation**:
  Ensure the `companyKey` is strictly resolved. If omitted, default to the user's own `companyKey`:
  ```typescript
  const resolvedCompanyKey = companyKey || session.user.companyKey;
  if (!resolvedCompanyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  if (resolvedCompanyKey && session.user.companyKey !== resolvedCompanyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  ```

#### 3. Reports API Global Authorization Bypass
* **Target File**: `app/api/reports/route.ts`
* **Threat Profile**: Privilege Escalation / Information Disclosure
* **Description**: Identical in nature to the Certificates API bypass, the Reports API checks:
  ```typescript
  if (companyKey && session.user.companyKey !== companyKey && session.user.role !== 'CIO') { ... }
  ```
  If an attacker sends a request without `companyKey`, the authorization check is skipped, executing queries to return compliance scores or monthly compliance score history for every company in the system.
* **Impact**: Low-privilege subsidiary executives can extract detailed historical compliance scores and trend charts of all sister companies.
* **Remediation**:
  Strictly bind the query parameter or block empty parameters for non-group users.

---

### 🟠 High Severity

#### 4. Review Schedule Update IDOR for Group-Level Users
* **Target File**: `app/api/review-schedule/route.ts`
* **Threat Profile**: Unauthorized Data Modification / Write Bypass
* **Description**: In the review schedule update (`PATCH`), permission is validated via:
  ```typescript
  if (session.user.companyKey && session.user.companyKey !== companyKey && session.user.role !== "CIO") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  ```
  For group-level users like `MD_CEO` or the Group `HR_MANAGER`, their `companyKey` in the database is `null`. The first condition `session.user.companyKey` evaluates to `false`, causing the entire statement to be skipped.
* **Impact**: Read-only group-level managers (like the Group MD or HR Head) can arbitrarily modify, create, or reschedule active compliance reviews for any subsidiary.
* **Remediation**:
  Check if the role is allowed to make updates instead of solely relying on the presence of `companyKey`:
  ```typescript
  const hasAccess = session.user.role === "CIO" || 
                    (session.user.companyKey === companyKey && ["IT_MANAGER", "STQM_MANAGER"].includes(session.user.role))
  if (!hasAccess) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  ```

#### 5. Cross-Tenant User Manipulation via CRUD Operations
* **Target File**: `app/api/auth/register/route.ts`
* **Threat Profile**: Broken Function Level Authorization
* **Description**: The registration API blocks subsidiary `IT_MANAGER` roles from adding/editing users belonging to other companies. However, other roles with write access (like `HR_MANAGER` or `STQM_MANAGER`) are not subjected to company key validations in the `PATCH` or `DELETE` methods.
* **Impact**: A subsidiary HR Manager can issue updates or delete user accounts belonging to different subsidiaries.
* **Remediation**:
  Apply tenant validation for all roles except the Group `CIO`:
  ```typescript
  if (session.user.role !== "CIO" && session.user.companyKey !== targetUser.companyKey) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  ```

#### 6. Settings Page: CIO UI Lockout & Subsidiary Over-Privilege
* **Target File**: `app/dashboard/settings/page.tsx`
* **Threat Profile**: Broken Business Logic & Over-Privileged Accounts
* **Description**:
  1. The settings page redirects the Group `CIO` (role `CIO`) away to the master dashboard because of a flawed logical check:
     ```typescript
     if (status === "authenticated" && (session?.user?.access !== "write" || session?.user?.role === "CIO")) {
       redirect("/dashboard/master")
     }
     ```
  2. Subsidiary managers (e.g. IT Managers/STQM Managers) can access this page and submit modifications to `/api/settings` which updates the **global** SMTP configuration.
* **Impact**: The Group CIO (the primary administrative authority) is locked out from configuring SMTP settings in the UI. Meanwhile, subsidiary-specific managers have the unintended ability to alter global email server credentials.
* **Remediation**:
  Limit settings updates strictly to the Group `CIO`:
  ```typescript
  if (status === "authenticated" && session?.user?.role !== "CIO") {
    redirect("/dashboard/master")
  }
  ```

---

### 🟡 Medium Severity

#### 7. Wildcard Logic Bug in Frequency Classifier
* **Target File**: `app/api/review-schedule/init/route.ts`
* **Threat Profile**: Compliance Automation Failure
* **Description**: The helper `determineFrequency` runs:
  ```typescript
  if (desc.includes("monitoring.*review.*supplier")) return "QUARTERLY"
  if (desc.includes("physical.*environmental")) return "SEMI_ANNUAL"
  ```
  `.includes()` performs direct, literal string matches and does not evaluate wildcards (`.*`) as regular expressions. Thus, these checks will never match the control descriptions, defaulting all frequencies to "ANNUAL".
* **Impact**: Critical environmental and supplier controls are scheduled incorrectly, posing compliance audit risks.
* **Remediation**:
  Replace `.includes` checks with RegExp evaluations:
  ```typescript
  if (/monitoring.*review.*supplier/i.test(desc)) return "QUARTERLY"
  if (/physical.*environmental/i.test(desc)) return "SEMI_ANNUAL"
  ```

#### 8. Lack of Authentication Brute-Force Rate Limiting
* **Target File**: `/api/auth/login` and `/api/auth/forgot-password`
* **Threat Profile**: Credential Guessing / Denial of Service
* **Description**: There is no application-level rate limiting or IP-based request throttling on the authentication endpoints.
* **Impact**: Attackers can perform automated dictionary attacks or repeatedly guess OTP values.
* **Remediation**:
  Implement rate-limiting middleware using Redis, IP-based request buckets, or cloud-based WAF controls.

---

## 📈 Functional, Usability & Accessibility Audit

| Test Area | Status | Observations |
| :--- | :---: | :--- |
| **Login Flow** | **Verified** | Successful login with credentials + OTP interception (dynamic verification completed). |
| **OTP Screen Form Validation** | **Verified** | Blocks invalid characters, handles sequence input correctly, and supports backspacing. |
| **Dashboard Layout** | **Verified** | Responsive on all viewport sizes (tested mobile/desktop scaling); clean, visual charts. |
| **UI Component Stability** | **Verified** | Base UI overlays, menus, and Dialog triggers function without console exceptions. |
| **Settings Management** | **Defect** | Global config editable by subsidiary managers, CIO locked out of settings view. |
| **Report Export** | **Verified** | Export evidence ZIP validates tenant limits securely. |

---

## 🏆 Positive Security Controls

1. **Evidence File Retrieval Protection**: Serve (`/api/evidence/view/[id]`) and download (`/api/evidence/download/[id]`) endpoints correctly check `session.user.companyKey` against the evidence's owner, preventing IDOR on files.
2. **Notification Isolation**: The GET/PATCH routes under `/api/notifications` are securely bound to `session.user.id`, ensuring a user can never access or mark another user's alerts.
3. **Role Access Mapping**: The centralized `ROLE_ACCESS` configuration mapping is a clean architecture pattern that handles granular access levels (`read` vs. `write`) effectively.

---

## 🚀 Recommended Mitigation Timeline

1. **Immediate (Next 24 Hours)**: Patch the Company Dashboard IDOR (`app/dashboard/[company]/page.tsx`) and the global APIs for Certificates and Reports.
2. **Short Term (Next 3 Days)**: Fix the CIO settings UI lockout, restrict Settings API updates to the `CIO` role, and implement regular expression pattern matching in the frequency classifier.
3. **Medium Term (Next 2 Weeks)**: Add API rate-limiting middleware to standard login and forgot-password paths.
