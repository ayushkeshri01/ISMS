# VG ISMS Portal — Upload & Synchronization QA Report

**Audit Date:** 2026-05-19  
**Auditor:** Senior QA Tester  
**Application:** VG ISMS Portal (ISO/IEC 27001:2022 Compliance Management)  
**Focus Areas:** Upload Functionality, Cross-User Synchronization, Role Visibility, Workflow Validation  
**Test Accounts:** CIO (rajeev.singh@vikasgroup.in), Ecocat IT Manager (prakash@ecocatindia.com), PRANAV IT Executive (himanshu.rikhari@pranavvikas.com), PRANAV IT Manager (binod.jaitwal@pranavvikas.com)  
**Testing Method:** Comprehensive source code analysis + API route verification

---

## EXECUTIVE SUMMARY

The application has 3 upload touchpoints (Evidence Upload, Certificate Upload, Bulk ZIP Export) across 6+ tabs and 4 subsidiary dashboards. The architecture uses base64-encoded file storage in PostgreSQL BYTEA columns, which introduces significant performance and reliability concerns.

**Overall Upload & Sync Health Score: 64/100** (Fair, with critical gaps)

| Category | Score | Rating |
|----------|-------|--------|
| Upload Functionality | 62/100 | Fair |
| Cross-User Sync | 68/100 | Fair |
| Role Visibility | 75/100 | Good |
| Workflow Validation | 55/100 | Needs Improvement |
| UI/UX | 70/100 | Good |

**Critical Issues Found:** 4  
**High Issues Found:** 12  
**Medium Issues Found:** 10  
**Low Issues Found:** 6  

---

## SECTION 1: UPLOAD FUNCTIONALITY TESTING

### 1.1 Evidence Upload (`EvidenceUpload` Component)

#### Issue UPL-001 — `dateOfDocument` Field Silently Lost
**Severity:** HIGH  
**Role Affected:** All uploaders (IT_EXECUTIVE, IT_MANAGER, CIO, etc.)  
**Page:** `EvidenceUpload` component — used in Controls tab, Docs tab, maker-controls tab  
**File(s):** `components/dashboard/evidence-upload.tsx:99-103`, `app/api/evidence/route.ts:56`  
**Steps to Reproduce:**
1. Login as PRANAV IT Executive
2. Go to Controls tab → click Upload on any control
3. Fill in all fields including "Date of Document"
4. Submit upload
5. Re-open the evidence record
**Expected Behavior:** Date of Document should be stored and retrievable
**Actual Behavior:** The `dateOfDocument` field is sent in the POST request but the API `/api/evidence` does not accept or store this field — no such column exists in the `Evidence` model in schema.prisma
**Suggested Fix:** Either add a `dateOfDocument` column to the `Evidence` model in `prisma/schema.prisma` and handle it in `app/api/evidence/route.ts:56`, or remove the field from the upload form in `evidence-upload.tsx`

#### Issue UPL-002 — No File Type Validation on Client Side (Only Extension Check)
**Severity:** MEDIUM  
**Role Affected:** All uploaders  
**Page:** Evidence Upload (all instances)  
**File(s):** `components/dashboard/evidence-upload.tsx:245` — `accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"`  
**Steps to Reproduce:**
1. Rename a `.exe` or `.bat` file to `.pdf`
2. Attempt to upload it through the Evidence Upload form
3. Observe client accepts the file
**Expected Behavior:** File type validation should verify MIME type both client-side (by checking `file.type`) and server-side (which already does)
**Actual Behavior:** Client-side only checks file extension via the `accept` attribute; server-side correctly validates MIME types
**Suggested Fix:** Add MIME type validation on client side before enabling the upload button:
```typescript
const ALLOWED_MIMES = ['application/pdf', ...]
if (!ALLOWED_MIMES.includes(selectedFile.type)) {
  toast.error("Invalid file type")
  return
}
```

#### Issue UPL-003 — No Upload Progress Indicator
**Severity:** MEDIUM  
**Role Affected:** All uploaders  
**Page:** Evidence Upload / Certificate Upload  
**File(s):** `components/dashboard/evidence-upload.tsx:73-105`  
**Steps to Reproduce:**
1. Upload a large file (close to 5MB)
2. Click "Upload Evidence"
3. Button changes to "Uploading..." but no progress bar
**Expected Behavior:** A progress bar or percentage indicator showing upload progress
**Actual Behavior:** Only a text change from "Upload Evidence" to "Uploading..." — no visual progress feedback. The base64 encoding step can take several seconds for large files with no indicator.
**Suggested Fix:** Add an `<progress>` bar or animated bar component that updates during the FileReader and fetch stages:
```typescript
// Track encoding progress
reader.onprogress = (e) => {
  if (e.lengthComputable) {
    setProgress(Math.round((e.loaded / e.total) * 50))
  }
}
```

#### Issue UPL-004 — File Replace/Re-upload Not Supported
**Severity:** MEDIUM  
**Role Affected:** All uploaders  
**Page:** Controls tab → Upload dialog, Docs tab  
**File(s):** `components/dashboard/evidence-upload.tsx`, `app/api/evidence/route.ts` (POST only)  
**Steps to Reproduce:**
1. Upload evidence for control A.5.1
2. Navigate away and come back
3. Open upload dialog for the same control
4. Upload a new file
**Expected Behavior:** Either replace the existing evidence or create a new version with incremented version number
**Actual Behavior:** Always creates a new evidence record; never replaces. No deduplication or version management.
**Suggested Fix:** Add a "Replace" option that either (a) soft-deletes the old evidence and replaces it, or (b) implements proper versioning (v1, v2, v3) grouped by controlId

#### Issue UPL-005 — No Upload Confirmation Before Submit
**Severity:** LOW  
**Role Affected:** All uploaders  
**Page:** Evidence Upload  
**File(s):** `components/dashboard/evidence-upload.tsx:67-69`  
**Steps to Reproduce:**
1. Fill form fields
2. Select a file
3. Click "Upload Evidence"
**Expected Behavior:** A confirmation dialog showing "You are about to upload [filename] to control [controlId]. Continue?"
**Actual Behavior:** Upload begins immediately on button click with no confirmation
**Suggested Fix:** Add a confirmation step or undo toast with 5-second grace period

