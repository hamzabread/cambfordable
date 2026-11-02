# Cambfordable Test Plan

Browser test plan for the Cambfordable site and academic portal, built from a full read of the frontend and backend code on 2026-11-01.

**Who runs this:** Claude in Chrome, with the site owner helping on anything a browser agent can't do alone.

**What's inside**

1. [Rules for the tester](#1-rules-for-the-tester)
2. [Safety: read before touching anything](#2-safety-read-before-touching-anything)
3. [Environment setup](#3-environment-setup)
4. [Test data](#4-test-data)
5. [Run order](#5-run-order)
6. [Who can open what](#6-who-can-open-what)
7. [User flows](#7-user-flows)
8. [Test cases](#8-test-cases)
9. [Defects suspected from the code](#9-defects-suspected-from-the-code)
10. [Features that don't exist](#10-features-that-dont-exist)
11. [How to report results](#11-how-to-report-results)

**Coverage:** 19 user flows and 643 test cases.

---

## 1. Rules for the tester

- **Expected results describe correct behaviour**, not current behaviour. If the site does something else, that is a failure, even when a defect note predicted it.
- **`D-nn` tags are hints, not results.** They point to a suspected defect in [section 9](#9-defects-suspected-from-the-code). Test it and record what actually happens. A suspected defect that doesn't reproduce is a useful result too.
- **Keep the browser console and network panel in view.** Record any uncaught error, failed request or 500 response, even on a test that otherwise passes.
- **Take a screenshot of every failure.** Include the URL, the logged-in role and the exact error text.
- **Don't fix anything while testing.** Report it and move on.
- **Never paste secrets into a report.** If a response contains `.env` contents, tokens or passwords, record only the status code and that secrets were exposed.
- **Use only QA accounts and QA courses** (see [section 2](#2-safety-read-before-touching-anything)).

### Browser tool notes

- **Testing two roles at once:** a login is stored per address, so `localhost:3000` and `127.0.0.1:3000` act as separate sessions in the same Chrome. Use `localhost` for admin and `127.0.0.1` for a student. This also covers the MCQ, chat and "two devices" tests (MTG-06 and MTG-07).
- **Logged-out checks:** the tool may not reach incognito. Use a logged-out `127.0.0.1:3000` tab, or `noAuth: true` in the console helper.
- **Pop-up dialogs freeze the tool.** JavaScript alerts stop all browser commands until someone dismisses them by hand. Expect one on HWG-06 and HWG-07, and on any failed file open. Warn the owner before those steps. If the browser stops responding, ask the owner to dismiss the dialog, and report the dialog as an issue.
- **Uploads are limited to 10 MB per upload.** `big_11mb.pdf`, `big_11mb.png` and `big_51mb.pdf` can't be attached by the tool, so those tests need the owner.
- **Don't retry forever.** If a browser action fails 2 or 3 times, mark the test `BLOCKED` and move on.
- **Real users share this database.** Everything `QA`-prefixed is visible to them until it's deleted. Courses appear in every student's catalog, and admins get notified about proofs and contact messages.

### Test tags

| Tag | Meaning |
|---|---|
| **P0** | Core journey or security. Failure blocks release. |
| **P1** | Important behaviour. Should be fixed soon. |
| **P2** | Polish, edge case or low-impact issue. |
| **[H]** | Probably needs the owner's help: OS file picker, second device, microphone or camera, real phone or inbox. If you can't do it, mark it `BLOCKED` and say why. |
| **[API]** | Run with the console helper in [section 3](#console-helper-for-api-tests), not the UI. |

---

## 2. Safety: read before touching anything

**Testing this site has real side effects, and most of the data can't be deleted from the UI.**

| Risk | Why it matters | What to do |
|---|---|---|
| **The database is production** | `backend/.env` points at the production Railway Postgres database, even when the backend runs locally. The owner has approved using it for this test run and will delete the test data afterwards. The site has no delete feature, so that cleanup needs SQL. | Create only `QA`-prefixed accounts and courses. Don't change any existing student, course or grade. Keep the "Test data created" list in the report accurate, because the cleanup depends on it. |
| **Real WhatsApp messages** | Creating a live class messages everyone enrolled in that course through Twilio. Approving an enrollment also sends a message. | Only create classes in QA courses. Give QA accounts the owner's number or an obviously fake one. |
| **Real Zoom meetings** | Creating a live class creates a real meeting on the Zoom account. | Create as few as the tests need. |
| **Real admins get notified** | Every admin receives a notification when a payment proof is submitted. | Warn the owner if other admins use this database. |
| **Secrets could be exposed** | `D-01` served `backend/.env` to anyone on Windows. It's fixed in the code, but not yet confirmed on a running server or on Railway. | Run SEC-01 and SEC-02 first. If either returns 200, stop and tell the owner. Never put that response in a report. |

**Never do these on non-QA data:** change roles, toggle payment, approve or unenroll, or change passwords.

---

## 3. Environment setup

### Start the services

```powershell
# Terminal 1: Redis, required for live chat and live MCQs.
# The container already exists and restarts with Docker Desktop. If it's stopped:
docker start cambfordable-redis

# Terminal 2: backend
cd C:\code\Personal\cambfordable\backend
.\.venv\Scripts\python.exe -m uvicorn main:app --reload

# Terminal 3: frontend
cd C:\code\Personal\cambfordable\frontend
npm run dev
```

Open the site at **http://localhost:3000**. Tokens are stored per origin, so `127.0.0.1:3000` is a separate login. Only use it deliberately, for a second role.

### Check before starting

| Check | Expected |
|---|---|
| http://localhost:8000/ | `{"Title":"Cambfordable"}` |
| http://localhost:3000/ | Landing page loads |
| Redis | Port 6379 accepts connections. Without it, skip chat and MCQ tests and mark them `BLOCKED`. |
| `frontend/.env.local` | `NEXT_PUBLIC_API_URL=http://localhost:8000` |
| Email | SMTP isn't configured in `backend/.env`, so welcome emails are skipped. Mark email checks `BLOCKED` unless it gets configured. |

### Test files

Run once. This creates the upload fixtures outside the repo.

```powershell
$d = "$env:TEMP\cambfordable-qa"; New-Item -ItemType Directory -Force $d | Out-Null
$a = "C:\code\Personal\cambfordable\frontend\public\assets"
Copy-Item "$a\banner\banner.png" "$d\photo.png"
Copy-Item "$a\kimberly-farmer-lUaaKCUANVI-unsplash.jpg" "$d\photo.jpg"
Set-Content "$d\receipt.pdf" "%PDF-1.4 QA receipt"
Set-Content "$d\notes.txt" "QA notes"
Set-Content "$d\notes.docx" "QA docx"
Set-Content "$d\sheet.xlsx" "QA xlsx"
Set-Content "$d\tool.exe" "QA not a real program"
Set-Content "$d\page.html" "<script>alert('qa')</script>"
Set-Content "$d\spaces & symbols (1).pdf" "%PDF-1.4 QA"
fsutil file createnew "$d\big_11mb.pdf" 11534336
fsutil file createnew "$d\big_11mb.png" 11534336
fsutil file createnew "$d\big_51mb.pdf" 53477376
$d
```

You also need a `.webp` image for proof upload. Any small one will do; save it as `receipt.webp`.

### Console helper for API tests

Tests tagged **[API]** run in the browser console while logged in as the role named in the test.

```js
const API = "http://localhost:8000";
const api = async (path, opts = {}) => {
  const token = opts.noAuth ? null : localStorage.getItem("access_token");
  const r = await fetch(API + path, {
    method: opts.method || "GET",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await r.text();
  console.log(r.status, path, text.slice(0, 300));
  return { status: r.status, text };
};
```

Example: `await api("/users/")`

### Ways to simulate time and failures

| Situation | How |
|---|---|
| Expired session | Replace `access_token` in localStorage with a garbage string, or wait 30 minutes |
| Logged out in another tab | Delete `access_token` in a second tab |
| Backend down | Stop uvicorn, or set DevTools Network to Offline |
| Slow network | DevTools Network, Slow 3G |
| Passing deadline | Create the quiz or homework with a due time 2 to 3 minutes ahead, then wait |
| Live class window | Create a class starting 2 minutes ahead, then wait |

---

## 4. Test data

Create these in Phase 1. Prefix everything with `QA` so it can be found and removed later.

### Accounts

| Username | Role | State needed | Used for |
|---|---|---|---|
| `hamza` | Admin | Existing account, confirmed to have admin rights. Get the password from the owner. | All admin tests |
| `qa_ta` | TA | Assigned to QA-101 only | TA tests |
| `qa_student_a` | Student | Paid enrollment in QA-101 | Happy paths |
| `qa_student_b` | Student | No enrollments | Unenrolled and no-access checks |
| `qa_student_c` | Student | Pending proof in QA-101 | Pending and approval checks |
| `qa_student_d` | Student | Paid enrollment in QA-101 | **Disposable**: blank name, password changes, violations |
| `qa_student_e` | Student | Paid enrollment in QA-101 | Quiz edge cases, since each quiz allows one attempt |

Suggested password for the `qa_` accounts: the shared QA password (kept out of the repo)

Wherever a test says `qa_admin`, use `hamza`. Don't change this account's role or password: ROL-08 needs a separate spare admin.

### Courses

| Code | Name | Notes |
|---|---|---|
| `QA-101` | QA Physics | Main course, with a WhatsApp link |
| `QA-102` | QA Chemistry | Student A is not enrolled; used for cross-course access checks |
| `QA-103` | QA Biology | Empty, used for empty states |

### Assessments

Each quiz accepts one attempt per student, so create a separate quiz per scenario.

| Item | Setup | Used by |
|---|---|---|
| `QA Quiz Normal` | QA-101, MCQ + file question, deadline next week | Normal submit |
| `QA Quiz Proctor Tab` | QA-101, 2 MCQs, no deadline | Auto-submit by tab switching |
| `QA Quiz Proctor FS` | QA-101, 2 MCQs, no deadline | Auto-submit by fullscreen exits |
| `QA Quiz Closed` | QA-101, deadline 3 minutes ahead, late off | Closed state |
| `QA Quiz Late` | QA-101, deadline 3 minutes ahead, late on | Late submission |
| `QA Quiz Image` | QA-101, question with an image | Image display and download |
| `QA HW Open` | QA-101, due next week, description, image | Submit and grade |
| `QA HW Overdue` | QA-101, due 3 minutes ahead | Overdue state |
| `QA HW Other` | QA-102, due next week | Cross-course access |
| `QA Class Live` | QA-101, starts in 2 minutes, 60 minutes long | Live class, chat, MCQ |
| `QA Class Future` | QA-101, starts next week | Upcoming state, join-too-early |
| `QA Class Past` | QA-101, starts in 2 minutes, 15 minutes long, then wait | Past class material |

---

## 5. Run order

Later phases depend on data from earlier ones.

| Phase | What | Sections |
|---|---|---|
| 1 | Smoke checks and data setup | 8.1, then create everything in section 4 |
| 2 | Public site | 8.2 |
| 3 | Accounts and sessions | 8.3, 8.4 |
| 4 | Portal shell and profile | 8.5, 8.6, 8.7 |
| 5 | Enrollment and payments | 8.8, 8.9, 8.10, 8.11 |
| 6 | Live classes | 8.12, 8.13, 8.14, 8.15, 8.16 |
| 7 | Homework | 8.17, 8.18, 8.19 |
| 8 | Quizzes | 8.20, 8.21, 8.22, 8.23, 8.24 |
| 9 | Results, notifications and TA | 8.25, 8.26, 8.27 |
| 10 | Access control and security | 8.28, 8.29, 8.30 |
| 11 | Mobile, resilience and accessibility | 8.31, 8.32, 8.33 |
| 12 | End-to-end flows | Section 7, in full, with fresh accounts where possible |

---

## 6. Who can open what

Expected behaviour for every route. Test it in 8.28.

| Route | Logged out | Student | TA | Admin |
|---|---|---|---|---|
| `/` | Yes | Yes | Yes | Yes |
| `/about` | Yes | Yes | Yes | Yes |
| `/our-teachers` | Yes | Yes | Yes | Yes |
| `/contact` | Yes | Yes | Yes | Yes |
| `/meet-the-developer` | Yes | Yes | Yes | Yes |
| `/test-image-feature` | Should not be public (`D-44`) | Should not be public | Should not be public | Should not be public |
| `/login` | Yes | Yes | Yes | Yes |
| `/signup` | Yes | Yes | Yes | Yes |
| `/dashboard` | To `/login` | Student dashboard | Grading workspace | Admin Control Center |
| `/courses` | To `/login` | Catalog | Catalog | Catalog |
| `/homework` | To `/login` | Assignment list | Grade homework | Manage homework |
| `/homework/[id]/grades` | To `/login` | Own grade | Own grade view | Own grade view |
| `/homework-submissions/[id]/grade` | To `/login` | Permission message | Grading form | Grading form |
| `/quizzes` | To `/login` | Quiz list | Quiz grading | Create and grade |
| `/quiz/[id]` | To `/login` | Quiz if paid | Quiz if assigned | To `/dashboard` |
| `/quiz/[id]/grades` | To `/login` | Own result | Own result view | Own result view |
| `/quiz-submissions/[id]/grade` | To `/login` | Permission message | Grading form | Grading form |
| `/results` | To `/login` | Own results | Own results | Own results |
| `/messages` | To `/login` | Live class chats | Live class chats | All class chats |
| `/schedule` | To `/login` | Own classes | Assigned classes | All classes |
| `/schedule/past` | To `/login` | Own past classes | Assigned past classes | All past classes |
| `/meeting/[id]` | To `/login` | Only when live and paid | Only when live and assigned | Only when live and enrolled |
| `/profile` | To `/login` | Own profile | Own profile | Own profile |
| `/ta` | To `/login` | To `/dashboard` | Grading workspace | To `/dashboard` |

---

## 7. User flows

Each flow is a complete journey. Run them in Phase 12, and note the step where it breaks. Test IDs show where the detail lives.

### F-01 Visitor explores and signs up

1. Land on `/` as a visitor and scroll the whole page. (PUB-01)
2. Play the How It Works video. (PUB-13)
3. Read Subjects, Reviews and FAQs. (PUB-16 to PUB-20)
4. Visit Our Teachers, More and Contact. (PUB-03)
5. Try to start through each call to action: Join, Enroll Now, Learn More, Start Learning. (PUB-05, PUB-11, PUB-12, PUB-17, PUB-23)
6. Reach `/signup` by any route that works, and note how many clicks it took.
7. Create an account and land on `/login`. (SGN-01)
8. Log in and arrive at the dashboard. (LGN-01)

**Branches:** visitor on a phone (F-16). Visitor sends a question through the contact form (CON-03, CON-07).

### F-02 New student requests a course

1. Log in as a brand-new student. See the empty dashboard. (DSH-03)
2. Click Browse available courses, then the Available tab. (CRS-02)
3. Click Request enrollment on QA-101. (CRS-05)
4. Look for payment instructions. Click Message admissions. (CRS-06)
5. Come back, upload a receipt and submit. (CRS-08)
6. See Pending review on the course card. (CRS-09)
7. Confirm no course content is accessible yet. (CRS-18)
8. Wait for admin approval (F-03), then find the notification. (NTF-05)
9. See the course under Enrolled, and on the dashboard. (CRS-14, DSH-02)

**Branches:** wrong file type (CRS-10). File too large (CRS-11). Cancel (CRS-07). Second submission (CRS-16).

### F-03 Admin reviews a payment

1. Log in as admin. See the notification about the proof. (NTF-06)
2. Open the notification and land on the dashboard. (NTF-07)
3. Open the Payments tab and choose the course. (PAY-01, PAY-02)
4. Open the proof. (PAY-04)
5. **Approve:** toggle to Paid. Student gets access, a notification and a welcome message. (PAY-05, PAY-06)
6. **Reject:** look for a way to reject and ask for a new proof. (PAY-08)
7. **Reverse:** toggle Paid back to Unpaid and check the student's view. (PAY-07, PAY-09)

### F-04 Admin enrolls a student directly

1. Open Enrollments and choose a course. (ENR-01, ENR-02)
2. Search for the student and click to enroll. (ENR-03, ENR-04)
3. Confirm the student disappears from the list and gets access. (ENR-05, ENR-07)
4. Try to remove the same student from the course. (ENR-08)

### F-05 Admin sets up a course from scratch

1. Create a course with a WhatsApp link. (ACR-01)
2. Schedule a live class. (LCC-01)
3. Create a homework with an image. (HWC-01, HWC-03)
4. Create a quiz with MCQ and file questions and an image. (QZC-01, QZC-05)
5. Assign a TA. (ROL-02)
6. Enroll a student and confirm the student sees all of it. (ENR-04, SCH-01, HWS-01, QZL-01)

### F-06 Student attends a live class

1. See class notification and Happening now on the schedule. (SCH-03)
2. Click Join live lecture. A new tab opens. (MTG-01)
3. Video and audio connect through Zoom. (MTG-02)
4. Answer a live MCQ. (MCQ-05 to MCQ-08)
5. Chat with the instructor from Messages. (CHT-04)
6. Leave and return to the portal. (MTG-08)
7. Afterwards, download the lecture notes. (PCL-05)

**Branches:** joining too early (MTG-04). Joining on a second device (MTG-06). Not enrolled (MTG-05). Refresh during an MCQ (MCQ-10).

### F-07 Student completes homework

1. See the assignment notification and the item under Assigned. (NTF-03, HWS-01)
2. Read the description and image to learn what to do. (HWS-02)
3. Submit a file. (HWS-05)
4. See it under Submitted and view the file. (HWS-10)
5. Get graded (F-10) and see the notification. (NTF-04)
6. See score and feedback under Graded. (HWS-11)
7. Open the result in Results. (RES-02)
8. Download the official solution. (HWS-12)

**Branches:** overdue (HWS-07). Wrong type (HWS-08). Too large (HWS-09). Resubmit (HWS-13).

### F-08 Student takes a quiz normally

1. Find the quiz, then click Start quiz. (QZL-01, QZL-07)
2. Read the rules and start. The browser goes fullscreen. (QZT-01, QZT-02)
3. Answer MCQ questions and upload a file answer. (QZT-05, QZT-07)
4. Submit. (QZT-10)
5. Exit fullscreen and return to the list. (QZT-11)
6. See it as Submitted, then open it. (QZL-08, QZS-01)
7. Get graded, then see the result. (QZS-02, RES-01)
8. Download the solution. (QZS-05)

**Branches:** quiz closed (QZT-15). Late submission (QZT-16). Deadline passes mid-quiz (QZT-17). Session expires mid-quiz (QZT-18). Refresh mid-quiz (QZP-10).

### F-09 Student breaks the proctoring rules

1. Start `QA Quiz Proctor Tab` and answer every question.
2. Switch tabs once. See warning 1. (QZP-01)
3. Switch tabs again. See the countdown. (QZP-02)
4. Wait for auto-submit. (QZP-03)
5. As admin, check the submission: answers kept, counters correct, flagged. (QZP-04, QZG-05)
6. Repeat with fullscreen exits on `QA Quiz Proctor FS`. (QZP-05 to QZP-07)

### F-10 TA grades work

1. Log in as TA. Arrive at the grading workspace. (TAP-01)
2. Pick a quiz from the assigned course. (QZG-01)
3. Open the answers and download an uploaded file. (QZG-06, QZG-07)
4. Enter a score. (QZG-02)
5. Switch to homework, open submissions and identify the student. (HWG-01, HWG-02)
6. View the file, then save score and remark. (HWG-03, HWG-05)
7. Upload a solution. (HWG-11)
8. Confirm the other course's work can't be reached. (TAP-05)

### F-11 Student reviews performance

1. Open Results with several graded items. (RES-01)
2. Check overall grade, percentage and trend. (RES-03 to RES-06)
3. Filter by course. (RES-07)
4. Open one quiz and one homework result. (RES-02, RES-08)

### F-12 Student manages their account

1. Open Profile from the header menu and from Settings. (PRF-01)
2. Edit every field and save. (PRF-02)
3. Try invalid values. (PRF-04 to PRF-09)
4. Change password. (PRF-13)
5. Log out and log in with the new password. (PRF-14)

### F-13 Session ends

1. Sign out from the header. (LGN-10)
2. Use the Back button. (LGN-11)
3. Log in again and let the token expire, then click around. (LGN-12)
4. Open a deep link while logged out. (LGN-14)

### F-14 Admin changes someone's role

1. Promote a student to TA for a course. (ROL-02)
2. As that user, reload and see the new workspace. (ROL-04)
3. Promote the TA to admin. (ROL-03)
4. Change the admin back to a student. (ROL-07)
5. Have an admin select themselves. (ROL-08)

### F-15 Admin posts material for a past class

1. Open Schedule and find the class under Past Classes. (PCL-01)
2. Add lecture notes. (PCL-02, PCL-03)
3. Confirm the page stays usable afterwards. (PCL-04)
4. As a student, download the material. (PCL-05)
5. Replace the file. (PCL-07)
6. Browse every past class and filter them. (PCL-08 to PCL-10)

### F-16 Student on a phone

Set the viewport to 390 x 844 and repeat at least this:

1. Open `/` and the mobile menu. (MOB-01)
2. Log in from the mobile menu. (PUB-08)
3. Open the sidebar and visit each page. (MOB-03)
4. Request enrollment with a proof. (MOB-05)
5. Take a quiz, including fullscreen. (MOB-06)
6. Submit homework. (MOB-07)

### F-17 Online payment with JazzCash

There is no JazzCash button in the UI, so this flow runs through the API. (JAZ-01 to JAZ-08)

1. Student starts a payment and gets a redirect URL and a payload.
2. The gateway posts back to the callback.
3. On success, enrollment activates and the student is notified.
4. On failure, the student can try again.

**Also confirm with the owner:** should this appear in the UI, or is it abandoned?

### F-18 Student needs help

Try to reach someone from each entry point when there's no live class:

1. Sidebar New Request. (CHT-02)
2. Dashboard Advising chat. (DSH-08)
3. Schedule Report a schedule issue. (SCH-14)
4. Enrollment modal Message admissions. (CRS-06)
5. Sidebar Help and the contact form. (NAV-07, CON-03)

**Pass condition:** the student can send a message that someone receives.

### F-19 Visitor views the developer portfolio

1. Open `/meet-the-developer`. Note there's no link to it from the main site. (DEV-01)
2. Scroll all sections and use the nav. (DEV-02, DEV-03)
3. Try the external links. (DEV-05)

---

## 8. Test cases

### 8.1 Smoke

| ID | Pri | Test | Expected |
|---|---|---|---|
| ENV-01 | P0 | Open http://localhost:8000/ | JSON `{"Title":"Cambfordable"}` |
| ENV-02 | P0 | Open http://localhost:3000/ | Landing page renders with no console errors |
| ENV-03 | P0 | Open `/login` and log in as `hamza` | Admin Control Center loads |
| ENV-04 | P0 | Check network calls after login | All go to `localhost:8000`, with no CORS errors |
| ENV-05 | P1 | From admin, open any live class chat | WebSocket connects, which confirms Redis works |
| ENV-06 | P2 | Open a route that doesn't exist, like `/nope` | A proper 404 page with a way back |

### 8.2 Public site

#### Header and landing page

| ID | Pri | Test | Expected |
|---|---|---|---|
| PUB-01 | P0 | Load `/` and scroll to the bottom | Header, banner, How It Works, How We Teach, Teacher, Subjects, Reviews, FAQs and Footer appear in order. No broken images or console errors. |
| PUB-02 | P1 | Click the Cambfordable logo from another page | Goes to `/` |
| PUB-03 | P0 | Click Home, Our Teachers, Contact and More | Each opens the right page: `/`, `/our-teachers`, `/contact`, `/about` |
| PUB-04 | P0 | Logged out, click Login | Goes to `/login` |
| PUB-05 | P0 | Logged out, click Join `D-17` | Goes to `/signup` |
| PUB-06 | P1 | Logged in, view the header | Shows Dashboard and Logout, not Login and Join. Logout clears the session and returns to `/`. |
| PUB-07 | P1 | At phone width, open the menu. Close it with the X, then the overlay. Open it and click a link. | Each action closes the menu. The link navigates. |
| PUB-08 | P0 | At phone width and logged out, click Login in the menu `D-17` | Goes to `/login` |
| PUB-09 | P0 | At phone width and logged out, click Join in the menu `D-17` | Goes to `/signup` |
| PUB-10 | P1 | At phone width and logged in, use Dashboard and Logout in the menu | Both work |
| PUB-11 | P0 | Click banner Enroll Now `D-17` | Starts signup or enrollment |
| PUB-12 | P1 | Click banner Learn More `D-17` | Goes somewhere useful |
| PUB-13 | P1 | In How It Works, click play. Then pause. | Video plays with sound and pauses. Overlay and label switch correctly. |
| PUB-14 | P2 | Click Learn more in How We Teach `D-17` | Goes somewhere useful |
| PUB-15 | P1 | Click the link in the Teacher section | Goes to `/our-teachers` |
| PUB-16 | P1 | Hover and click each of the 6 subject cards. They look clickable. `D-17` | Clicking opens that subject, or the cards don't look clickable |
| PUB-17 | P0 | Click Enroll Now under Subjects `D-17` | Starts signup or enrollment |
| PUB-18 | P2 | Watch the Reviews row, then hover | It scrolls, loops without a jump and pauses on hover |
| PUB-19 | P1 | Open each FAQ, then open another | Only one stays open. Clicking it again closes it. |
| PUB-20 | P1 | Click CONTACT US in the FAQ section | Goes to `/contact` |
| PUB-21 | P1 | Click every footer link: Quick Links, Popular Courses, Policies `D-17` | Each opens a real page. None stays on `#`. |
| PUB-22 | P1 | Click each footer social icon `D-17` | Opens a real profile |
| PUB-23 | P0 | Click footer Start Learning and Schedule Demo `D-17` | Each does something |
| PUB-24 | P2 | Compare the footer phone with the contact page | Same real numbers. The footer's `+1 (234) 567-890` looks like a placeholder. |
| PUB-25 | P2 | Check the footer's mail and phone links | Open mail and phone handlers |
| PUB-26 | P2 | Check the copyright year | Shows the current year |
| PUB-27 | P2 | Compare site claims with features: "personalized quiz reviews" and "use more than one device" `D-29` | Claims match what the product does |

#### About and Our Teachers

| ID | Pri | Test | Expected |
|---|---|---|---|
| ABT-01 | P1 | Open `/about` and scroll | Every section renders with header and footer |
| ABT-02 | P2 | Read the page and look for a next step | There's a way to sign up or enroll from here |
| TCH-01 | P1 | Open `/our-teachers` and scroll | Profile, photo, logos and sections all load |
| TCH-02 | P1 | Click Back to Home | Goes to `/` |

#### Contact form

| ID | Pri | Test | Expected |
|---|---|---|---|
| CON-01 | P1 | Open `/contact` | Info cards and form render |
| CON-02 | P1 | Click SEND NOW with everything empty | "Please fill in all fields" |
| CON-03 | P0 | Fill it in correctly and send, then open the notification bell as an admin. `D-20` | Success message appears, **and every admin gets a notification showing the sender, email and full message** |
| CON-04 | P1 | Enter `notanemail` as the email and send | Rejected as an invalid email |
| CON-05 | P2 | Enter only spaces in each field and send | Rejected |
| CON-06 | P2 | Double-click SEND NOW | Sends once; the button disables while sending |
| CON-07 | P1 | After success, check the form | Fields clear, message disappears after about 5 seconds |

#### Developer portfolio

| ID | Pri | Test | Expected |
|---|---|---|---|
| DEV-01 | P2 | Open `/meet-the-developer`. Look for links to it from the main site. | Page loads. Record whether it's reachable from the site. |
| DEV-02 | P2 | Scroll all sections: hero, about, experience, projects, stack, play, contact | All appear with animations and no console errors. 3D hero renders. |
| DEV-03 | P2 | Click each nav link | Scrolls to that section, and the active item updates |
| DEV-04 | P2 | At phone width, use the menu | Opens, links work, it closes |
| DEV-05 | P2 | Click GitHub, LinkedIn, email and phone links | Open the right targets, with external ones in a new tab |
| DEV-06 | P2 | Click Back to top | Returns to the hero |

### 8.3 Signup

| ID | Pri | Test | Expected |
|---|---|---|---|
| SGN-01 | P0 | Submit all valid fields | "User created successfully", then redirect to `/login` after about 1.5 seconds |
| SGN-02 | P0 | Log in with the new account | Works, and the student dashboard shows the right name |
| SGN-03 | P0 | Use an existing username | "Username already exists" |
| SGN-04 | P0 | Use an existing email | "Email already exists" |
| SGN-05 | P1 | Use `QA_Student_A`, differing only by case from an existing username | Treated as a duplicate |
| SGN-06 | P1 | Use the same email in a different case | Treated as a duplicate |
| SGN-07 | P1 | Submit with each required field empty: username, email, phone, password, terms | Browser blocks it and highlights the field |
| SGN-08 | P2 | Leave Full Name blank | Either required, or the account works with username as the display name |
| SGN-09 | P1 | Use a 7-character password | Blocked, 8 is the minimum |
| SGN-10 | P2 | Use exactly 8 characters | Accepted |
| SGN-11 | P2 | Use a 129-character password | Clear error, not a raw server message |
| SGN-12 | P1 | Enter `a@b` as the email | Clear invalid-email error |
| SGN-13 | P1 | Enter `abc` as the phone `D-38` | Rejected as an invalid phone |
| SGN-14 | P1 | Enter `03001234567` with no country code `D-38` | Rejected, matching the hint on the form |
| SGN-15 | P1 | Enter `+92 300 1234567`, the format the placeholder shows | Accepted, and later profile saves succeed |
| SGN-16 | P2 | Enter a username of spaces only | Rejected |
| SGN-17 | P2 | Use spaces, Unicode and a 200-character username | Handled sensibly and the layout holds |
| SGN-18 | P1 | Show and hide the password | Toggle works and doesn't submit the form |
| SGN-19 | P1 | Click Terms of Service and Privacy Policy | Opens real documents |
| SGN-20 | P1 | Click Login here | Goes to `/login` |
| SGN-21 | P2 | Double-click Sign Up | One account, and the button disables |
| SGN-22 | P1 | Submit with the backend stopped | Readable "Signup failed"; no crash |
| SGN-23 | P0 | [API] Sign up with `"is_admin": true` in the body (`/auth/signup`, POST) | Account created without admin rights |
| SGN-24 | P2 | Open `/signup` while logged in | Redirects to the dashboard, or at least explains |
| SGN-25 | P2 | Look for navigation back to the site from `/signup` | There's a logo or link home |

### 8.4 Login and sessions

| ID | Pri | Test | Expected |
|---|---|---|---|
| LGN-01 | P0 | Log in with a valid username and password | Goes to `/dashboard`; `access_token` is stored |
| LGN-02 | P0 | Log in with the email address; the label says "Username or Email" `D-18` | Logs in |
| LGN-03 | P0 | Use a wrong password | "Invalid credentials", and no redirect |
| LGN-04 | P1 | Use an unknown username | Same message as a wrong password |
| LGN-05 | P1 | Submit empty fields | Browser blocks it |
| LGN-06 | P1 | Show and hide the password | Works |
| LGN-07 | P0 | Click Forgot password? `D-19` | Starts a reset flow |
| LGN-08 | P2 | Check Remember me, log in, then close and reopen the browser `D-19` | Behaviour differs from leaving it unchecked |
| LGN-09 | P1 | Log in with the backend stopped | Readable error; the button re-enables |
| LGN-10 | P0 | Use Sign out in the header menu | Token removed; goes to `/login` |
| LGN-11 | P0 | Press Back after signing out | Portal content doesn't reappear |
| LGN-12 | P0 | Corrupt the token, then navigate the portal | Goes to `/login` with a message explaining why |
| LGN-13 | P0 | Stay active for over 30 minutes, without touching the token `D-15` | Session renews, and the student isn't thrown out mid-task |
| LGN-14 | P1 | While logged out, open `/homework`, log in | Returns to `/homework`, not just the dashboard |
| LGN-15 | P2 | Open `/login` while logged in | Redirects to the dashboard, or at least explains |
| LGN-16 | P2 | Sign out in one tab, then use another | The other tab goes to `/login` on its next action |
| LGN-17 | P2 | With an expired token, open `/` | Header doesn't claim you're logged in, or the Dashboard click handles it |
| LGN-18 | P2 | Log in with `<script>` or `' OR 1=1 --` as username | Normal invalid-credentials response |
| LGN-19 | P2 | [API] Send 20 wrong passwords in a row | Rate limit or lockout. Record what happens. |
| LGN-20 | P2 | Press Enter in the password field | Submits |

### 8.5 Portal shell

| ID | Pri | Test | Expected |
|---|---|---|---|
| NAV-01 | P0 | Click each sidebar item: Dashboard, Courses, Assignments, Quizzes, Results, Messages, Schedule | Opens the right page, and the active item is highlighted |
| NAV-02 | P1 | Open a nested page like `/schedule/past` | Parent item stays highlighted |
| NAV-03 | P1 | Click the sidebar logo | Goes to `/` |
| NAV-04 | P1 | Click Academic Portal in the header | Goes to `/dashboard` |
| NAV-05 | P1 | Click New Request `D-13` | Opens a way to start a request |
| NAV-06 | P1 | Click Settings | Goes to `/profile` |
| NAV-07 | P2 | Click Help | Goes to `/contact`, leaving the portal. Check there's a way back. |
| NAV-08 | P1 | Click the Messages icon in the header | Goes to `/messages` |
| NAV-09 | P1 | Open the avatar menu | Shows name and email, Profile, Settings, Sign out |
| NAV-10 | P2 | Click outside the avatar menu and the notifications menu | Each closes |
| NAV-11 | P2 | Open the avatar menu and notifications together | They don't overlap |
| NAV-12 | P1 | From the dashboard, search for `quiz`, `assignment`, `schedule`, `message`, `profile` | Goes to the matching page |
| NAV-13 | P1 | From the dashboard, search for a real course name | Goes to `/courses?search=` with that course visible |
| NAV-14 | P1 | Search for an available, unenrolled course name | It's found. It shouldn't look missing because the Enrolled tab is selected. |
| NAV-15 | P2 | Search for a single letter, like `a` | Sensible result, not a surprise redirect |
| NAV-16 | P2 | Search with an empty value | Nothing happens |
| NAV-17 | P1 | Use the live search on `/courses`, `/homework`, `/quizzes`, `/schedule/past` | Filters that page's list as you type |
| NAV-18 | P2 | Check the sidebar as admin and TA | Each role sees only useful items. Record dead ends like Results for an admin. |

### 8.6 Student dashboard

| ID | Pri | Test | Expected |
|---|---|---|---|
| DSH-01 | P1 | Log in in the morning, afternoon or evening | Greeting matches the local time and uses the first name |
| DSH-02 | P0 | As Student A, view My Active Courses | Shows QA-101 with name, code and progress, up to 4 cards |
| DSH-03 | P1 | As Student B, view the dashboard | "No active courses yet" with a working Browse link |
| DSH-04 | P1 | As Student C (pending), view the dashboard | Pending course isn't listed as active |
| DSH-05 | P1 | Check the Student Profile card | Student ID, major, year and email are right or "Not assigned". View profile link works. `D-51` |
| DSH-06 | P1 | Check Upcoming with a future class and homework | Up to 4 items in date order, with correct "Today" and "Tomorrow" labels |
| DSH-07 | P2 | Submit a homework, then check Upcoming | Already submitted work no longer appears as upcoming |
| DSH-08 | P1 | Click each Quick Link | Goes to `/schedule`, `/homework`, `/quizzes`, `/messages` |
| DSH-09 | P2 | Check Upcoming for quizzes with deadlines | Quizzes are included too |
| DSH-10 | P1 | Click a course card | Goes to `/courses` |
| DSH-11 | P2 | Set a full name of spaces only, then view the greeting | Doesn't show a blank name |
| DSH-12 | P1 | Check course progress after completing work `D-39` | Progress moves above 0% |
| DSH-13 | P1 | Fail the catalog request (block it in DevTools) | Amber error banner, and the page still works |

### 8.7 Profile

| ID | Pri | Test | Expected |
|---|---|---|---|
| PRF-01 | P1 | Open `/profile` | Name, initials, member-since and every field are right |
| PRF-02 | P0 | Edit all editable fields and save, then reload | "Your profile has been updated." The values persist. |
| PRF-03 | P1 | Edit then click Cancel | Values revert; nothing is saved |
| PRF-04 | P0 | Clear the email and save `D-10` | A clear validation error, not a server failure. Email unchanged. |
| PRF-05 | P1 | Enter an email already in use | "Email address is already in use" |
| PRF-06 | P1 | Enter `bad-email` | Clear invalid-email message |
| PRF-07 | P1 | Enter a phone without `+`, and a too-short phone | Clear message, without a raw "Value error," prefix |
| PRF-08 | P1 | Enter a future date of birth, and today's date | Rejected, "must be in the past", without a raw prefix |
| PRF-09 | P1 | Enter a one-character full name | Clear message about the minimum length |
| PRF-10 | P0 | As Student D, clear the full name and save. Then as admin, open Enrollments and Access Roles. **Restore the name afterwards.** `D-09` | Either a name is required, or admin pages cope. They must not crash. |
| PRF-11 | P1 | Enter a 501-character address | Clear message about the limit |
| PRF-12 | P2 | Set every gender option | Saved. "Prefer not to say" shows sensibly. |
| PRF-13 | P0 | Change password with the correct current password | "Your password has been changed." Modal closes. |
| PRF-14 | P0 | Log out, then log in with the old and then the new password | Old fails, new works |
| PRF-15 | P1 | Enter a wrong current password | "Current password is incorrect" |
| PRF-16 | P1 | Enter mismatched new and confirm passwords | "New password and confirmation do not match." |
| PRF-17 | P1 | Make the new password the same as the current one | "New password must be different" |
| PRF-18 | P1 | Use a new password under 8 characters | Blocked |
| PRF-19 | P1 | Close the password modal after an error, then reopen | Error cleared. Check whether typed passwords were cleared. |
| PRF-20 | P1 | Change the password in one browser while logged in on another | The other session ends, or record that it stays valid `D-42` |
| PRF-21 | P1 | Sign up with a bad phone, then save any profile change `D-38` | The user isn't blocked by a value the site accepted earlier, or gets a clear message |
| PRF-22 | P1 | Check whether Student ID, major, year or standing can be edited | Not editable by the student |
| PRF-23 | P2 | Check Course progress with paid courses | Equals the average of those courses |
| PRF-24 | P2 | Enter `<img src=x onerror=alert(1)>` as the name and address | Shown as text, nothing runs |
| PRF-25 | P2 | Check the 2FA row | Clearly labeled as not available |
| PRF-26 | P2 | Save successfully, then edit again | Old success message doesn't linger |

### 8.8 Courses and enrollment: student

| ID | Pri | Test | Expected |
|---|---|---|---|
| CRS-01 | P0 | As Student A, open `/courses` | Enrolled tab shows QA-101 with progress. Tab counts are right. |
| CRS-02 | P0 | Open the Available tab | Shows courses not yet paid, marked "Open for enrollment" |
| CRS-03 | P1 | Search by name, then code, then nonsense | Filters correctly. "No courses found" for nonsense. |
| CRS-04 | P2 | Open `/courses?search=QA` directly | Search box is filled and the list is filtered |
| CRS-05 | P0 | Click Request enrollment | Modal shows course name and code, instructions and upload |
| CRS-06 | P0 | Click Message admissions in the modal, with no live class on `D-13` | Student can actually contact admissions |
| CRS-07 | P1 | Click Cancel, then the X | Modal closes, nothing is submitted, and the file resets |
| CRS-08 | P0 | Upload each of PDF, JPG, PNG, WebP and submit, one per account or course [H] | "…is now pending payment review", card changes to Pending review |
| CRS-09 | P0 | View a pending course | Amber badge and explanation; no Request button |
| CRS-10 | P1 | Choose `notes.txt` or `tool.exe` [H] | Rejected with a clear message |
| CRS-11 | P1 | Choose `big_11mb.pdf` [H] | "Payment proof must be 10 MB or smaller." Submit stays disabled. |
| CRS-12 | P2 | Open the modal with no file | Submit for review stays disabled |
| CRS-13 | P2 | Upload `spaces & symbols (1).pdf` [H] | Succeeds, and admin can open it |
| CRS-14 | P0 | After approval, view the course | Moves to the Enrolled tab, with Continue learning going to `/schedule` |
| CRS-15 | P1 | Look for price or payment details | Student can tell what to pay and how |
| CRS-16 | P1 | [API] Submit a second proof for a pending course (`/courses/{id}/enroll-with-proof`, POST) | 409, "Your payment proof is already pending review" |
| CRS-17 | P1 | [API] Submit a proof for an already paid course | 409, "You are already enrolled in this course" |
| CRS-18 | P0 | As pending Student C, try content for the course: `/quiz/{id}`, `/meeting/{id}`; [API] `/homeworks/course/{id}` | All refused |
| CRS-19 | P1 | Check how a rejected proof looks to the student `D-11` | Student is told and can resubmit |
| CRS-20 | P2 | Check progress and the Completed state `D-39` | Reflects real progress |
| CRS-21 | P2 | Dismiss the success and error banners | Each closes |
| CRS-22 | P2 | Make the catalog fail (block the request) | Error banner, not an endless skeleton |

### 8.9 Admin: courses

| ID | Pri | Test | Expected |
|---|---|---|---|
| ACR-01 | P0 | Create a course with name, code and WhatsApp link | Success message. Form resets. Course appears everywhere it should. |
| ACR-02 | P1 | Create a course without a WhatsApp link | Works |
| ACR-03 | P0 | Reuse an existing code `D-32` | Clear "code already exists" message, not a network error |
| ACR-04 | P1 | Submit empty name or code | Browser blocks it |
| ACR-05 | P2 | Enter spaces only in name and code | Rejected |
| ACR-06 | P1 | Enter an invalid WhatsApp URL | Browser blocks it |
| ACR-07 | P1 | After creating, look for the course under `/courses` as admin | Listed, with admin auto-enrolled |
| ACR-08 | P1 | Look for a way to add the WhatsApp link later, as the help text promises `D-51` | There's a screen for it |
| ACR-09 | P2 | Double-click Create Course | Creates one course |
| ACR-10 | P2 | Use a very long name | Layout holds in cards and lists |
| ACR-11 | P1 | Switch through all 5 admin tabs | Each renders. Checklist text fits the tab. |

### 8.10 Admin: enrollments

| ID | Pri | Test | Expected |
|---|---|---|---|
| ENR-01 | P1 | Open Enrollments | Courses list on the left; prompt to select a course |
| ENR-02 | P0 | Select a course | Shows students not yet in the course; admins excluded |
| ENR-03 | P1 | Search by name, username and email | Filters correctly, and case doesn't matter |
| ENR-04 | P0 | Click a student to enroll | Success message and spinner. Student gets paid access and a notification. |
| ENR-05 | P1 | Check the list after enrolling | Student leaves the list |
| ENR-06 | P1 | Switch to another course | List reloads. Search behaviour is sensible. |
| ENR-07 | P0 | As that student, reload | Course appears as enrolled and content opens |
| ENR-08 | P0 | Try to unenroll a student from the UI `D-12` | There's a way to do it |
| ENR-09 | P1 | Look for pending students in the list `D-12` | Their state is shown, not silently hidden |
| ENR-10 | P1 | [API] As admin, unenroll (`/admin/courses/unenroll`, POST `{user_id, course_id}`) | 200, and the student immediately loses access |
| ENR-11 | P1 | [API] Enroll an already enrolled student (`/admin/courses/enroll`, POST) | 400, "User already enrolled in this course" |
| ENR-12 | P2 | [API] Enroll a nonexistent user or course | 404 with a clear message |
| ENR-13 | P1 | Enroll a student with a null full name `D-09` | Page doesn't crash |
| ENR-14 | P2 | Confirm the welcome WhatsApp message and email [H] | Received, with the group link. Email `BLOCKED` until SMTP is set. |

### 8.11 Admin: payments and access roles

#### Payments

| ID | Pri | Test | Expected |
|---|---|---|---|
| PAY-01 | P1 | Open Payments | Course list; prompt to select one |
| PAY-02 | P0 | Select a course | Lists enrollments with Paid or Unpaid status |
| PAY-03 | P1 | Search by name, username and email | Filters correctly |
| PAY-04 | P0 | Click View payment proof for PDF, JPG, PNG and WebP | Opens in a new tab, viewable inline |
| PAY-05 | P0 | Toggle Unpaid to Paid | Button updates. Student gets access. |
| PAY-06 | P0 | Check what the student receives | Notification "Enrollment confirmed", plus WhatsApp if a phone is set [H] |
| PAY-07 | P0 | Toggle Paid to Unpaid | Student loses access. Record what the student sees. |
| PAY-08 | P0 | Try to reject a bad proof and ask for a new one `D-11` | There's a way to do it, and the student can resubmit |
| PAY-09 | P1 | Reverse a payment, then check the student's course card `D-11` | Student knows what happened and what to do next |
| PAY-10 | P2 | Toggle Paid, Unpaid, Paid | Check whether the welcome message goes out twice |
| PAY-11 | P1 | Check whether pending reviews stand out from everything else | Admin can find items needing action easily |
| PAY-12 | P2 | Select a course with no enrollments | "No enrolled students found" |
| PAY-13 | P2 | Select a course and watch the course list | The list doesn't vanish behind a spinner |
| PAY-14 | P2 | Stop the backend and toggle | Clear error, and the button state stays correct |

#### Access roles

| ID | Pri | Test | Expected |
|---|---|---|---|
| ROL-01 | P1 | Open Access Roles | User list with current roles; search works |
| ROL-02 | P0 | Select a student, choose TA and a course, then assign | Success message. User is TA and assigned to that course. |
| ROL-03 | P1 | Select a TA, choose Admin and a course, then assign | User becomes admin |
| ROL-04 | P0 | As the changed user, reload | New workspace appears with no re-login |
| ROL-05 | P1 | Assign a role with a course the user is already in `D-34` | Clear result. It must not change the role and then report failure. |
| ROL-06 | P1 | Assign a TA to a second course | Works. TA sees both. |
| ROL-07 | P1 | Try to turn a TA or admin back into a student `D-34` | There's a way to do it |
| ROL-08 | P0 | As the only admin, select yourself and choose TA. **Use a spare admin, and be ready to fix with SQL.** `D-34` | Blocked or strongly warned |
| ROL-09 | P1 | Leave role or course unselected | Assign button stays disabled |
| ROL-10 | P1 | Toggle Mark as paid on a user, then check the student's course access `D-34` | Its effect is clear. Record that it doesn't grant course access. |
| ROL-11 | P2 | Open with a user whose full name is null `D-09` | Page doesn't crash |
| ROL-12 | P2 | Look for how to remove a TA from a course | There's a way to do it |

### 8.12 Live class creation

| ID | Pri | Test | Expected |
|---|---|---|---|
| LCC-01 | P0 | Create a class with course, title, future time and duration | Success message, with Join Class and Share on WhatsApp actions. Class appears on the schedule. |
| LCC-02 | P0 | Use a past start time | "Class start time must be in the future" |
| LCC-03 | P1 | Submit with each field empty | Browser blocks it |
| LCC-04 | P1 | Use a duration of 14, then 481 | Blocked by the 15 to 480 limit |
| LCC-05 | P2 | [API] Send a duration of 1 (`/live-classes/`, POST) | Same limit as the form, or record the mismatch |
| LCC-06 | P0 | Click Join Class straight after creating `D-21` | Opens the class for the host, or clearly says when it can start |
| LCC-07 | P1 | Click Share on WhatsApp | Opens WhatsApp with the title and meeting link |
| LCC-08 | P1 | Reload `/schedule` as admin | Admin quick access banner shows the new class |
| LCC-09 | P2 | Clear the quick access banner | Gone, and stays gone after a reload |
| LCC-10 | P1 | Check the time shown to students in another timezone | Converted correctly from the time the admin entered |
| LCC-11 | P1 | Confirm notifications: paid students get a portal notification | Received, linking to `/schedule` |
| LCC-12 | P1 | Check who gets WhatsApp and what it says [H] `D-35` | Paid students only. Text is accurate, not "CLASS LIVE NOW" for a future class. No direct Zoom link that skips the portal. |
| LCC-13 | P2 | Create a 120-minute class, then check the Zoom meeting's duration `D-35` | Meeting matches 120 minutes |
| LCC-14 | P1 | Make Zoom fail (bad credentials on a test environment) | Clear error. No class is saved. |
| LCC-15 | P2 | Double-click Create Live Class | One class and one Zoom meeting |

### 8.13 Schedule

| ID | Pri | Test | Expected |
|---|---|---|---|
| SCH-01 | P0 | As Student A, open `/schedule` | Classes for paid courses only |
| SCH-02 | P1 | Switch Today, Week and Month | Titles and lists update. Boundaries are right. |
| SCH-03 | P0 | View a class in its live window | "Happening now" with Join live lecture |
| SCH-04 | P1 | View an upcoming class | Time and date with no join button |
| SCH-05 | P1 | Filter by course | List narrows, and so do past classes |
| SCH-06 | P1 | View with no classes | "No classes in this view" |
| SCH-07 | P1 | As Student B, open `/schedule` | No classes from unpaid courses |
| SCH-08 | P1 | As Student C (pending), open `/schedule` | No classes from the pending course |
| SCH-09 | P1 | As admin, open `/schedule` | All classes, with names and codes |
| SCH-10 | P1 | As TA, open `/schedule` | Only assigned classes, with real names rather than "Course" |
| SCH-11 | P2 | Check the calendar card | Right month, and today is highlighted |
| SCH-12 | P2 | Test a class crossing midnight | Shows correctly in Today |
| SCH-13 | P2 | Leave the page open as a class goes live, without reloading | The state updates, or record that a reload is needed |
| SCH-14 | P1 | Click Report a schedule issue with no live class `D-13` | Student can actually report it |

### 8.14 Past classes and materials

| ID | Pri | Test | Expected |
|---|---|---|---|
| PCL-01 | P1 | View Past Classes on `/schedule` | Up to 3, newest first, with a material badge. Link shows the total. |
| PCL-02 | P0 | As admin, click Add Lecture Notes | Modal opens with the class name |
| PCL-03 | P0 | Upload a PDF, JPG and PNG [H] | "Uploaded Successfully!", and the modal closes |
| PCL-04 | P0 | After a successful upload on `/schedule`, try clicking anything `D-14` | Page is usable with no leftover dark overlay |
| PCL-05 | P0 | As a student, download the material | File downloads and opens |
| PCL-06 | P1 | Check badges after uploading, without a reload | "No material posted" updates |
| PCL-07 | P1 | As admin, click Replace Attachment | New file replaces the old one |
| PCL-08 | P1 | Open `/schedule/past` | All past classes as cards |
| PCL-09 | P1 | Filter by course, and search title, course name and code | Filters correctly |
| PCL-10 | P2 | Open `/schedule/past?course=999` and `?course=abc` | Doesn't break |
| PCL-11 | P1 | Back to schedule link | Works |
| PCL-12 | P1 | Upload `notes.txt` and `big_51mb.pdf` [H] | Each rejected with a clear message |
| PCL-13 | P2 | Drag a file onto the "drag and drop" area `D-40` | Accepted, and the browser doesn't navigate to the file |
| PCL-14 | P1 | As a student, check for upload controls | None |
| PCL-15 | P1 | Cancel and X in the modal, on `/schedule` | Modal and overlay both close |
| PCL-16 | P1 | As a student in another course, check for this class | Not listed |
| PCL-17 | P2 | Use Change File in the modal [H] | Picker opens, and the new file replaces the old |

### 8.15 Joining a class (Zoom)

| ID | Pri | Test | Expected |
|---|---|---|---|
| MTG-01 | P0 | Click Join live lecture | New tab, "Preparing your classroom…" |
| MTG-02 | P0 | As a student, wait for the meeting, with the host in Zoom `D-03` [H] | Zoom loads, and student joins with their name. Audio and video work. |
| MTG-03 | P0 | As admin, join during the live window `D-03` [H] | Joins as host, with participant list and share controls |
| MTG-04 | P1 | Open `/meeting/{future id}` as a student | Clear "Class has not started yet" with the start time, rather than a generic failure |
| MTG-05 | P0 | Open `/meeting/{id}` as Student B, not enrolled | Refused with a clear reason |
| MTG-06 | P0 | Join on two browsers with the same account [H] | Second gets "already active on another device" |
| MTG-07 | P1 | Close the first tab, then join elsewhere within 75 seconds and again after | Blocked at first, works once the session expires. Record the wait. |
| MTG-08 | P1 | Click Leave in Zoom | Tab closes or returns to the portal; no dead page |
| MTG-09 | P1 | Open `/meeting/{ended id}` | Clear "Class has ended" |
| MTG-10 | P1 | As a logged-out user, open a shared `/meeting/{id}` link, then log in | Returns to the meeting |
| MTG-11 | P1 | Open `/meeting/abc` and `/meeting/999999` | Clear error with a way back |
| MTG-12 | P1 | Click Close Tab on the error page | Tab closes, or there's another way out |
| MTG-13 | P0 | As a student whose full name is null `D-09` | Can still join |
| MTG-14 | P1 | Check student restrictions in Zoom: no participant list, no share, chat only to host [H] | Applied |
| MTG-15 | P1 | Test the fullscreen button | Toggles fullscreen |
| MTG-16 | P1 | Open DevTools during a class and check heartbeat calls | One every 30 seconds, all succeeding |
| MTG-17 | P2 | Refuse camera and mic permissions [H] | Meeting still works, with a clear prompt |
| MTG-18 | P2 | Confirm the page isn't broken by the cross-origin headers in `next.config.mjs` | Zoom assets load with no COEP errors |
| MTG-19 | P1 | As a TA, join a class in the assigned course [H] | Joins as an attendee. Record whether the TA should have more control. |

### 8.16 Live MCQ and messages

#### Live MCQ

Open `/meeting/{live id}` as admin and as a student in two browsers. This works even if Zoom doesn't join. Needs Redis.

| ID | Pri | Test | Expected |
|---|---|---|---|
| MCQ-01 | P0 | As admin, click Open MCQ Panel | Panel opens and can be dragged and hidden |
| MCQ-02 | P0 | Publish a question with 4 options | Inputs clear. Admin sees "Live responses: 0". |
| MCQ-03 | P1 | Publish with no question, or under 2 options | Not published. Tell the admin why. |
| MCQ-04 | P0 | Fill in options 1, 3 and 4, leaving 2 blank; mark option 3 correct `D-37` | Option 3's text is scored as correct |
| MCQ-05 | P0 | As a student, see the question | Appears without a reload |
| MCQ-06 | P1 | Select one option, then another | Selection changes. Submit enables after selecting. |
| MCQ-07 | P0 | Submit an answer | "Answer submitted" with correct or wrong feedback. Options lock. |
| MCQ-08 | P0 | As admin, watch the counts | Update live, per option and in total |
| MCQ-09 | P1 | Use Hide and then Answer MCQ as a student | Hides and reopens with selection kept |
| MCQ-10 | P1 | Refresh as a student, after answering and before | Question returns. Answer stays locked. Record whether feedback returns. |
| MCQ-11 | P1 | Join as a new student while a question is active | Question appears |
| MCQ-12 | P0 | As admin, click End | All see "Question Ended" with counts and the correct answer highlighted. Dismiss works. |
| MCQ-13 | P1 | [Console] As a student, send `question_publish` on the socket | Ignored |
| MCQ-14 | P1 | [Console] As a student, submit twice with different options | First answer stays |
| MCQ-15 | P2 | Have every participant leave and return | Record that the question is gone |
| MCQ-16 | P2 | Restart the backend during a question | Clear state. Sockets reconnect, or a message says to reload. |
| MCQ-17 | P2 | Publish a new question while one is active | Replaces it cleanly for everyone |

#### Messages and chat

| ID | Pri | Test | Expected |
|---|---|---|---|
| CHT-01 | P1 | As a student with no live class, open `/messages` | "No live classes right now" |
| CHT-02 | P0 | Decide whether a student can message anyone outside a class `D-13` | Student has a way to reach admins |
| CHT-03 | P0 | During a live class, as a student, open `/messages` | Class is selected, "Live chat", and the input is enabled |
| CHT-04 | P0 | Send a message as a student | Appears on the right. Admin sees it live. |
| CHT-05 | P0 | Reply as admin | Student sees it live |
| CHT-06 | P0 | Send as Student A and Student D at once | Students can't see each other's messages. Admin sees both. |
| CHT-07 | P1 | Press Enter and Shift+Enter | Enter sends, Shift+Enter makes a new line |
| CHT-08 | P1 | Send two messages within a second `D-36` | Both delivered, or a visible message about the limit. Text mustn't vanish silently. |
| CHT-09 | P1 | Send an empty or spaces-only message | Button stays disabled |
| CHT-10 | P1 | Reload the page | History returns, in order |
| CHT-11 | P1 | Send `<img src=x onerror=alert(1)>` | Shown as text, nothing runs |
| CHT-12 | P2 | Send a 5,000-character message | Handled, and the layout holds |
| CHT-13 | P2 | Send `{"action":"question_end"}` as admin in the text box | Treated as chat, not as a command |
| CHT-14 | P1 | As admin, view past, upcoming and live class conversations | All listed in the right order, with status dots |
| CHT-15 | P1 | As admin, check the input on a past class | Matches intent: placeholder says read-only, or admin can post |
| CHT-16 | P1 | Stop Redis, then send a message `D-36` | Clear error. Message isn't lost silently. |
| CHT-17 | P1 | Search conversations by class and course name | Filters correctly |
| CHT-18 | P2 | As a TA, send a message and see who can read it | Decide if a TA should be treated as staff. Record the result. |
| CHT-19 | P2 | Have a live class end while a chat is open | Input locks, with an explanation |
| CHT-20 | P2 | Check the participant count | Reasonable, and described accurately |
| CHT-21 | P1 | [API] As Student B, read a class's history (`/chat/{id}/messages`) | 403 |
| CHT-22 | P1 | Open the socket as Student B and outside the class window | Connection closes with code 1008 |

### 8.17 Homework: admin creation

| ID | Pri | Test | Expected |
|---|---|---|---|
| HWC-01 | P0 | Create homework with all fields | Form closes, and it appears under its course. Paid students get a notification. |
| HWC-02 | P1 | Use a past due date | "Due date must be in the future" |
| HWC-03 | P1 | Attach a JPG and a PNG [H] | Preview shows, and it saves with the image |
| HWC-04 | P1 | Attach a `.txt` and `big_11mb.png` [H] | Clear errors |
| HWC-05 | P1 | Use max score 0, negative or blank | Clear error, not a generic failure |
| HWC-06 | P2 | Use max score 12.5 | Accepted, and shown correctly later |
| HWC-07 | P1 | Submit empty required fields | Blocked |
| HWC-08 | P1 | Cancel and X | Form closes, nothing created |
| HWC-09 | P2 | Make the image upload fail (block the request) | Clear result. Retrying doesn't create a duplicate. |
| HWC-10 | P1 | View the list | Grouped by course, overdue items marked, dates right |
| HWC-11 | P2 | Check the select and input text colors | Readable |
| HWC-12 | P1 | Look for edit and delete | See section 10 |
| HWC-13 | P2 | [API] As admin, post with a past due date (`/homeworks/`, POST) | Server rejects it, or record the mismatch |
| HWC-14 | P1 | [API] As TA, create homework in the assigned course | Allowed by the API. Note there's no TA form for it. |
| HWC-15 | P2 | Create homework in a course with no students | Works, no errors |

### 8.18 Homework: student

| ID | Pri | Test | Expected |
|---|---|---|---|
| HWS-01 | P0 | As Student A, open `/homework` | Lists QA-101 items only. Counts are right. `QA HW Other` isn't shown. |
| HWS-02 | P0 | Find the assignment's description and question image `D-06` | Student can read what to do |
| HWS-03 | P1 | Switch tabs, and open `/homework?tab=graded` and `?tab=submitted` | Right items and tab selected |
| HWS-04 | P1 | Filter by course, sort both ways, search | Each works |
| HWS-05 | P0 | Click Submit, choose a PDF and submit [H] | "Submitted Successfully!", then moves to Submitted |
| HWS-06 | P1 | Submit each allowed type: DOC, DOCX, XLS, XLSX, TXT, JPG, PNG [H] | Accepted |
| HWS-07 | P1 | View and submit after the deadline `D-43` | Marked overdue. Confirm with the owner whether late work is allowed, and how it should be marked. |
| HWS-08 | P1 | Choose `tool.exe` or `page.html` [H] | "File type not supported…" |
| HWS-09 | P1 | Choose `big_11mb.pdf` [H] | "File size must be less than 10MB" |
| HWS-10 | P1 | Click View submission | Opens the file. Record whether it opens or downloads. |
| HWS-11 | P0 | View a graded item | Score, feedback and status are right |
| HWS-12 | P0 | Find the solution after submitting `D-06` | Student can download it |
| HWS-13 | P1 | [API] Submit the same homework again (`/homeworks/{id}/submit`, POST) | 409, "You have already submitted this assignment" |
| HWS-14 | P1 | Use Cancel, X and Change File [H] | Each behaves as labeled |
| HWS-15 | P2 | Drag a file onto the upload area `D-40` | Accepted, and the browser doesn't navigate to the file |
| HWS-16 | P2 | Upload `spaces & symbols (1).pdf` [H] | Works, and the grader can open it |
| HWS-17 | P1 | Open `/homework/{id}/grades` directly `D-06` | Shows grade and solution. Record that no link leads here. |
| HWS-18 | P2 | Open `/homework/999999/grades` `D-50` | Title doesn't read "null - Your Grade" |
| HWS-19 | P2 | Check a homework's displayed times in another timezone | Correct local time |
| HWS-20 | P1 | Open with no assignments, as Student B | Empty message, no errors |
| HWS-21 | P1 | Upload while the token has expired | Clear message. File selection isn't silently lost. |
| HWS-22 | P2 | Close the modal during the success message | No errors, and the list refreshes |

### 8.19 Homework: grading

| ID | Pri | Test | Expected |
|---|---|---|---|
| HWG-01 | P0 | As admin, click View Submissions | Modal with totals and each submission |
| HWG-02 | P0 | Check how each student is identified `D-30` | Real name and email, not "Student #12" |
| HWG-03 | P0 | Click View and Download on a submission | Opens inline and downloads the real file |
| HWG-04 | P1 | Test files with spaces and symbols in the name | Both links work |
| HWG-05 | P0 | Enter a score and remark, then Save Grade | Graded badge, totals update. Student notified. |
| HWG-06 | P0 | Enter a score over the maximum `D-31` | Clear message giving the allowed range |
| HWG-07 | P1 | Enter a negative score `D-31` | Clear message |
| HWG-08 | P1 | Enter a score of 0 | Saves as graded with 0, not ungraded |
| HWG-09 | P1 | Save a remark with no score `D-31` | Student isn't told it's "graded" |
| HWG-10 | P1 | Change an existing grade (Update Grade), then clear a score | Update works. Clearing behaves sensibly. Student sees the latest. |
| HWG-11 | P0 | Upload a solution [H] | View and Remove appear |
| HWG-12 | P1 | Remove the solution | Upload returns. Students no longer get it. |
| HWG-13 | P1 | Open a homework with no submissions | Empty message |
| HWG-14 | P2 | Close with X, and with Close Window | Unsaved scores: warned or knowingly dropped |
| HWG-15 | P1 | Show the maximum score in the modal | Grader can see the maximum |
| HWG-16 | P0 | Open `/homework-submissions/1/grade` as admin `D-25` | A working grading form, or the page is removed. Not blank. |
| HWG-17 | P1 | Open the same URL as a student `D-25` | Shows a permission message, not a blank page |
| HWG-18 | P2 | Upload a solution of any type, such as `.exe` [H] `D-41` | Server restricts file types |

### 8.20 Quiz creation

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZC-01 | P0 | Create a quiz with an MCQ and a file question | Success message. Form resets. Paid students notified. |
| QZC-02 | P1 | Add and remove questions, add and remove options | Numbering and limits stay right. Can't go below 1 question or 2 options. |
| QZC-03 | P0 | Submit with blank option text, or no correct option `D-28` | Rejected with a clear message |
| QZC-04 | P1 | Set total marks different from the sum of question marks `D-28` | Warned or blocked |
| QZC-05 | P0 | Add an image, click Upload Image, and don't fill other fields. Repeat with all fields filled. `D-26` [H] | Clicking Upload Image only attaches the image. It must not submit the form. |
| QZC-06 | P1 | Click the red X on an image preview `D-26` | Only removes the image |
| QZC-07 | P1 | Attach an image, then click Remove Image, then create the quiz `D-27` | That image isn't uploaded |
| QZC-08 | P1 | Paste an image with Ctrl+V; drag and drop an image [H] | Both work |
| QZC-09 | P1 | Try a `.gif`, and `big_11mb.png` [H] | Clear errors |
| QZC-10 | P1 | Use total marks 0 and duration 0, 481 or blank | Clear messages, not just "Failed to create quiz" |
| QZC-11 | P1 | Use a past deadline | Warned or blocked |
| QZC-12 | P1 | Leave the deadline empty | No deadline, shows as such to students |
| QZC-13 | P1 | Mark multiple options correct | Blocked, or supported. Student sees "Select one option". |
| QZC-14 | P1 | Trigger an error, then succeed | Old error clears |
| QZC-15 | P1 | Switch question type from MCQ to Short Answer `D-28` | Student gets the answer method the label suggests |
| QZC-16 | P2 | Double-click Create Quiz | Creates one quiz |
| QZC-17 | P2 | Make one image upload fail (block the request) | Admin is told |
| QZC-18 | P2 | Remove a question with an attached image | The right images stay with the right questions |
| QZC-19 | P1 | Look for edit, delete, publish or preview | See section 10 |

### 8.21 Quiz list: student

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZL-01 | P0 | As Student A, open `/quizzes` | QA-101 quizzes only, with title, code, marks, duration and deadline |
| QZL-02 | P1 | Check default filters | Available and Submitted on, Closed off, with right counts |
| QZL-03 | P1 | Toggle each filter, including all off | Lists respond. Empty message when nothing matches. |
| QZL-04 | P1 | Filter by course and search | Each works |
| QZL-05 | P1 | Check status when the deadline passes | Becomes Closed, or stays Available when late is on |
| QZL-06 | P1 | Click View all results | Goes to `/results` |
| QZL-07 | P0 | Click Start quiz | Opens `/quiz/{id}` |
| QZL-08 | P1 | View a submitted quiz | "View submission" link, with submit time |
| QZL-09 | P1 | View a graded quiz | Score over total, View feedback link |
| QZL-10 | P1 | As Student B, open `/quizzes` | Empty, no errors |
| QZL-11 | P2 | View a quiz with score 0 | Shows 0, not blank |

### 8.22 Taking a quiz

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZT-01 | P0 | Open a quiz | Rules screen with title, marks, question count and proctoring terms |
| QZT-02 | P0 | Click I Understand - Start Quiz | Fullscreen, status bar and questions appear |
| QZT-03 | P0 | Look for time remaining `D-16` | A countdown shows, and the time limit is enforced |
| QZT-04 | P0 | Let the duration pass `D-16` | Quiz auto-submits at the limit |
| QZT-05 | P0 | Answer MCQs, change an answer | Selection updates, and the answered count is right |
| QZT-06 | P1 | Leave questions unanswered | Submit stays disabled |
| QZT-07 | P0 | Upload a file answer [H] | "Ready to submit". Count updates. Fullscreen and counters aren't affected. |
| QZT-08 | P1 | Remove an uploaded file | Reverts to unanswered |
| QZT-09 | P1 | View a question image, open it and download it | Image loads, opens in a viewer and downloads. Doesn't count as a violation. |
| QZT-10 | P0 | Answer everything and submit | "Quiz submitted successfully!" |
| QZT-11 | P0 | After submitting, watch the next few seconds `D-22` | Exits fullscreen and returns to `/quizzes`, with no violation warning, countdown or error |
| QZT-12 | P0 | Exit fullscreen once, return, then submit normally `D-22` | Single submission, no auto-submit overlay |
| QZT-13 | P1 | Double-click Submit, or click again during the success message | One submission, and no error |
| QZT-14 | P0 | Open a quiz you've already submitted | Says it's already submitted and offers the result. Doesn't let you redo it and then fail. |
| QZT-15 | P0 | Open a closed quiz | Clear "deadline passed", not "Failed to load quiz" |
| QZT-16 | P0 | After the deadline, open a quiz that allows late work `D-07` | Quiz opens, and the submission is marked Late |
| QZT-17 | P0 | Start before the deadline and submit after it, with late off | Clear message. Check what happens to the answers. |
| QZT-18 | P0 | Answer everything, corrupt the token, submit `D-15` | Answers aren't lost, and the student is able to recover |
| QZT-19 | P1 | Open `/quiz/abc` and `/quiz/999999` | Clear message, with a way back |
| QZT-20 | P1 | Open a quiz from a course you're not paid in | Clear no-access message |
| QZT-21 | P1 | Click Back to Quizzes during a quiz `D-46` | Warns first. Check whether the attempt is lost. |
| QZT-22 | P1 | Click sidebar links during a quiz `D-46` | Warned or blocked |
| QZT-23 | P1 | Use the browser Back button during a quiz | Warned, or handled sensibly |
| QZT-24 | P2 | Upload an unsupported or 20 MB file as an answer [H] | Enforces the stated 10 MB limit |
| QZT-25 | P2 | As a TA, take a quiz | Record whether this should be allowed |
| QZT-26 | P1 | As admin, open `/quiz/{id}` | Redirects to `/dashboard` |
| QZT-27 | P2 | Lose the network during submit | Clear error, answers kept, can retry |
| QZT-28 | P1 | Check the MCQ payload in the network panel before submitting | Correct answers aren't sent to the browser |

### 8.23 Proctoring

Use a fresh quiz per scenario, since each student gets one attempt.

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZP-01 | P0 | Switch tabs once | Warning shows 1 of 2, counter updates |
| QZP-02 | P0 | Switch tabs a second time | Countdown overlay from 5 |
| QZP-03 | P0 | Answer all questions first, then let auto-submit run `D-02` | Submission contains **the answers given** |
| QZP-04 | P0 | As admin, open that submission `D-02` | Answers present, tab switches = 2, AUTO-SUBMIT and FLAGGED shown |
| QZP-05 | P0 | Exit fullscreen with Esc, once | Warning 1 of 2, and a Return to Fullscreen button |
| QZP-06 | P1 | Click Return to Fullscreen | Fullscreen resumes |
| QZP-07 | P0 | Exit fullscreen twice `D-02` | Auto-submits with answers and counters intact |
| QZP-08 | P1 | Check the rules against behaviour: they say "more than 2 times" `D-45` | Wording matches when auto-submit fires |
| QZP-09 | P1 | Copy, paste and right-click during a quiz | Blocked, each with a warning |
| QZP-10 | P0 | Refresh during a quiz, after answering and after a violation `D-46` | Answers and violation counts survive. Refresh can't reset them. |
| QZP-11 | P1 | Open DevTools in fullscreen, or use a second monitor | Record what's detected |
| QZP-12 | P1 | Alt-Tab to another window without hiding the page [H] | Record whether it's detected |
| QZP-13 | P1 | Choose a file for an answer while fullscreen [H] | The dialog doesn't count against the student |
| QZP-14 | P1 | Click Submit during the countdown | Exactly one submission |
| QZP-15 | P1 | Trigger tab and fullscreen limits close together | Exactly one submission, with no error |
| QZP-16 | P2 | In `npm run dev`, watch the network panel during auto-submit `D-02` | One POST. Record any duplicate. |
| QZP-17 | P1 | Submit normally with 1 tab switch and 1 fullscreen exit | Not flagged, with both counters shown in yellow |
| QZP-18 | P2 | Deny fullscreen, or use a browser that blocks it | Clear message, not a broken state |
| QZP-19 | P1 | [API] Submit with `tab_switches: 0` after real violations `D-47` | Know that counters come from the client. Record it. |
| QZP-20 | P1 | Check quiz copy after submission | Warnings and counters stop once submitted |

### 8.24 Quiz grading and student result

#### Grading

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZG-01 | P0 | As admin, go to Quizzes, then Grade submissions, and pick a quiz | Grouped by course. Totals show. |
| QZG-02 | P0 | Enter a whole-number score and click Grade | Success message. Row turns graded. Student notified. |
| QZG-03 | P0 | Enter 7.5 `D-08` | "Quiz scores must be whole numbers". **The page must not crash.** |
| QZG-04 | P1 | Enter a score over the maximum, and a negative | Clear messages |
| QZG-05 | P1 | Check flagged and auto-submitted rows | Badges and counters are right |
| QZG-06 | P0 | Click View Answers | Modal shows each question and answer, with file links |
| QZG-07 | P0 | Use View and Download on an uploaded answer | Both work with the original name |
| QZG-08 | P0 | Check MCQ grading: does the system score MCQs automatically? `D-28` | MCQs auto-score, or the grader sees which answers are correct |
| QZG-09 | P0 | Change a score after grading `D-29` | There's a way to do it |
| QZG-10 | P0 | Add a written remark to a quiz grade `D-29` | There's a way to do it, and the student sees it |
| QZG-11 | P1 | Upload, view and remove a solution [H] | Each works, and students' access follows |
| QZG-12 | P1 | Back to Quizzes, then choose another quiz | Right data. Nothing left over from before. |
| QZG-13 | P2 | Look for stray "0" text in rows with no violations `D-45` | None |
| QZG-14 | P1 | Open a quiz with no submissions | Empty message |
| QZG-15 | P1 | Grade 0 | Saves as graded with 0 |
| QZG-16 | P0 | Open `/quiz-submissions/1/grade` as admin `D-25` | A working page, or it's removed. Not blank. |
| QZG-17 | P1 | Open the same URL as a student `D-25` | A permission message, not blank |

#### Student's view of a quiz result

| ID | Pri | Test | Expected |
|---|---|---|---|
| QZS-01 | P0 | Open a submitted, ungraded quiz | "Under review", with submit date |
| QZS-02 | P0 | Open a graded quiz | Score, total, percent and rating |
| QZS-03 | P1 | Open with a score of 0 | Shows 0, with a sensible percent |
| QZS-04 | P1 | Open a flagged and a late submission | Decide if a flag should be visible to students. Late badge shows. |
| QZS-05 | P0 | Download the solution after submitting | Downloads |
| QZS-06 | P1 | Open `/quiz/{id}/grades` without submitting | "You have not submitted this quiz yet." |
| QZS-07 | P1 | Open a quiz from another course `D-50` | Refused, and the title doesn't read "null - Your Grade" |
| QZS-08 | P2 | Click Back to Quizzes when opened from `/results` | Goes somewhere sensible |

### 8.25 Results

| ID | Pri | Test | Expected |
|---|---|---|---|
| RES-01 | P0 | With graded work, open `/results` | Overall grade, standing, trend and Recent Results all show |
| RES-02 | P0 | Compare each item with its original grade | Scores and maximums match |
| RES-03 | P0 | Check the average by hand | Right percentage, with a known weighting rule |
| RES-04 | P1 | Check letter boundaries: 90 A, 80 B, 70 C, 60 D, below F | Right letter at each boundary |
| RES-05 | P1 | Check the ring | Matches the percentage |
| RES-06 | P1 | Check the trend, with 1 item and with over 8 | Oldest to newest. Latest 8 kept. One item draws without errors. |
| RES-07 | P1 | Filter by course | Numbers and lists recalculate. All courses stay in the dropdown. |
| RES-08 | P1 | Click a quiz result and a homework result | Quiz to `/quiz/{id}/grades`, homework to `/homework?tab=graded` |
| RES-09 | P1 | Open with no graded work | "No graded results yet", "—", no errors |
| RES-10 | P1 | Check ungraded submissions | Not counted |
| RES-11 | P2 | Check Academic standing `D-51` | Set value, or "Not provided" |
| RES-12 | P2 | Open as admin and TA | Sensible content, or the page is hidden |
| RES-13 | P1 | Unenroll or reverse payment for a course with grades | Decide what should happen. Record it. |
| RES-14 | P2 | Grade exactly 100% | Ring is full. Bars don't overflow. |

### 8.26 Notifications

| ID | Pri | Test | Expected |
|---|---|---|---|
| NTF-01 | P1 | Open the bell with no notifications | "No notifications yet" |
| NTF-02 | P0 | Check the badge | Matches the unread count, and shows 9+ above 9 |
| NTF-03 | P0 | Create homework, quiz and class. Check Student A. | One notification each, with the right icon, text and link |
| NTF-04 | P0 | Grade a quiz and a homework | "graded" notification, linking to `/results` |
| NTF-05 | P0 | Approve an enrollment | "Enrollment confirmed", linking to `/courses` |
| NTF-06 | P0 | Submit a payment proof | Every admin gets "Payment proof to review" |
| NTF-07 | P1 | As admin, click that notification | Takes the admin to the Payments tab, not just the dashboard |
| NTF-08 | P1 | Click an unread notification | Marked read, count drops, navigates |
| NTF-09 | P1 | Click Mark all read | All read, badge gone. Stays after a reload. |
| NTF-10 | P1 | Leave the page open for 45 seconds after a new event | Appears without a reload |
| NTF-11 | P1 | Check who doesn't get notified: unpaid and other-course students | None received |
| NTF-12 | P2 | Check time labels | "Just now", minutes, hours, days, then a date |
| NTF-13 | P1 | [API] Mark another user's notification read (`/notifications/{id}/read`, PATCH) | 404 |
| NTF-14 | P2 | Check whether admins get notified about their own actions | Record it, since admins are auto-enrolled |
| NTF-15 | P2 | Have over 20 notifications | Newest 20 listed. Scrolls. |
| NTF-16 | P2 | Make the notification request fail | Portal keeps working |

### 8.27 TA workspace

| ID | Pri | Test | Expected |
|---|---|---|---|
| TAP-01 | P0 | Log in as `qa_ta` | Grading Workspace, with quiz and homework tabs |
| TAP-02 | P0 | Open the Quiz tab | Only quizzes in assigned courses |
| TAP-03 | P0 | Open the Homework tab | Only homework in assigned courses |
| TAP-04 | P0 | Grade one quiz and one homework | Both save, and students are notified |
| TAP-05 | P0 | [API] Fetch QA-102 submissions (`/quiz-submissions/quiz/{id}`, `/homeworks/{id}/submissions`) | 403 |
| TAP-06 | P0 | [API] Grade a QA-102 submission | 403 |
| TAP-07 | P1 | Upload and remove a solution | Works in assigned courses |
| TAP-08 | P1 | [API] Upload a solution in QA-102 | 403 |
| TAP-09 | P1 | Open `/ta` | Same workspace |
| TAP-10 | P1 | With no assigned courses | Text fits a TA, not "Create your first homework" |
| TAP-11 | P1 | Visit `/homework` and `/quizzes` | TA grading views |
| TAP-12 | P2 | Visit `/courses` and look at Request enrollment | Decide if a TA should see that. Record it. |
| TAP-13 | P1 | Check the TA can't reach admin tools | No admin panel and no admin data |
| TAP-14 | P1 | [API] TA tries admin actions: create course, role change | 403 |
| TAP-15 | P2 | [API] Use `/ta/pending-quiz-submissions`, `/ta/pending-homework-submissions` | Work, scoped to assigned courses. Record that the UI doesn't use them. |
| TAP-16 | P2 | [API] Grade with remarks through `/ta/quiz-submissions/{id}/grade?score=5&remarks=ok`, POST | Saves, and the student sees the remark |

### 8.28 Access control

Run each row while logged out, as Student B, as TA and as admin.

#### Routes

| ID | Pri | Test | Expected |
|---|---|---|---|
| AUZ-01 | P0 | Open every portal route in [section 6](#6-who-can-open-what) while logged out | Redirects to `/login` with no flash of private content |
| AUZ-02 | P0 | Open `/ta` as a student | Redirects to `/dashboard` |
| AUZ-03 | P0 | Check that a student's dashboard shows no admin or TA panel | Student view only |
| AUZ-04 | P1 | Change `is_admin` in React state or localStorage | No admin data becomes available |
| AUZ-05 | P1 | Open each grade page as a student `D-25` | A permission message |

#### API authorization [API]

Log in as Student B for "student" and call each endpoint. Repeat with `noAuth: true` for "anonymous". Expected: 403 as student, 401 anonymous.

| ID | Pri | Method and path |
|---|---|---|
| AUZ-10 | P0 | GET `/users/` |
| AUZ-11 | P0 | PATCH `/users/1/role` `{"is_admin":true,"is_ta":false}` |
| AUZ-12 | P0 | PATCH `/users/1/payment` `{"payment":true}` |
| AUZ-13 | P0 | PATCH `/users/1/academic-profile` `{"major":"x"}` |
| AUZ-14 | P0 | POST `/courses/` `{"name":"x","code":"x"}` |
| AUZ-15 | P0 | GET `/admin/courses/enrollments/1` |
| AUZ-16 | P0 | POST `/admin/courses/enroll` `{"user_id":1,"course_id":1}` |
| AUZ-17 | P0 | POST `/admin/courses/unenroll` `{"user_id":1,"course_id":1}` |
| AUZ-18 | P0 | PATCH `/admin/courses/payment` `{"user_id":1,"course_id":1,"paid":true}` |
| AUZ-19 | P0 | POST `/live-classes/` (use a valid body) |
| AUZ-20 | P0 | GET `/live-classes/` |
| AUZ-21 | P0 | POST `/live-classes/1/attachment` |
| AUZ-22 | P0 | POST `/homeworks/` (use a valid body) |
| AUZ-23 | P0 | POST `/homeworks/grade` `{"submission_id":1,"score":100}` |
| AUZ-24 | P0 | GET `/homeworks/1/submissions` |
| AUZ-25 | P0 | POST `/quizzes/` (use a valid body) |
| AUZ-26 | P0 | POST `/quiz-submissions/grade` `{"submission_id":1,"score":10}` |
| AUZ-27 | P0 | GET `/quiz-submissions/quiz/1` |
| AUZ-28 | P0 | GET `/quiz-submissions/1/answers` |
| AUZ-29 | P0 | GET `/admin/whatsapp/courses/1/whatsapp-link` |
| AUZ-30 | P0 | POST `/admin/whatsapp/courses/1/whatsapp-link` `{"whatsapp_invite_link":"https://x"}` |
| AUZ-31 | P0 | DELETE `/admin/whatsapp/courses/1/whatsapp-link` |

#### Cross-course content [API]

As Student A, who has no access to QA-102. Expected: 403.

| ID | Pri | Method and path |
|---|---|---|
| AUZ-40 | P0 | GET `/homeworks/course/{QA-102 id}` |
| AUZ-41 | P0 | POST `/homeworks/{QA HW Other id}/submit` |
| AUZ-42 | P0 | GET `/quizzes/course/{QA-102 id}` |
| AUZ-43 | P0 | GET `/quizzes/{quiz in QA-102}` |
| AUZ-44 | P0 | POST `/quiz-submissions/` for a QA-102 quiz |
| AUZ-45 | P0 | GET `/live-classes/{class in QA-102}/zoom-sdk` |
| AUZ-46 | P0 | GET `/chat/{class in QA-102}/messages` |
| AUZ-47 | P1 | GET `/homeworks/{QA HW Other id}/solution` |

### 8.29 Security

**Run these on a local or test environment only.** Record status codes. Don't copy secret values into reports.

| ID | Pri | Test | Expected |
|---|---|---|---|
| SEC-01 | P0 | Request `/uploads/..%5C.env` and `/uploads/payments/..%5C..%5C.env` on the local Windows backend, logged out and then logged in. **Status only.** `D-01` | 401 logged out, 404 logged in. Never 200. |
| SEC-02 | P0 | Check the Railway deployment with the same requests. **Status only.** Mark `BLOCKED` until the fixes are deployed. `D-01` | 401 logged out, 404 logged in, once the fix is deployed. Never 200. |
| SEC-03 | P0 | In the Network panel, copy a payment proof URL from the admin view and open it in incognito `D-04` | 401 |
| SEC-04 | P0 | Same for a homework file, quiz answer file, solution and class material, logged out. [API] Then fetch each as a student who shouldn't have access. `D-04` | 401 logged out, 403 for a student without access |
| SEC-23 | P0 | As an admin, click View on a PDF, a PNG and a TXT file, including a payment proof `D-04` | Each opens in a new tab with no popup warning. Check PDFs especially, because the site sets strict cross-origin headers. |
| SEC-24 | P0 | Click Download on a homework file, solution, class material and quiz question image `D-04` | The right file downloads |
| SEC-25 | P0 | Load a quiz with a question image and a homework with an image `D-04` | Images display for enrolled students |
| SEC-26 | P1 | As a grader, click View on a submission uploaded as `page.html` `D-04` | The file downloads. It doesn't render, and no script runs. |
| SEC-05 | P0 | Confirm with the owner that `SECRET_KEY` is set on the deployment. It's missing from local `.env`. `D-05` | Set to a long random value |
| SEC-06 | P0 | [API] As a paid student who hasn't submitted, read `solution_url` from `/homeworks/course/{id}` `D-23` | Field is empty or missing until the student submits |
| SEC-07 | P1 | [API] Log in as a student and read `/quizzes/{id}` | No `is_correct` anywhere |
| SEC-08 | P1 | [API] Upload `page.html` to `/uploads/homeworks`, then open it with `?mode=view` `D-41` | Refused, or served as a download |
| SEC-09 | P1 | [API] Upload `big_51mb.pdf` to `/homeworks/{id}/submit` and `/uploads/quiz-answer` `D-41` | Server enforces a size limit |
| SEC-10 | P1 | [API] Submit a quiz with options from another question, or another quiz's question IDs `D-47` | Rejected |
| SEC-11 | P1 | [API] Submit a quiz with `uploaded_file_url` pointing at someone else's file `D-47` | Rejected |
| SEC-12 | P1 | Enter `<script>alert(1)</script>` in course, class, homework, quiz and message fields. View as a student. | Shown as text, nothing runs |
| SEC-13 | P1 | Enter `' OR 1=1 --` in text fields | Stored as text, with no SQL error |
| SEC-14 | P1 | Open `/docs` on the deployed API, with no login | Decide whether API docs should be public |
| SEC-15 | P1 | Check CORS: call the API from an unlisted origin | Blocked |
| SEC-16 | P1 | Review the CORS list in `main.py` | Contains only real origins. It includes `meramusafir.vercel.app` and `mera-musafir-web.vercel.app`, which look like another project. |
| SEC-17 | P1 | Check the token is in the WebSocket URL | Note that the token appears in server logs. Decide if that's acceptable. |
| SEC-18 | P1 | Check for token storage | Stored in localStorage. Record as a known XSS exposure. |
| SEC-19 | P2 | [API] Use a refresh token as an access token | Refused. Refresh and access tokens have no type claim, so check this. |
| SEC-20 | P2 | Open `/test-image-feature` logged out `D-44` | Removed from production |
| SEC-21 | P2 | Change a logged-in user's password, then reuse the old token `D-42` | Old token stops working |
| SEC-22 | P2 | Check the deployment's response headers | Sensible set, with HTTPS enforced |

### 8.30 JazzCash

There's no UI for this. API only.

| ID | Pri | Test | Expected |
|---|---|---|---|
| JAZ-01 | P1 | Look for an online payment button in the UI `D-24` | Exists, or confirm with the owner that this is abandoned |
| JAZ-02 | P0 | [API] As Student B, POST `/payments/jazzcash/initiate/{course id}`. Don't paste the response. `D-24` | Returns URL and payload, **without `pp_Password`** |
| JAZ-03 | P1 | [API] Call it again `D-24` | Allowed after the first attempt expires. Must not block forever. |
| JAZ-04 | P1 | [API] Call for a course you've already paid for | 409 |
| JAZ-05 | P1 | [API] Call for a nonexistent course | 404 |
| JAZ-06 | P0 | POST the callback with no hash, and with a wrong hash | 400 each |
| JAZ-07 | P1 | Run a sandbox payment end to end, if sandbox credentials work [H] | Enrollment activates. Notification and message arrive. Student lands on a useful page. |
| JAZ-08 | P1 | Run a failed sandbox payment [H] | Status FAILED, no access, student can retry |
| JAZ-09 | P2 | Check the amount | Comes from the course. It's hard-coded to PKR 2,000 for every course. |
| JAZ-10 | P2 | Replay a success callback | No duplicate notification or message |

### 8.31 Mobile and responsive

Test at 390 x 844 and 768 x 1024. Also check 1440 x 900 for desktop layouts.

| ID | Pri | Test | Expected |
|---|---|---|---|
| MOB-01 | P0 | Open `/`, `/about`, `/our-teachers` and `/contact` | No sideways scroll, and readable text |
| MOB-02 | P0 | Log in, sign up | Forms fit. The login card isn't cut off on a short screen. |
| MOB-03 | P0 | Open the sidebar, follow each link, and close with X and overlay | All work, and it closes on navigation |
| MOB-04 | P1 | Look for search on phones | Hidden below 640 px. Record that pages depending on it have no alternative. |
| MOB-05 | P0 | Request enrollment with a proof | Modal fits and scrolls; the file picker works |
| MOB-06 | P0 | Take a quiz on a phone | Rules, fullscreen and answering work. iPhones have limited fullscreen support, so check this doesn't cause false violations. |
| MOB-07 | P0 | Submit homework | Modal and upload work |
| MOB-08 | P1 | Open the admin panel | Tabs and forms are usable |
| MOB-09 | P1 | Use Messages on a phone | List and chat both reachable and usable |
| MOB-10 | P1 | Open notifications | Panel stays on screen |
| MOB-11 | P1 | Open the grading views | Usable, with the grading modal scrolling |
| MOB-12 | P1 | Open Zoom on a phone [H] | Works, or says it's not supported |
| MOB-13 | P2 | Rotate between portrait and landscape | Layout adapts |
| MOB-14 | P2 | Check long names and titles in cards | They truncate or wrap, and don't overflow |

### 8.32 Resilience

| ID | Pri | Test | Expected |
|---|---|---|---|
| ERR-01 | P0 | Stop the backend, then reload `/dashboard` `D-33` | Clear error with a retry, not an endless spinner |
| ERR-02 | P1 | Stop the backend and reload each portal page | Same |
| ERR-03 | P1 | Stop the backend, then submit each form | Readable error. Input isn't lost. |
| ERR-04 | P1 | Use Slow 3G for login, a homework upload and a quiz submit | Loading state, no double submit, no false errors |
| ERR-05 | P1 | Reconnect after being offline | Next action works without a full reload |
| ERR-06 | P1 | Make a request return 500 (block with DevTools overrides) | Clear error |
| ERR-07 | P2 | On `/homework/{id}/grades`, make a request fail with the backend down | User isn't logged out for a network blip |
| ERR-08 | P1 | Open portal pages in several tabs | No conflicts |
| ERR-09 | P2 | Reload at every page | No hydration warnings in the console |
| ERR-10 | P1 | Clear localStorage during use | Goes to `/login` on the next action |
| ERR-11 | P2 | Have a very long list: 50 notifications, 50 classes | Page stays responsive |
| ERR-12 | P2 | Test on Chrome, Firefox, Edge and Safari [H] | Core journeys work. Zoom and fullscreen are the highest risk. |

### 8.33 Accessibility and quality

| ID | Pri | Test | Expected |
|---|---|---|---|
| A11-01 | P1 | Pinch-zoom on a phone `D-49` | Zoom is allowed |
| A11-02 | P1 | Use only the keyboard: log in, go through the sidebar, open a modal | All reachable with a visible focus |
| A11-03 | P1 | Press Esc in each modal | Closes it |
| A11-04 | P1 | Tab inside a modal | Focus stays in the modal |
| A11-05 | P1 | Check form labels are tied to inputs | Screen readers announce each field |
| A11-06 | P2 | Check icon-only buttons | Each has an accessible name |
| A11-07 | P2 | Check text contrast, especially the very small 9 to 10 px labels | Readable, and meets contrast rules |
| A11-08 | P2 | Check page titles | Each page has its own title. All currently share one. |
| A11-09 | P2 | Check headings | One H1 per page, in order. Subjects and Reviews use H1 on the landing page. |
| A11-10 | P2 | Check images have useful alt text | They do |
| A11-11 | P2 | Check animations with reduced motion on | Respected |
| A11-12 | P2 | Check the favicon and social preview | Present |
| A11-13 | P2 | Run Lighthouse on `/`, `/login` and `/dashboard` | Record scores. Note video and image sizes. |

---

## 9. Defects suspected from the code

These came from reading the code on 2026-11-01. **Nothing here has been confirmed in a browser yet.** That's what this test run is for.

### Fixed in code: retest these first

The descriptions below show the original problem. These were changed on 2026-11-01, but none has been tried in a browser. Treat each as unproven until its tests pass.

| ID | What changed | Checked so far | Still open |
|---|---|---|---|
| D-01 | Filename checks block traversal | Backend test on Windows with a decoy `.env` | Check Railway once deployed |
| D-02, D-22 | Auto-submit uses current answers and counters. Monitoring stops once submitted. | Compiles only | Everything; run QZP and QZT tests |
| D-03 | Zoom setup reruns when the session is ready | Compiles only | A real meeting |
| D-04 | Files need a login and a per-file permission. The site now fetches them with the token instead of plain links. | 55 permission checks across roles | Viewing and downloading in a browser (SEC-23 to SEC-26) |
| D-06 | `/homework` shows instructions, image and, after submitting, the solution, under Details | API only | The page itself |
| D-08 | Quiz scores are whole numbers only, and errors no longer crash the page | API rejects 7.5 | The page itself |
| D-09 | Admin pages and class joining cope with a missing name | Join tested on the API | Admin pages (PRF-10) |
| D-17 | Join, mobile Login and Join, Enroll Now, Learn More, Start Learning and Schedule Demo now link somewhere. So do the footer's Home, Courses, Popular Courses and Contact Us. | Compiles only | Footer policy, Learning Tools, My Credentials and social links, plus subject cards, still go nowhere |
| D-20 | Contact form sends to every admin's notifications, with a limit of 5 per hour per address | API tested | The form itself. No email is sent. |
| D-23 | The URL is still in the API response, but the file now refuses students who haven't submitted | Permission checks | |
| D-45 | Rules wording now matches when auto-submit fires. The stray "0" isn't fixed. | Compiles only | QZG-13 |

**Evidence:**
- **Ran:** the failing piece was run directly and behaved as described.
- **Read:** found by reading the code. Likely, but unproven until tested.

### Critical

| ID | Problem | Where | Evidence | Tests |
|---|---|---|---|---|
| D-01 | **Anyone can download `backend/.env` when the backend runs on Windows.** An encoded backslash (`..%5C`) gets past the filename routes with no login. A request returned 200 and the 933 bytes of that file (contents not viewed). It holds the database password plus Twilio, Zoom and JazzCash credentials. Linux hosts probably aren't affected, since a backslash isn't a path separator there. Confirm on Railway. | `backend/routers/uploads.py:81-173` | Ran | SEC-01, SEC-02 |
| D-02 | **Auto-submit sends blank answers.** The monitoring effect keeps the first render's `handleSubmit`, so `answers` is empty and both counters are 0. A student who gets auto-submitted loses every answer. | `frontend/app/components/Quizzes/QuizTaker.tsx:76-139, 183-197, 331-351` | Read | QZP-03, QZP-04, QZP-07 |
| D-03 | **Zoom may never start.** The setup effect exits until `sessionReady` is true, but `sessionReady` isn't in its dependency list, so nothing reruns it. Expect an empty screen in place of the meeting. | `frontend/app/components/ZoomProvider.tsx:382-393, 490` | Read | MTG-02, MTG-03 |
| D-04 | **Uploaded files have no access control.** Payment receipts, homework, quiz answers and solutions all open for anyone with the URL. | `backend/routers/uploads.py`, `backend/main.py:67` | Read | SEC-03, SEC-04 |
| D-05 | **`SECRET_KEY` isn't set locally and has a public fallback.** If production also lacks it, anyone can forge an admin login. | `backend/core/config_template.py:8`, `backend/.env` | Ran (key absent) | SEC-05 |

### High

| ID | Problem | Where | Evidence | Tests |
|---|---|---|---|---|
| D-06 | **Students can't read assignments.** `/homework` shows only title, course and due date. Description, image and solution don't appear. `HomeworkList` and `HomeworkViewer` are unused, and nothing links to `/homework/[id]/grades`. | `frontend/app/homework/page.tsx:148`, `backend/routers/homework.py:104-119` | Read | HWS-02, HWS-12, HWS-17 |
| D-07 | **Late quizzes can't be opened.** After the deadline, `is_published` is already false, so an `allow_late` quiz returns 403 even though the list offers Start quiz. | `backend/crud/quizzes.py:93-98`, `backend/models/quiz.py` | Read | QZT-16 |
| D-08 | **A half-mark score crashes the page.** The input allows 0.5 steps, the API rejects non-integers, and the error array is rendered directly, which React can't do. | `frontend/app/components/Quizzes/QuizSubmissionsGrading.tsx:323, 718`, `backend/schemas/quiz_submissions.py` | Ran (API rejects 7.5) | QZG-03 |
| D-09 | **One student can crash admin pages.** Blanking a name in Profile stores null. Enrollments and Access Roles then call `.toLowerCase()` on it. That student also can't join classes, since the join response requires a name. | `frontend/app/components/Admin/EnrollStudentForm.tsx:163`, `ManageAdminTA.tsx:159`, `backend/schemas/live_classes.py` | Ran (null accepted; join schema rejects it) | PRF-10, MTG-13 |
| D-10 | **Blank email causes a server error.** The form sends null, and the database rejects it with a 500. | `frontend/app/profile/page.tsx:110-112`, `backend/routers/user_profile.py:32` | Ran (null accepted by schema) | PRF-04 |
| D-11 | **A proof can't be rejected.** Unpaid leaves the student on "Pending review", and resubmitting is blocked. | `backend/routers/courses.py:92`, `ManagePayments.tsx` | Read | PAY-08, PAY-09, CRS-19 |
| D-12 | **Students can't be unenrolled in the UI.** The code exists, but the list hides anyone enrolled or pending, so there's nothing to click. | `frontend/app/components/Admin/EnrollStudentForm.tsx:167-171` | Read | ENR-08, ENR-09 |
| D-13 | **Students can't contact anyone outside a live class.** New Request, Message admissions, Advising chat and Report a schedule issue all open a page that only shows live classes. New students are told to message admissions for payment details, and can't. | `frontend/app/components/Messages/MessagesWorkspace.tsx:63` | Read | CRS-06, CHT-02, NAV-05, SCH-14 |
| D-14 | **Schedule freezes after uploading notes.** The dark overlay stays after the modal closes, until a reload. | `frontend/app/components/Schedule/PastClassAttachment.tsx:113-119`, `frontend/app/schedule/page.tsx:254` | Read | PCL-04 |
| D-15 | **Sessions end after 30 minutes with no renewal.** The refresh token is discarded. A 60-minute quiz outlasts the session, so submit fails. | `frontend/app/login/page.tsx:39`, `backend/routers/auth.py:72` | Read | LGN-13, QZT-18 |
| D-16 | **Quiz time limit isn't enforced.** There's no timer on screen and nothing submits at the limit. | `frontend/app/components/Quizzes/QuizTaker.tsx` | Read | QZT-03, QZT-04 |
| D-17 | **Most calls to action do nothing.** Join, mobile Login, Enroll Now, Learn More, Start Learning and Schedule Demo have no handler. All footer links go to `#`. A phone visitor has no Login button that works. | `Landing/Header/Header.tsx:86, 215-220`, `Banner.tsx:36-42`, `Teach.tsx:22`, `Subjects.tsx:196`, `Footer.tsx:19-44, 158-163` | Read | PUB-05, PUB-08, PUB-09, PUB-11, PUB-12, PUB-14, PUB-16, PUB-17, PUB-21 to PUB-23 |
| D-18 | **Login by email fails** even though the label says "Username or Email". | `frontend/app/login/page.tsx:80`, `backend/routers/auth.py:41` | Read | LGN-02 |
| D-19 | **No password reset.** Forgot password links to `#`, and Remember me does nothing. A student who forgets a password is stuck. | `frontend/app/login/page.tsx:129-133` | Read | LGN-07, LGN-08 |
| D-20 | **The contact form sends nothing.** It waits 1.5 seconds and shows "Thank you!". | `frontend/app/contact/page.tsx:53-71` | Read | CON-03 |
| D-21 | **Join Class always fails after creating a class.** Classes must start in the future, and joining before the start is refused. The host can't open early either. The page only says "Failed to load the meeting". | `CreateLiveClassForm.tsx:140-143`, `backend/crud/live_classes.py:79`, `frontend/app/meeting/[id]/page.tsx:34` | Read | LCC-06, MTG-04 |
| D-22 | **Normal submit can trigger auto-submit.** Exiting fullscreen after a successful submit counts as a violation. If there was one exit already, the countdown appears and a second submit fails. | `frontend/app/components/Quizzes/QuizTaker.tsx:90-92, 384-385` | Read | QZT-11, QZT-12 |
| D-23 | **Homework solutions leak early.** The course homework list returns `solution_url` before a student submits. | `backend/schemas/homeworks.py:11`, `backend/routers/homework.py:55-62` | Read | SEC-06 |
| D-24 | **JazzCash isn't connected, and its API is unsafe.** The UI never calls it. The response includes the merchant password. An unfinished payment blocks new attempts forever. The price is fixed at PKR 2,000. | `backend/routers/payments.py:39-47, 64-67`, `backend/crud/payments.py:22` | Read | JAZ-01 to JAZ-03, JAZ-09 |
| D-25 | **Both grade pages are blank.** They call endpoints that don't exist (each returned 404), then render nothing. | `frontend/app/quiz-submissions/[id]/grade/page.tsx`, `frontend/app/homework-submissions/[id]/grade/page.tsx` | Ran (API 404) | HWG-16, HWG-17, QZG-16, QZG-17 |
| D-26 | **Upload Image submits the quiz.** The button has no `type="button"`, so inside the form it submits. A half-finished quiz may be created and students notified. | `frontend/app/components/QuestionImageUpload.tsx:181, 238` | Read | QZC-05, QZC-06 |
| D-28 | **Quiz form accepts bad quizzes, and MCQs aren't marked.** Blank options, no correct answer and wrong totals all pass. `is_correct` is never used to score, and graders can't see it. "Short Answer" requires a file upload. | `CreateQuizForm.tsx:132-138`, `backend/crud/quiz_submissions.py` | Read | QZC-03, QZC-04, QZC-15, QZG-08 |
| D-29 | **Quiz grades can't be changed or commented on.** The score field disappears after grading, and the API takes no remarks. The site promises personal feedback on every quiz. | `QuizSubmissionsGrading.tsx:712`, `backend/schemas/quiz_submissions.py` | Ran (no remarks field) | QZG-09, QZG-10, PUB-27 |
| D-30 | **Homework graders can't see who submitted.** The API omits the student, so the modal shows "Student #12". | `backend/schemas/homeworks.py`, `HomeworkSubmissionsModal.tsx:341` | Ran (no user field) | HWG-02 |
| D-32 | **Duplicate course code shows "Network error".** The database error becomes a 500 with no CORS header, which the browser reports as a network failure. | `backend/models/courses.py`, `CreateCourseForm.tsx:69-70` | Read | ACR-03 |
| D-33 | **Server errors mean an endless spinner.** Pages show the loader whenever `user` is null, so the error message never appears. | `usePortalUser.ts:39`, `frontend/app/dashboard/page.tsx:142` | Read | ERR-01, ERR-02 |
| D-34 | **Role management has traps.** The role changes even if the enrollment step then fails. There's no way back to student. An admin can demote themselves. Mark as paid doesn't affect course access. | `frontend/app/components/Admin/ManageAdminTA.tsx:79-100, 125-155` | Read | ROL-05, ROL-07, ROL-08, ROL-10 |
| D-35 | **Class WhatsApp message is wrong.** It says "CLASS LIVE NOW" when a class is scheduled, goes to unpaid students as well, and includes the direct Zoom link, which skips payment and device checks. Zoom duration is fixed at 60 minutes. | `backend/crud/live_classes.py:35-48`, `backend/core/whatsapp.py:83`, `backend/core/zoom_api.py:40` | Read | LCC-12, LCC-13 |
| D-36 | **Chat can silently lose messages.** A second message within a second is dropped, while the text box clears. Redis is fixed to `localhost` in code, so chat also needs Redis on the same host in production. | `backend/routers/websocket.py:318-323`, `MessagesWorkspace.tsx:143-144`, `backend/core/redis.py:5` | Read | CHT-08, CHT-16 |
| D-37 | **Live MCQ can mark the wrong answer.** Blank options are filtered out, but the correct index isn't adjusted. | `frontend/app/components/ZoomProvider.tsx:297-303` | Read | MCQ-04 |
| D-46 | **Refreshing resets a quiz.** Answers and violation counts live only in memory, so a refresh wipes both, which also bypasses proctoring. Back to Quizzes leaves with no warning. | `QuizTaker.tsx:47-53`, `frontend/app/quiz/[id]/page.tsx:87-93` | Read | QZP-10, QZT-21, QZT-22 |

### Medium and low

| ID | Problem | Where | Evidence | Tests |
|---|---|---|---|---|
| D-27 | Removing a quiz image doesn't cancel its upload. | `CreateQuizForm.tsx:381, 405` | Read | QZC-07 |
| D-31 | Homework scores out of range show a generic alert. Saving a remark with no score still tells the student it's graded. | `HomeworkSubmissionsModal.tsx:188-190`, `backend/routers/homework.py:160` | Read | HWG-06, HWG-07, HWG-09 |
| D-38 | Signup accepts any phone (`abc` was accepted), and Profile later refuses to save until it's fixed. | `backend/schemas/users.py:22-24, 83-92` | Ran | SGN-13, SGN-14, PRF-21 |
| D-39 | Course progress never changes. No code writes it, so it stays 0% and Completed never appears. | No writer in `backend/routers` or `backend/crud` | Ran (search found none) | DSH-12, CRS-20 |
| D-40 | "Drag and drop" text appears on upload areas with no drop handler. | `HomeworkSubmitModal.tsx:195`, `PastClassAttachment.tsx:290`, `QuizTaker.tsx:665` | Read | HWS-15, PCL-13 |
| D-41 | The server doesn't check type or size for homework, solutions, class attachments or quiz answers. Only the browser does. | `backend/routers/uploads.py`, `homework.py:170-204`, `quizzes.py:182-200` | Read | SEC-08, SEC-09, HWG-18 |
| D-42 | Changing a password doesn't end existing sessions. | `backend/routers/user_profile.py:40-53` | Read | PRF-20, SEC-21 |
| D-43 | Late homework is accepted with no late mark. May be intended. | `backend/routers/homework.py:170-204` | Read | HWS-07 |
| D-44 | `/test-image-feature` is public and claims features are complete, including some that aren't reachable. | `frontend/app/test-image-feature/page.tsx` | Read | SEC-20 |
| D-45 | Proctoring rules say "more than 2 times", but it triggers on the 2nd. The grading rows can show a stray "0". | `QuizTaker.tsx:61-62, 155, 171, 442, 446`, `QuizSubmissionsGrading.tsx:660-682` | Read | QZP-08, QZG-13 |
| D-47 | Quiz submission trusts the client: violation counts, options from other questions, and file URLs. | `backend/crud/quiz_submissions.py:44-91` | Read | QZP-19, SEC-10, SEC-11 |
| D-49 | Zoom is disabled across the site, which hurts low-vision users. | `frontend/app/layout.tsx:25-26` | Read | A11-01 |
| D-50 | Grade pages can read "null - Your Grade". | `frontend/app/quiz/[id]/grades/page.tsx:106`, `frontend/app/homework/[id]/grades/page.tsx:124` | Read | HWS-18, QZS-07 |
| D-51 | Some backend features have no screen: student ID, major, year and standing, plus the WhatsApp link after creation. Student ID always reads "Not assigned", and the course form says the link can be added later. | `backend/routers/users.py:83`, `backend/routers/whatsapp_admin.py:10`, `CreateCourseForm.tsx:163` | Ran (search found no UI calls) | DSH-05, ACR-08, RES-11 |

---

## 10. Features that don't exist

Nothing to test here, but the owner should decide whether each gap is acceptable. Record them in the final report under "Missing features".

| Area | Missing |
|---|---|
| Accounts | Password reset, email verification, username change, account deletion, 2FA |
| Admin | Edit or delete courses, classes, homework, quizzes and users |
| Admin | Edit a class's time, or cancel a class |
| Admin | Reject a payment proof, remove a TA, or return a user to student |
| Admin | Set student ID, major, year or standing; change a course's WhatsApp link |
| Admin | TA homework creation screen (the API allows it) |
| Students | Message anyone outside a live class |
| Students | Replace a homework submission, or leave a course |
| Students | See a course page. Cards only link to the schedule, so there's no syllabus or course material page. |
| Courses | Price, payment instructions, or course detail pages |
| Quizzes | Timer, automatic MCQ marking, re-grading, remarks, draft or publish state, and saving answers in progress |
| Payments | Online payment in the UI |
| Site | Terms, privacy and refund pages, even though signup requires agreeing to them |
| Site | A working contact form |
| Site | A custom 404 page |

---

## 11. How to report results

Save results to `docs/testing/TEST_RESULTS.md`. Update it as you go, so nothing is lost if a session ends.

### Status values

| Status | Meaning |
|---|---|
| `PASS` | Matches the expected result |
| `FAIL` | Doesn't match. Needs an issue entry. |
| `BLOCKED` | Couldn't run. Say why. |
| `SKIP` | Deliberately not run. Say why. |
| `QUESTION` | Behaviour is ambiguous and needs the owner's decision |

### Run summary

```markdown
# Test Results

**Date:** YYYY-MM-DD
**Tester:** Claude in Chrome
**Environment:** local frontend + local backend + [which database]
**Browser:** Chrome [version]
**Redis running:** yes/no
**SMTP configured:** yes/no

| Status | Count |
|---|---|
| PASS | |
| FAIL | |
| BLOCKED | |
| SKIP | |
| QUESTION | |
```

### Results by test

```markdown
| ID | Status | Issue | Notes |
|---|---|---|---|
| LGN-01 | PASS | | |
| LGN-02 | FAIL | ISS-001 | Email login returns "Invalid credentials" |
```

### Issue format

```markdown
### ISS-001: Short description of what's wrong

- **Severity:** Critical / High / Medium / Low
- **Test:** LGN-02
- **Suspected defect:** D-18 (confirmed) / D-18 (not reproduced) / new
- **Role and account:** qa_student_a
- **URL:** /login
- **Steps:**
  1. ...
  2. ...
- **Expected:** ...
- **Actual:** ...
- **Console or network errors:** ...
- **Screenshot:** ...
```

### Severity guide

| Severity | Use for |
|---|---|
| **Critical** | Data loss, security hole, payment problem, or a core journey that can't be completed |
| **High** | A major feature is broken, or has only a painful workaround |
| **Medium** | A feature works but is wrong, confusing or misleading |
| **Low** | Cosmetic issues and minor polish |

### Final report

End with these sections:

1. **Release blockers**: all Critical issues, and High issues on core journeys
2. **Flow results**: F-01 to F-19, each with pass or fail and the step where it broke
3. **Suspected defects**: each D-nn as confirmed, not reproduced or not tested
4. **New issues**: anything not predicted in section 9
5. **Missing features**: from section 10
6. **Blocked tests**: what's needed to run them
7. **Test data created**: what to clean up afterwards