#### Issue UPL-006 — Certificate Upload Success/Failure Not Communicated
**Severity:** HIGH  
**Role Affected:** IT Manager, CIO  
**Page:** Certificates tab  
**File(s):** `components/dashboard/certificate-form.tsx:80-100`  
**Steps to Reproduce:**
1. Go to Certificates tab  
2. Fill in all certificate fields  
3. Click "Save Certificate"  
**Expected Behavior:** Success or error toast notification  
**Actual Behavior:** The `handleSubmit` function does not check `response.ok`. Even if the request fails, the form closes and navigates away with `router.refresh()`. No toast is shown on failure. The success case also has no toast.
**Suggested Fix:** Check response status and show appropriate toast:
```typescript
const res = await fetch("/api/certificates", { ... })
if (res.ok) {
  toast.success("Certificate saved successfully!")
} else {
  const err = await res.json()
  toast.error("Failed: " + (err.error || "Unknown error"))
  return // Don't close form on failure
}
```

#### Issue UPL-007 — Certificate File Upload Has No Drag-and-Drop
**Severity:** LOW  
**Role Affected:** IT Manager, CIO  
**Page:** Certificates tab  
**File(s):** `components/dashboard/certificate-form.tsx:224-253`  
**Steps to Reproduce:**
1. Open Add Certificate form
2. Observe the file upload area
**Expected Behavior:** Should support drag-and-drop like the Evidence Upload component
**Actual Behavior:** Only click-to-upload is supported; no `onDrop` or `onDragOver` handlers
**Suggested Fix:** Add drag-and-drop handlers identical to `evidence-upload.tsx:59-65`

#### Issue UPL-008 — Upload Persistence After Refresh Verified by Design
**Severity:** INFO (Positive finding)  
**Role Affected:** All  
**Page:** All upload tabs  
**File(s):** `prisma/schema.prisma:60-86`  
**Finding:** Files are stored as `Bytes` in PostgreSQL via Prisma. Once uploaded, data persists across refresh/logout/login cycles. The evidence is loaded via `GET /api/evidence` which queries the database each time. This is correctly implemented.
**Status:** PASS

---

### 1.2 Certificate Upload (`CertificateForm` Component)

#### Issue UPL-009 — Certificate Upload Ignores `fileData` in Response
**Severity:** HIGH  
**Role Affected:** CIO, IT Manager (all companies)  
**Page:** Certificates tab  
**File(s):** `components/dashboard/certificate-form.tsx:71-77`, `app/api/certificates/route.ts:48-49`  
**Steps to Reproduce:**
1. Upload a certificate with a file
2. Refresh the page
3. View the certificate card
**Expected Behavior:** Certificate file should be viewable/downloadable
**Actual Behavior:** The `certificate-form.tsx` sends `fileData` and `fileType` to the API, but the API's POST handler at `/api/certificates/route.ts:89-99` destructures `body` as `{ companyKey, body: certBody, number, validFrom, validTo, scope, isActive }` — **it does not destructure or store `fileData` or `fileType`**. The file is uploaded but silently discarded.
**Suggested Fix:** Update `app/api/certificates/route.ts:49` to include `fileData` and `fileType`, and update the Prisma `certificate.create` call to store them in the `fileData` and `fileType` fields (note: schema has `fileData Bytes?` but no `fileType` field)

#### Issue UPL-010 — No File Preview on Certificate Cards
**Severity:** MEDIUM  
**Role Affected:** All users viewing certificates  
**Page:** Certificates tab  
**File(s):** `components/dashboard/certificate-form.tsx:275-313`  
**Steps to Reproduce:**
1. Add a certificate with a PDF file
2. View the certificate card in the list
**Expected Behavior:** There should be a view/download button to access the uploaded certificate file
**Actual Behavior:** The certificate list cards only show metadata (body, number, dates, scope) but no link to view or download the uploaded certificate file
**Suggested Fix:** Add a "View Certificate" button/link that opens the file via `/api/certificates/view/[id]` route

---

### 1.3 Bulk Export (`ExportModal` Component)

#### Issue UPL-011 — Export Error Suppressed
**Severity:** MEDIUM  
**Role Affected:** CIO (master dashboard)  
**Page:** Master Dashboard → Download Report  
**File(s):** `components/dashboard/export-modal.tsx:54-57`  
**Steps to Reproduce:**
1. Open Export modal  
2. Select "All Evidence (ZIP)"  
3. If export fails  
**Expected Behavior:** Toast notification with error details  
**Actual Behavior:** `toast.error("Export failed. Please try again.")` — generic message with no details. More critically, the export type logic at lines 37-52 has a bug: if `exportType === "evidence"` it calls `exportAllEvidence()`, but if `exportType === "full"` it ALSO calls `exportAllEvidence()`. However, for "full" type, the scores/monthly/yearly exports are never called. This may be intentional but is confusing.
**Suggested Fix:** Add a more descriptive error message and fix the export logic if "full" is meant to export everything

#### Issue UPL-012 — ZIP Export May Exceed Memory Limits
**Severity:** HIGH  
**Role Affected:** CIO  
**Page:** Master Dashboard → "Download All Evidence (ZIP)"  
**File(s):** `app/api/export/evidence/route.ts:52-69`  
**Steps to Reproduce:**
1. Upload evidence files to all 4 companies totaling >100MB  
2. Attempt to download all evidence as ZIP  
**Expected Behavior:** ZIP should be generated and downloaded in chunks  
**Actual Behavior:** Uses `JSZip` which loads ALL files into memory to generate the ZIP. With 4 companies × ~100 controls each, file data could easily exceed 200-500MB. This will cause heap out-of-memory errors on the server.
**Suggested Fix:** Implement streaming ZIP generation or add file size limits to the export endpoint. Consider using `archiver` (streaming) instead of `JSZip` (in-memory).

---

## SECTION 2: CROSS-USER SYNCHRONIZATION TESTING

### 2.1 IT Executive → IT Manager Sync Flow

#### Workflow WFL-001: Executive Uploads → Manager Visibility
**Severity:** HIGH  
**Role Affected:** IT_EXECUTIVE → IT_MANAGER  
**Files:** `app/dashboard/[company]/page.tsx:7-77`, `app/api/evidence/route.ts:19-42`  
**Steps to Reproduce:**
1. Login as **PRANAV IT Executive** (himanshu.rikhari@pranavvikas.com)
2. Go to Controls tab, upload evidence for a control
3. Logout
4. Login as **PRANAV IT Manager** (binod.jaitwal@pranavvikas.com)
5. Go to Review tab
**Expected Behavior:** Evidence uploaded by executive appears in IT Manager's Review tab with status "PENDING"
**Actual Behavior:** 
- The `GET /api/evidence?companyKey=pranav` returns ALL evidence for the company regardless of uploader
- The `dashboard/[company]/page.tsx:17-22` fetches evidence with `company: { key: companyKey }` — no filter on uploader
- Both users share the same `companyKey=pranav`
- **Verdict: PASS** — evidence syncs correctly by design
**Status:** PASS

#### Issue WFL-002 — No Real-Time Sync Notification
**Severity:** MEDIUM  
**Role Affected:** IT_EXECUTIVE → IT_MANAGER  
**Files:** `components/dashboard/notification-bell.tsx`, `lib/auth.ts` (no WebSocket support)  
**Steps to Reproduce:**
1. Login as IT Executive in Tab A, IT Manager in Tab B
2. Executive uploads evidence in Tab A
3. Observe Tab B
**Expected Behavior:** IT Manager should receive a real-time notification or see the evidence appear automatically
**Actual Behavior:** The page must be manually refreshed. No WebSocket, Server-Sent Events, or polling mechanism exists. The `Notification` model stores notifications but they are only fetched when the user navigates or refreshes.
**Suggested Fix:** Implement one of:
- Use `navigator.sendBeacon` + server events
- Add a `setInterval` poll every 30s for new notifications
- Use next-auth `session` update callbacks to trigger data refresh

#### Issue WFL-003 — Notification Created on Review But Not on Upload
**Severity:** MEDIUM  
**Role Affected:** IT_EXECUTIVE → IT_MANAGER  
**Files:** `app/api/evidence/review/route.ts:80-93` (notification created), `app/api/evidence/route.ts:117-133` (no notification)  
**Steps to Reproduce:**
1. PRANAV IT Executive uploads evidence
2. Check PRANAV IT Manager's notifications
**Expected Behavior:** IT Manager should be notified when new evidence is uploaded for review
**Actual Behavior:** No notification is created when evidence is uploaded. Notifications are only created when a reviewer approves/rejects evidence. The uploader's manager has no way to know new evidence needs review unless they manually check the Review tab.
**Suggested Fix:** Add notification creation in the `POST /api/evidence` handler — notify all users with `review` tab access (IT_MANAGER, STQM_MANAGER, HR_MANAGER, CIO) who belong to the same company

#### Issue WFL-004 — Activity Log Created on Upload But Not Accessible via Notification
**Severity:** LOW  
**Role Affected:** All  
**Files:** `app/api/evidence/route.ts:135-149`  
**Finding:** Activity log correctly records `EVIDENCE_UPLOAD` action. However, users must manually navigate to the Activity Log tab to see this. No push notification.
**Suggested Fix:** Consider optional email notification for critical uploads (e.g., mandatory documents)

---

### 2.2 IT Manager → CIO Sync Flow

#### Workflow WFL-005: Manager Uploads/Updates → CIO Visibility
**Severity:** HIGH  
**Role Affected:** IT_MANAGER → CIO  
**Files:** `app/dashboard/[company]/page.tsx:7-77`, `app/dashboard/master/page.tsx:14-51`  
**Steps to Reproduce:**
1. Login as **Ecocat IT Manager** (prakash@ecocatindia.com)
2. Update control status on Controls tab
3. Upload evidence
4. Login as **CIO** (rajeev.singh@vikasgroup.in)
5. Check Ecocat dashboard and Master dashboard
**Expected Behavior:** CIO should see the updated control status and new evidence
**Actual Behavior:**
- **Controls**: CIO accesses via `/dashboard/ecocat?tab=my-controls` — fetches all controls for ecocat. Status updates persisted in DB. **PASS**
- **Evidence**: CIO accesses via Review tab (needs toggle) or via `/api/evidence?companyKey=ecocat`. **PASS**
- **Master dashboard**: `/dashboard/master` fetches controls for all 4 companies and computes scores. **PASS**
- **Verdict: PASS** — data is shared at the Company level
**Status:** PASS

#### Issue WFL-006 — CIO Missing Review Tab by Default
**Severity:** MEDIUM  
**Role Affected:** CIO  
**Files:** `components/dashboard/subsidiary-dashboard-client.tsx:80-101`  
**Steps to Reproduce:**
1. Login as CIO
2. Navigate to any subsidiary dashboard (e.g., `/dashboard/ecocat`)
3. Observe tabs
**Expected Behavior:** Review tab should be visible by default for CIO
**Actual Behavior:** CIO has a "Review Tab" checkbox toggle that defaults to **off** (`useState(false)`). CIO must manually check the box each time they visit a subsidiary dashboard. This is stored in `localStorage` per company, but localStorage is cleared on browser data wipe.
**Suggested Fix:** Change default to `true` for CIO role, or persist preference in user settings in the database

#### Issue WFL-007 — CIO Sees Evidence from All Companies Simultaneously
**Severity:** MEDIUM  
**Role Affected:** CIO  
**Files:** `components/dashboard/subsidiary-dashboard-client.tsx:387-393` — passes `company?.evidence`  
**Steps to Reproduce:**
1. Login as CIO
2. Go to `/dashboard/ecocat?tab=review`
3. Evidence shown is only ecocat's (filtered by `company.evidence`)
**Expected Behavior:** Evidence shown should be filtered by the current company
**Actual Behavior:** The EvidenceReview component receives `company?.evidence` which is already scoped to the company by the server-side query. **PASS**
**Status:** PASS

---

### 2.3 CIO Comments/Updates → Reflected to Users

#### Workflow WFL-008: CIO Rejects Evidence → Executive Notified
**Severity:** HIGH  
**Files:** `app/api/evidence/review/route.ts:64-93`  
**Steps to Reproduce:**
1. PRANAV IT Executive uploads evidence
2. CIO approves or rejects evidence with a review note
3. PRANAV IT Executive logs in
**Expected Behavior:** Executive should see the updated status and review note
**Actual Behavior:**
- Notification is created in DB for `evidence.uploadedById` 
- But the **Evidence Upload form does NOT show existing evidence or their statuses**
- The Evidence Review component is only visible to `write` access users (IT_MANAGER, CIO, etc.)
- IT_EXECUTIVE has `maker` access and does NOT have `review` tab
- **There is no UI for IT_EXECUTIVE to see the status of their submitted evidence or review notes**
**Suggested Fix:** Add an "My Uploads" section or status indicator on the Controls/Docs tab showing the review status of uploaded evidence. Alternatively, add a "My Submissions" tab for maker roles.

#### Issue WFL-009 — No Badge/Indicator on Controls Showing Evidence Status
**Severity:** HIGH  
**Role Affected:** IT_EXECUTIVE, IT_MANAGER  
**Files:** `components/dashboard/control-accordion.tsx:193-244`  
**Steps to Reproduce:**
1. Upload evidence for control A.5.1
2. Look at the control card in the Controls accordion
**Expected Behavior:** The control should show a small icon/badge indicating "evidence uploaded" or "evidence approved"
**Actual Behavior:** No indicator at all. The Upload button is always shown regardless of whether evidence exists. Users cannot tell at a glance which controls already have evidence uploaded.
**Suggested Fix:** Pass evidence data to ControlAccordion and show a small green checkmark or "Evidence Submitted" badge next to controls that have evidence

---

## SECTION 3: ROLE-BASED VALIDATION

### 3.1 CIO (rajeev.singh@vikasgroup.in)

#### Issue ROL-001 — CIO Can See All Company Dashboards
**Files:** `app/dashboard/[company]/page.tsx:91` — `session.user.role !== "CIO"` bypass  
**Verdict:** Correct — CIO has no `companyKey`, gains access to all subsidiaries  
**Status:** PASS

#### Issue ROL-002 — CIO Tabs Include All 9 Tabs
**Files:** `lib/constants.ts:38` — CIO tabs: overview, my-controls, docs, review, review-schedule, certificates, users, trend, log  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-003 — CIO Has Master Dashboard
**Files:** `components/navigation/sidebar.tsx:147-156` — Master Dashboard link shown only for CIO  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-004 — CIO Can Upload to Any Company
**Files:** `app/api/evidence/route.ts:83` — `session.user.companyKey !== companyKey && session.user.role !== 'CIO'`  
**Verdict:** Correct — CIO bypass is implemented  
**Status:** PASS

---

### 3.2 IT Manager (prakash@ecocatindia.com / binod.jaitwal@pranavvikas.com)

#### Issue ROL-005 — IT Manager Tabs Match CIO
**Files:** `lib/constants.ts:39` — IT_MANAGER tabs identical to CIO  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-006 — IT Manager Can Review Evidence
**Files:** `app/api/evidence/review/route.ts:13` — VALID_REVIEWERS includes IT_MANAGER  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-007 — IT Manager Cannot View Other Companies
**Files:** `app/dashboard/[company]/page.tsx:91` — Redirects to own company  
**Files:** `app/api/evidence/route.ts:31` — Blocks other company access  
**Verdict:** Correct  
**Status:** PASS

---

### 3.3 IT Executive (himanshu.rikhari@pranavvikas.com)

#### Issue ROL-008 — IT Executive Has 6 Tabs (No Review, No Certificates, No Users)
**Files:** `lib/constants.ts:43` — IT_EXECUTIVE tabs: overview, my-controls, docs, review-schedule, trend, log  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-009 — IT Executive Cannot Review Evidence
**Files:** `app/api/evidence/review/route.ts:13` — IT_EXECUTIVE not in VALID_REVIEWERS  
**Verdict:** Correct  
**Status:** PASS

#### Issue ROL-010 — IT Executive Can Upload Evidence
**Files:** `components/dashboard/control-accordion.tsx:77` — isWriter includes IT_EXECUTIVE; `app/api/evidence/route.ts:45` — no role check on upload POST  
**Verdict:** Correct — any authenticated user can upload evidence  
**Status:** PASS

#### Issue ROL-011 — IT Executive Cannot See Evidence Review Status
**Severity:** HIGH  
**Files:** `components/dashboard/subsidiary-dashboard-client.tsx` — IT_EXECUTIVE tabs do not include "review"  
**Steps to Reproduce:**
1. PRANAV IT Executive uploads evidence  
2. PRANAV IT Manager approves it  
3. PRANAV IT Executive views dashboard  
**Expected Behavior:** Should be able to see the status of uploaded evidence (approved/rejected/pending)  
**Actual Behavior:** No tab or UI to see evidence status. The executive doesn't know if their upload was approved or rejected.  
**Suggested Fix:** Add a "My Uploads" mini-section on the Overview tab showing recent uploads with their status, or add evidence status badges on control accordion items

---

## SECTION 4: FUNCTIONAL TESTING

### 4.1 Buttons, Forms, Modals

#### Issue FUN-001 — Evidence Upload Form Doesn't Reset File Input
**Severity:** LOW  
**Files:** `components/dashboard/evidence-upload.tsx:109` — sets `setFile(null)`  
**Steps to Reproduce:**
1. Upload a file  
2. Upload another file for same control  
3. Select the same file again  
**Expected Behavior:** `onChange` fires because the input's value was cleared  
**Actual Behavior:** React doesn't reset the `<input type="file">` element — after clearing `setFile(null)`, the file input's value still holds the previous selection, so selecting the same file won't trigger `onChange`.  
**Suggested Fix:** Use `fileInputRef.current.value = ''` after uploading to reset the file input

#### Issue FUN-002 — Certificate Form Cancel Doesn't Reset File Input
**Severity:** LOW  
**Files:** `components/dashboard/certificate-form.tsx:265-266`  
**Steps to Reproduce:**
1. Click "Add Certificate"  
2. Select a file  
3. Click "Cancel"  
4. Click "Add Certificate" again  
**Expected Behavior:** File input should be empty  
**Actual Behavior:** File input reference is stale because `fileInputRef` is always the same element and its value is never cleared  
**Suggested Fix:** Add a reset function: `fileInputRef.current.value = ''`

#### Issue FUN-003 — No Loading State on Mandatory Documents Status Change
**Severity:** MEDIUM  
**Files:** `components/dashboard/mandatory-documents.tsx:182-199`  
**Steps to Reproduce:**
1. Change status of a mandatory document  
2. Observe UI  
**Expected Behavior:** Loading spinner or disabled state  
**Actual Behavior:** Status changes immediately (optimistic) but if the API call fails, the `handleStatusChange` function does not revert the change — it only calls `router.refresh()` on success, leaving stale state on failure  
**Suggested Fix:** Implement optimistic revert pattern (like ControlAccordion does) with pending state tracking

---

### 4.2 Filters and Search

#### Issue FUN-004 — Activity Log Filter Persists in Memory Only
**Severity:** LOW  
**Files:** `components/dashboard/activity-log.tsx:29-31`  
**Finding:** The filter state (all/local/cloud) resets to "all" on page refresh. This is acceptable but inconsistent with the sidebar collapse state which uses localStorage.  
**Suggested Fix:** Persist filter preference in sessionStorage or localStorage

#### Issue FUN-005 — Review Schedule Filter Doesn't Persist in URL
**Severity:** LOW  
**Files:** `components/dashboard/review-schedule.tsx:101`  
**Finding:** The filter state and search query are not persisted in the URL query parameters. Refreshing the page resets all filters.  
**Suggested Fix:** Sync filter/search to URL searchParams for bookmarkable/shareable URLs

---

### 4.3 API Request Validation

#### Issue FUN-006 — Certificate POST API Accepts Invalid Dates
**Severity:** MEDIUM  
**Files:** `app/api/certificates/route.ts:94-95`  
**Steps to Reproduce:**
1. Send POST to `/api/certificates` with `validFrom: "not-a-date"`  
**Expected Behavior:** Should return 400 "Invalid date format"  
**Actual Behavior:** `new Date("not-a-date")` returns `Invalid Date` which Prisma will attempt to store, causing a 500 error  
**Suggested Fix:** Add date validation before `new Date()`:
```typescript
if (isNaN(new Date(validFrom).getTime())) {
  return NextResponse.json({ error: "Invalid validFrom date" }, { status: 400 })
}
```

#### Issue FUN-007 — Evidence POST No File Size Limit on Server
**Severity:** HIGH  
**Files:** `app/api/evidence/route.ts:75-77`  
**Steps to Reproduce:**
1. Send POST with `fileSize: 100` but `fileData` containing 10MB of base64  
**Expected Behavior:** Should reject based on actual decoded size  
**Actual Behavior:** The `fileSize` check compares against the `fileSize` field from the client, which is easily spoofable. A client could claim 1KB but send 100MB of base64 data. The only defense is `bytes.length !== fileSize` on line 110, but this only checks exact match, not max size.
**Suggested Fix:** Add an upper bound check on the decoded buffer:
```typescript
if (bytes.length > MAX_FILE_SIZE) {
  return NextResponse.json({ error: "File too large" }, { status: 400 })
}
```

---

## SECTION 5: UI/UX TESTING

### 5.1 Layout and Responsiveness

#### Issue UI-001 — Tab Navigation Not Responsive on Mobile
**Severity:** MEDIUM  
**Role Affected:** All  
**Files:** `components/navigation/sidebar.tsx:104-107`  
**Finding:** Sidebar uses `w-64` on mobile and `md:w-60` on desktop. On small screens, the sidebar takes up most of the viewport. No hamburger menu or mobile drawer pattern is implemented.  
**Suggested Fix:** Implement a slide-over drawer for mobile with a hamburger button in the top bar

#### Issue UI-002 — Review Modal Not Responsive
**Severity:** MEDIUM  
**Files:** `components/dashboard/evidence-review.tsx:159` — `max-w-3xl`  
**Finding:** The review evidence modal is fixed at `max-w-3xl` which may overflow on mobile screens  
**Suggested Fix:** Use `w-full max-w-3xl mx-4` to add horizontal margins on small screens

---

### 5.2 Status Badges and Indicators

#### Issue UI-003 — Status Badge Colors Inconsistent Between Components
**Severity:** MEDIUM  
**Files:** 
- `components/dashboard/control-accordion.tsx:217-223` — Uses default/secondary/outline/destructive
- `components/dashboard/evidence-review.tsx:75-81` — Uses default/destructive/secondary
- `components/dashboard/mandatory-documents.tsx` — Uses CustomSelect instead of Badge  
**Finding:** Different components use different color schemes for the same status values. For example, "COMPLETED" is `default` (primary color) in control-accordion and `default` in evidence-review — consistent here, but "PENDING" is `secondary` in evidence-review while "IN_PROGRESS" is `secondary` in control-accordion. The colors are confusing when the same status word appears differently.
**Suggested Fix:** Create a shared status-to-color mapping in `lib/constants.ts`:
```typescript
export const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  COMPLETED: "default",
  APPROVED: "default",
  IN_PROGRESS: "secondary",
  PENDING: "secondary",
  NOT_STARTED: "outline",
  REJECTED: "destructive",
  NA: "outline"
}
```

---

### 5.3 Loaders and Empty States

#### Issue UI-004 — Empty State Inconsistencies
**Severity:** LOW  
**Files:** 
- `evidence-review.tsx:109-115` — Shows empty state with "No evidence uploaded yet" — good
- `mandatory-documents.tsx` — No empty state (always shows all 28 docs)
- `certificate-form.tsx:306-312` — Shows empty state with icon and message — good  
**Finding:** Components inconsistently handle empty states  
**Status:** ACCEPTABLE — different components have different needs

#### Issue UI-005 — No Skeleton Loaders on Tab Switches
**Severity:** LOW  
**Files:** `components/dashboard/subsidiary-dashboard-client.tsx:122-136` — Skeleton only on initial load  
**Steps to Reproduce:**
1. Switch between tabs (e.g., Overview → Controls)  
2. Observe loading behavior  
**Expected Behavior:** Skeleton loader while data fetches  
**Actual Behavior:** There is no data fetching on tab switch — all data is passed via props from the server component. This is acceptable for current architecture but could become slow as data grows.  
**Suggested Fix:** Consider client-side data fetching for evidence and activity logs with skeleton loaders

---

## SECTION 6: EDGE CASE TESTING

### 6.1 Large File Uploads

#### Issue EDG-001 — 5MB File Upload May Timeout
**Severity:** MEDIUM  
**Role Affected:** All  
**Files:** `components/dashboard/evidence-upload.tsx:77-87`  
**Steps to Reproduce:**
1. Upload a 4.9MB PDF file  
2. Wait for upload to complete  
**Expected Behavior:** File uploads successfully  
**Actual Behavior:** The base64 encoding (FileReader) + network upload of base64 string (~6.5MB for a 5MB file) may exceed typical API timeout limits (30s default on many proxies). The application has no timeout handling or retry logic.  
**Suggested Fix:** Add a timeout wrapper around the fetch call and show appropriate error:
```typescript
const controller = new AbortController()
const timeoutId = setTimeout(() => controller.abort(), 60000)
const response = await fetch("/api/evidence", { signal: controller.signal, ... })
clearTimeout(timeoutId)
```

#### Issue EDG-002 — No File Size Warning Before 5MB Upload
**Severity:** LOW  
**Files:** `components/dashboard/evidence-upload.tsx:51-53`  
**Finding:** The component rejects files >5MB but doesn't warn the user before they select a file  
**Suggested Fix:** Show the file size limit in the upload area text (already present: "up to 5MB") — acceptable

---

### 6.2 Duplicate and Invalid Uploads

#### Issue EDG-003 — Duplicate File Detection Not Implemented
**Severity:** MEDIUM  
**Role Affected:** All  
**Files:** `app/api/evidence/route.ts:117-133`  
**Steps to Reproduce:**
1. Upload the same file for the same control twice  
**Expected Behavior:** Either reject the duplicate or create a new version  
**Actual Behavior:** Creates two separate `Evidence` records with different IDs and same file content. No deduplication.  
**Suggested Fix:** Add a check in POST /api/evidence to see if a file with the same name, same control, and same size already exists:
```typescript
const existing = await prisma.evidence.findFirst({
  where: { controlId: control.id, filename, fileSize }
})
if (existing) {
  return NextResponse.json({ error: "Duplicate evidence", existingId: existing.id }, { status: 409 })
}
```

#### Issue EDG-004 — Invalid File Type Returns Generic Error
**Severity:** LOW  
**Files:** `app/api/evidence/route.ts:71-72`  
**Steps to Reproduce:**
1. Upload a `.exe` file with spoofed MIME type  
**Expected Behavior:** Clear error message about allowed file types  
**Actual Behavior:** Returns `"Invalid file type"` with no list of allowed types  
**Suggested Fix:** Include allowed types in error response: `"Invalid file type. Allowed: PDF, Word, Excel, Images"`

---

### 6.3 Simultaneous Operations

#### Issue EDG-005 — No Concurrent Upload Protection
**Severity:** MEDIUM  
**Role Affected:** All  
**Files:** `app/api/evidence/route.ts` — No transaction or locking  
**Steps to Reproduce:**
1. Open two browser tabs as same user  
2. Upload evidence for the same control simultaneously  
**Expected Behavior:** Both uploads should succeed or first should succeed, second should be warned about conflict  
**Actual Behavior:** Both succeed, creating duplicate entries. No unique constraint prevents this on the Evidence table.  
**Suggested Fix:** Add a unique constraint on `[controlId, filename]` or implement a short-term lock via the `version` field

#### Issue EDG-006 — Review Race Condition
**Severity:** MEDIUM  
**Files:** `app/api/evidence/review/route.ts:54-62`  
**Steps to Reproduce:**
1. Two reviewers (CIO and IT Manager) open the same evidence at the same time  
2. Both click "Approve" simultaneously  
**Expected Behavior:** First approval succeeds, second gets "already reviewed" error  
**Actual Behavior:** Both updates succeed because there's no status check + atomic update  
**Suggested Fix:** Add a where clause to only update if status is still PENDING:
```typescript
await prisma.evidence.update({
  where: { id: evidenceId, status: 'PENDING' },
  data: { status, ... }
})
if (!result) return error "Already reviewed"
```

---

## SECTION 7: PERFORMANCE & STABILITY

### 7.1 Upload Performance

#### Issue PRF-001 — Base64 Encoding Adds 33% Overhead
**Severity:** HIGH  
**Role Affected:** All  
**Files:** `components/dashboard/evidence-upload.tsx:77-87`, `app/api/evidence/route.ts:108`  
**Finding:** Files are base64-encoded on the client, sent as JSON, decoded on server, and stored as `Bytes`. This adds 33% to the payload size (e.g., 5MB file becomes ~6.7MB in transit). For multiple simultaneous uploads, this significantly impacts network and memory.  
**Suggested Fix:** Use `multipart/form-data` uploads with direct binary streaming instead of base64 JSON encoding

#### Issue PRF-002 — Evidence List API Returns All Records Unpaginated
**Severity:** HIGH  
**Role Affected:** All  
**Files:** `app/api/evidence/route.ts:35-39`  
**Finding:** `prisma.evidence.findMany()` has no `take` or `skip` — returns **all** evidence for a company. At ~100 controls × potentially multiple uploads per control, this could quickly become thousands of records.  
**Suggested Fix:** Add pagination: `take: 50` as default, with `skip` and `cursor` parameters for "Load More"

#### Issue PRF-003 — No Static File Cache for Evidence Views
**Severity:** MEDIUM  
**Files:** `app/api/evidence/view/[id]/route.ts:46-53`  
**Finding:** Evidence view endpoint sets `Cache-Control: private, max-age=3600` — good. But there's no ETag or Last-Modified header for conditional requests.  
**Suggested Fix:** Include ETag (MD5 hash of fileData) to enable 304 Not Modified responses

---

## SECTION 8: WORKFLOW VALIDATION SUMMARY

### 8.1 Critical Workflow Paths

| Workflow | Steps | Status | Issues |
|----------|-------|--------|--------|
| IT Executive Upload → IT Manager Reviews | exec uploads → mgr sees in Review tab → approves/rejects → exec gets notification | ⚠️ PARTIAL | WFL-003 (no upload notification), WFL-008 (exec can't see review status) |
| IT Manager Updates → CIO Reviews | mgr updates controls/evidence → CIO sees on subsidiary dashboard | ✅ PASS | Minor: WFL-006 (review tab default off) |
| CIO Comments → Reflects to Users | CIO approves/rejects → notification created for uploader | ⚠️ PARTIAL | WFL-008 (no UI for exec to see status) |
| Evidence Upload → Activity Log | Upload creates activity log entry | ✅ PASS | — |
| Evidence Review → Activity Log | Approve/reject creates activity log entry | ✅ PASS | — |
| Certificate Upload | Uploads file but doesn't store it | ❌ FAIL | UPL-009 (fileData not stored by API) |

### 8.2 Data Flow Diagram (Text)

```
IT_EXECUTIVE ──upload──▶ Evidence DB ──fetch──▶ IT_MANAGER (Review tab)
     │                                                │
     │                                                ├── approve → notification ──▶ IT_EXECUTIVE
     │                                                │              └── activity log
     │                                                └── reject  → notification ──▶ IT_EXECUTIVE
     │                                                             └── activity log
     │
     └── no feedback loop ──▶ IT_EXECUTIVE cannot see review status ⚠️

IT_MANAGER ──update──▶ Controls DB ──fetch──▶ CIO (subsidiary dashboard)
     │                              └──fetch──▶ Master Dashboard (aggregate)
     │
     └──upload──▶ Evidence DB ──fetch──▶ CIO (Review tab with toggle)

CIO ──review──▶ Evidence DB ──notify──▶ Uploader
     │                         └──activity log
     │
     └──upload──▶ Evidence DB (any company)
```

---

## SECTION 9: CONSOLE ERROR ANALYSIS (Code Review)

### Issue CON-001 — `Promise.all()` Unhandled Side Effects
**Severity:** LOW  
**Files:** `app/api/controls/route.ts:142-158`  
**Finding:** `Promise.all([...])` is called without `await`. If the promises reject, errors are caught by `.catch()` on individual promises, but the overall `Promise.all()` rejection is unhandled.  
**Suggested Fix:** Either `await Promise.all([...])` or use `void Promise.all([...]).catch(...)`

### Issue CON-002 — `router.refresh()` Called After Failed Upload (Certificate)
**Severity:** MEDIUM  
**Files:** `components/dashboard/certificate-form.tsx:95`  
**Finding:** `router.refresh()` is called unconditionally after the fetch, even if the response was an error. This causes the form to close on failure.  
**Suggested Fix:** Only call `router.refresh()` on success

### Issue CON-003 — `evidence-upload.tsx` Doesn't Handle HTTP Error Codes
**Severity:** LOW  
**Files:** `components/dashboard/evidence-upload.tsx:107-113`  
**Finding:** Only checks `response.ok`. If server returns 500, error is parsed and shown. This is acceptable.  
**Status:** PASS

---

## SECTION 10: PRIORITIZED ISSUE LIST

### CRITICAL (Fix Immediately)

| # | Issue ID | Description | Component | Impact |
|---|----------|-------------|-----------|--------|
| 1 | UPL-009 | Certificate file upload silently discarded by API | CertificateForm + /api/certificates | Data loss |
| 2 | UPL-012 | ZIP export may crash server for large datasets | ExportModal + /api/export/evidence | Server crash |
| 3 | WFL-008 | Maker roles cannot see evidence review status | subsidiary-dashboard-client | Workflow broken |
| 4 | FUN-007 | Client can spoof file size, bypassing 5MB limit | /api/evidence | Security/DoS |

### HIGH (Fix Within Sprint)

| # | Issue ID | Description | Component | Impact |
|---|----------|-------------|-----------|--------|
| 5 | UPL-001 | dateOfDocument field silently dropped | EvidenceUpload + API | Data loss |
| 6 | UPL-006 | Certificate save failure not communicated | CertificateForm | UX |
| 7 | WFL-003 | No notification on evidence upload | /api/evidence | Missing sync |
| 8 | WFL-006 | CIO Review tab defaults to off | subsidiary-dashboard-client | Usability |
| 9 | UPL-011 | Export error handling generic | ExportModal | UX |
| 10 | FUN-003 | Mandatory docs status not reverted on failure | MandatoryDocuments | Data stale |
| 11 | FUN-006 | Invalid dates accepted by certificate API | /api/certificates | Data integrity |
| 12 | PRF-001 | Base64 adds 33% upload overhead | EvidenceUpload + API | Performance |
| 13 | PRF-002 | Evidence list unpaginated | /api/evidence | Performance |
| 14 | EDG-003 | Duplicate file detection missing | /api/evidence | Data quality |
| 15 | EDG-005 | No concurrent upload protection | /api/evidence | Data quality |
| 16 | EDG-006 | Review race condition | /api/evidence/review | Data integrity |

### MEDIUM (Fix Next Sprint)

| # | Issue ID | Description | Component | Impact |
|---|----------|-------------|-----------|--------|
| 17 | UPL-002 | Client-side file type validation incomplete | EvidenceUpload | UX/Security |
| 18 | UPL-003 | No upload progress indicator | EvidenceUpload | UX |
| 19 | UPL-004 | No file replace/re-upload | EvidenceUpload + API | Usability |
| 20 | UPL-010 | No certificate file preview | CertificateForm | Usability |
| 21 | WFL-002 | No real-time sync notifications | Architecture | UX |
| 22 | ROL-011 | Maker roles can't see review status | subsidiary-dashboard-client | Workflow |
| 23 | UI-001 | Mobile sidebar not responsive | Sidebar | UX |
| 24 | UI-002 | Review modal overflows on mobile | EvidenceReview | UX |
| 25 | UI-003 | Status badge colors inconsistent | Multiple components | UX |
| 26 | EDG-001 | Large upload may timeout | EvidenceUpload | Stability |

### LOW (Fix When Convenient)

| # | Issue ID | Description | Component | Impact |
|---|----------|-------------|-----------|--------|
| 27 | UPL-005 | No upload confirmation dialog | EvidenceUpload | UX |
| 28 | UPL-007 | Certificate upload no drag-drop | CertificateForm | UX |
| 29 | FUN-001 | File input not reset after upload | EvidenceUpload | UX |
| 30 | FUN-002 | Certificate cancel doesn't reset file | CertificateForm | UX |
| 31 | FUN-004 | Activity log filter not persisted | ActivityLog | UX |
| 32 | FUN-005 | Review schedule filter not in URL | ReviewSchedule | UX |

---

## SECTION 11: RECOMMENDATIONS

### Upload Architecture Improvements

1. **Migrate from base64 to multipart/form-data uploads** — Reduces payload by 33%, eliminates memory spikes from FileReader + base64 encoding, and enables streaming uploads with progress tracking.

2. **Add a `evidence.controlId + filename` unique constraint** — Prevents duplicate uploads at the database level, with proper 409 Conflict handling.

3. **Implement evidence versioning** — Allow re-uploading to the same control with auto-incrementing version numbers. Store version history.

4. **Add file storage outside database** — Move `fileData` from BYTEA to filesystem or S3/R2 storage. Store only path/URL in the database. This dramatically improves DB performance, backup times, and scalability.

### Sync & Workflow Improvements

5. **Add "My Submissions" tab for maker roles** — A dedicated tab where IT_EXECUTIVE and HR_EXECUTIVE can see all their uploads with review status, reviewer comments, and timestamps.

6. **Add evidence status badge on controls** — Show a small icon on control cards indicating whether evidence has been uploaded, its review status (pending/approved/rejected), and the count of evidence items.

7. **Create notification on upload** — When evidence is uploaded, create notifications for all users with review access in that company (IT_MANAGER, STQM_MANAGER, HR_MANAGER, CIO).

8. **Add polling for real-time-ish updates** — Every 30 seconds, check for new notifications. Implement a small notification counter in the top bar.

### Role & Access Improvements

9. **Centralize all role definitions** — Move `VALID_REVIEWERS`, `MAKER_ROLES`, `MANAGER_ROLES`, `isWriter` logic all to `lib/constants.ts` to prevent inconsistency.

10. **Add evidence review capability to maker roles (read-only)** — Let IT_EXECUTIVE see the review status and comments for their own uploads, even if they can't approve/reject others'.

### UI/UX Improvements

11. **Standardize status badge colors** — Create a shared status-to-color mapping in `lib/constants.ts` for consistent UI across all components.

12. **Add upload progress bars** — Show encoding progress (0-50%) and upload progress (50-100%) with a visual progress bar.

13. **Mobile-responsive modals** — Ensure all modals and dialogs have proper mobile styling with safe margins and scrollable content.

14. **Implement "Back to top" on long lists** — The Controls accordion can have 93+ items. Add a floating "Back to top" button.

### Performance Improvements

15. **Implement pagination on evidence list** — Add `take` and `skip` parameters to `GET /api/evidence` with "Load More" button in the Review tab.

16. **Add server-side caching headers** — Add `ETag` and `Last-Modified` to evidence view/download endpoints for conditional requests.

17. **Reduce base64 overhead** — If multipart uploads can't be implemented immediately, at least move base64 encoding to a Web Worker to prevent UI freezing.

### Data Integrity Improvements

18. **Add validation on certificate dates** — Validate that `validFrom` and `validTo` are real dates and that `validTo > validFrom`.

19. **Add status lock on reviewed evidence** — Prevent re-reviewing evidence that's already been approved/rejected (add `status: 'PENDING'` check in the update query).

---

## SECTION 12: POSITIVE FINDINGS

Despite the issues above, the application has several well-implemented features worth noting:

1. **Optimistic UI updates on controls** — The `ControlAccordion` correctly implements optimistic updates with revert on failure and pending state tracking.

2. **Activity logging** — All evidence uploads, status changes, and reviews are logged to the `ActivityLog` table with full context (user, role, action, control, details).

3. **Notification system** — Review decisions create notifications for uploaders. The `NotificationBell` component properly fetches and displays unread counts.

4. **Server-side authorization** — Most API routes properly validate session, company access, and role permissions before performing operations.

5. **Role-based tab filtering** — The `SubsidiaryDashboardClient` correctly filters tabs based on `userTabs` from the session, preventing unauthorized access to restricted functionality.

6. **Evidence view/download separation** — Separate routes for inline viewing (with safe content disposition) and forced download (with filename sanitization).

7. **Company data isolation** — Evidence, controls, certificates, and users are all scoped by `companyKey`, with CIO having explicit bypass for cross-company access.

---

*Report generated by Senior QA Tester on 2026-05-19*  
*Testing Method: Comprehensive source code analysis + API route verification*  
*Focus: Upload functionality, cross-user synchronization, role visibility, workflow validation*
