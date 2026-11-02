# Test Results

**Date:** 2026-11-01
**Tester:** Claude in Chrome
**Environment:** local frontend + local backend + production Railway Postgres (approved for this run)
**Browser:** Chrome 156
**Redis running:** yes (port 6379 accepts connections)
**SMTP configured:** no (per TEST_PLAN section 3; not re-checked)

**Phase:** Phases 1 to 12 run (second pass 2026-11-02: Phase 4 rerun, backend-down tests, remaining Phase 10 checks, one end-to-end journey). JazzCash (JAZ) is out of scope per the owner and is marked SKIP. Not run: real-phone mobile tests (MOB-05 to 07, 11 to 13), Zoom (blocked by ISS-020), Twilio items, keyboard/focus/contrast/Lighthouse checks, SEC-02 (needs a Railway deploy) and SEC-05 (owner question). Phase 11 used 390 px iframes, not a real phone.

Counts are table rows, not IDs (a row can cover several IDs):

| Status | Count |
|---|---|
| PASS | 281 |
| FAIL | 121 |
| BLOCKED | 19 |
| SKIP | 12 |
| QUESTION | 1 |

## Results by test

| ID | Status | Issue | Notes |
|---|---|---|---|
| SEC-01 | PASS | | Local backend, status only. Both paths: 401 logged out, 404 logged in. Run first, as section 2 requires. |
| SEC-02 | BLOCKED | | Plan says to mark BLOCKED until the fixes are deployed to Railway. |
| ENV-01 | PASS | | `{"Title":"Cambfordable"}` |
| ENV-02 | PASS | | Landing page renders, no console errors on reload. |
| ENV-03 | PASS | | `hamza` reaches Admin Control Center. The first attempt returned 401 because Chrome autofill had prefilled saved values and my typing was appended. This was tester input, not a site defect. |
| ENV-04 | PASS | | API calls after login go to `localhost:8000`, no CORS errors. The only console error is a browser extension message ("message channel closed"), not from the site. |

| ENV-05 | PASS | ISS-001 | WebSocket to `/chat/ws/live-classes/30/chat` opens, so Redis works. But the chat history request fails, see ISS-001. |
| ACR-01 | PASS | | Run as setup in Phase 1. Created QA-101 through the Create Course form handler: "created successfully!" message shown, form reset, course listed in the catalog with the WhatsApp link. `hamza` was auto-enrolled (paid) in QA-101 (seen in `/admin/courses/enrollments/5`). Fields were filled by script and submitted with `requestSubmit()` because real keyboard and mouse input stopped working; see the browser input note below. |
| ENV-06 | FAIL | ISS-002 | `/nope` shows the default black Next.js 404 with no link back to the site. |
| PUB-01 | PASS | | All sections render in order, no broken images, no console errors. |
| PUB-02 | PASS | | Logo click from `/login` goes to `/`. |
| PUB-03 | PASS | | Hrefs are `/`, `/our-teachers`, `/contact`, `/about`; real clicks on Our Teachers and Back to Home worked; all pages load 200. |
| PUB-04 | PASS | | Real click on Login goes to `/login`. |
| PUB-05 | PASS | | Real click on Join goes to `/signup`. D-17 not reproduced for Join. |
| PUB-06 | PASS | | Logged in as admin_test: header shows Dashboard and Logout; Logout clears the token and returns to `/`. |
| PUB-07 | BLOCKED | | Window resize to 390x844 did not change the page viewport (`innerWidth` stayed 2133). To run in Phase 11 with working emulation. |
| PUB-08 | BLOCKED | | Same reason as PUB-07. Header HTML has Login and Join links to `/login` and `/signup` in the mobile menu. |
| PUB-09 | BLOCKED | | Same reason as PUB-07. |
| PUB-10 | BLOCKED | | Same reason as PUB-07. |
| PUB-11 | PASS | | Banner Enroll Now links to `/signup`. D-17 not reproduced. |
| PUB-12 | PASS | | Banner Learn More links to `/about`. |
| PUB-13 | PASS | | Play starts video with sound (unmuted, volume 1); the control switches to Pause and pauses it. |
| PUB-14 | PASS | | How We Teach "Learn more" links to `/about`. |
| PUB-15 | PASS | | Teacher section link goes to `/our-teachers`. |
| PUB-16 | FAIL | ISS-005 | The six subject cards show a pointer cursor but are not links or buttons and do nothing. D-17 confirmed for subject cards. |
| PUB-17 | PASS | | Subjects Enroll Now links to `/signup`. |
| PUB-18 | PASS | | Marquee runs continuously (35s loop), pauses on hover and resumes after. The loop seam was not inspected frame by frame. |
| PUB-19 | PASS | | Opening a second FAQ closes the first; clicking an open one closes it. |
| PUB-20 | PASS | | CONTACT US goes to `/contact`. |
| PUB-21 | FAIL | ISS-005 | Learning Tools, My Credentials, Privacy Policy, Terms of Service and Refund Policy all link to `#`. Home, Courses, the Popular Courses and Contact Us links work. D-17 confirmed for these. |
| PUB-22 | FAIL | ISS-005 | The four footer social icons link to `#`. |
| PUB-23 | PASS | | Start Learning goes to `/signup`; Schedule Demo goes to `/contact`. |
| PUB-24 | FAIL | ISS-006 | Footer shows `+1 (234) 567-890`; the contact page shows `+92 345 9202628`, `+92 345 9225425`, `051-7066015`. |
| PUB-25 | PASS | | Footer has `mailto:hello@cambfordable.com` and `tel:+1234567890` links. Whether they open a handler was not tried. |
| PUB-26 | PASS | | Footer shows © 2026. |
| PUB-27 | QUESTION | | The site promises "personalized quiz and homework feedback" and multi-device use. Multi-device is stated in the FAQ. Whether quiz feedback exists depends on D-29 (QZG-09, QZG-10), tested in Phase 8. |
| ABT-01 | PASS | | All sections render with header and footer; no broken images. |
| ABT-02 | PASS | | The only way to sign up is the header Join; the page has no in-page call to action. |
| TCH-01 | PASS | | Profile, 17 images and sections load, none broken. |
| TCH-02 | PASS | | Real click on Back to Home goes to `/`. |
| CON-01 | PASS | | Three info cards and the form render. |
| CON-02 | PASS | | Empty submit shows "Please fill in all fields". |
| CON-03 | PASS | | Success message shown. As admin_test, the notification shows "From QA Tester <qa_contact@example.com>" with the full message. D-20 not reproduced: the form does send. |
| CON-04 | PASS | | `notanemail` is blocked with a valid-email message and no request. |
| CON-05 | PASS | | Spaces in every field gives "Please fill in all fields". |
| CON-06 | PASS | | Double-click sent exactly one `POST /contact`. |
| CON-07 | PASS | | After success the fields cleared and the message disappeared within about 7 seconds. |
| DEV-01 | FAIL | ISS-004 | `/meet-the-developer` crashes on load with a runtime error overlay. It is also not linked from the main site. |
| DEV-02 | BLOCKED | ISS-004 | Page does not render. |
| DEV-03 | BLOCKED | ISS-004 | Page does not render. |
| DEV-04 | BLOCKED | ISS-004 | Page does not render (and phone width is unavailable). |
| DEV-05 | BLOCKED | ISS-004 | Page does not render. |
| DEV-06 | BLOCKED | ISS-004 | Page does not render. |
| SGN-01 | PASS | | `qa_signup_1`, all valid fields. "User created successfully" appears about 1.2s after submit (backend latency), then redirects to `/login` about 1.5s later. |
| SGN-02 | PASS | | Logged in as `qa_signup_1`; dashboard greets "Good evening, QA." (first name of "QA Signup One"). |
| SGN-03 | PASS | | "Username already exists" shown. |
| SGN-04 | PASS | | "Email already exists" shown. |
| SGN-05 | FAIL | ISS-007 | `QA_Student_A` was accepted (201) next to `qa_student_a`. Login is case-sensitive, so both accounts work separately. |
| SGN-06 | FAIL | ISS-007 | `QA_STUDENT_A@EXAMPLE.COM` was accepted (201). The domain is lower-cased but the local part is kept, so it is stored as a different email. |
| SGN-07 | PASS | | Each required field (username, email, phone, password, terms) is blocked by the browser with a "Please fill in this field" style message. Full name is the only optional field. |
| SGN-08 | PASS | | Blank full name is accepted (account `qa_val_7pw`). Dashboard impact belongs to PRF-10 and DSH-11. |
| SGN-09 | PASS | | Typed 7 characters: browser says "Please lengthen this text to 8 characters or more" and no request is sent. (An earlier run on this test was invalid because the backend was down.) |
| SGN-10 | PASS | | Exactly 8 characters accepted. |
| SGN-11 | FAIL | ISS-008 | 129-character password is rejected, but the form shows the raw validator text "String should have at most 128 characters" with no field name. Checked by API; the page shows `detail[0].msg`. |
| SGN-12 | PASS | | `a@b` passes the browser check; the server rejects it and the form shows "value is not a valid email address: The part after the @-sign is not valid. It should have a period." Clear enough. |
| SGN-13 | FAIL | ISS-008 | Phone `abc` accepted (201, `qa_ph1`). D-38 confirmed: there is no phone validation at signup. |
| SGN-14 | FAIL | ISS-008 | `03001234567` (no country code) accepted (201, `qa_ph2`), although the form hint asks for a country code. An empty phone is also accepted by the API (`qa_empty`). |
| SGN-15 | PASS | | `+92 300 1234567` accepted. Later profile saves are covered by PRF-21. |
| SGN-16 | FAIL | ISS-008 | A username of three spaces was accepted (201). |
| SGN-17 | FAIL | ISS-008 | A 199-character username and a username with a space and non-Latin letters (`qa üser 日本`) were both accepted. There is no length limit. Layout with such names not checked. |
| SGN-18 | PASS | | The toggle switches the field between password and text and does not submit. |
| SGN-19 | FAIL | ISS-005 | Terms of Service and Privacy Policy links go to `#`. |
| SGN-20 | PASS | | "Login here" goes to `/login`. |
| SGN-21 | PASS | | Double-click created one account (`qa_signup_2`); the button is disabled while sending. |
| SGN-22 | PASS | | Simulated by making the page's network calls fail (the backend was not stopped): "Signup failed", button re-enabled, no crash. |
| SGN-23 | PASS | | `is_admin`, `is_ta` and `payment` in the signup body were ignored (`qa_admin_flag` is a plain student). |
| SGN-24 | FAIL | ISS-009 | With a valid session, `/signup` shows the signup form with no redirect or explanation. |
| SGN-25 | FAIL | ISS-009 | The signup page has no logo or link back to the site, only "Login here". |
| LGN-01 | PASS | | Login lands on `/dashboard` and `/auth/me` returns 200 with the stored token. |
| LGN-02 | FAIL | ISS-010 | Logging in with `qa_signup_1@example.com` returns "Invalid credentials", although the label says "Username or Email". D-18 confirmed. |
| LGN-03 | PASS | | Wrong password: "Invalid credentials", no redirect. |
| LGN-04 | PASS | | Unknown username gives the same message. |
| LGN-05 | PASS | | Empty fields blocked by the browser. |
| LGN-06 | PASS | | Show and hide works. |
| LGN-07 | FAIL | ISS-005 | "Forgot password?" is `<a href="#">` and starts no reset flow. D-19 confirmed. (A dialog element exists in the page, probably the header menu; I did not open a reset dialog.) |
| LGN-08 | FAIL | ISS-005 | The Remember me checkbox is never read; the token always goes to `localStorage`. Found by reading `login/page.tsx`. Browser close and reopen not run. D-19. |
| LGN-09 | PASS | | Simulated network failure: "Login failed", button re-enabled. |
| LGN-10 | PASS | | Sign out goes to `/login`; a reload of `/dashboard` then redirects to `/login`. |
| LGN-11 | FAIL | ISS-009 | After Sign out, the Back button shows the dashboard again, with the user's name and email, until the page is reloaded. |
| LGN-12 | FAIL | ISS-009 | A garbage token sends the user to `/login`, but nothing explains why. |
| LGN-13 | BLOCKED | ISS-011 | Needs a wait of over 30 minutes. Evidence from code: the access token lasts 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 30`), `/auth/refresh` exists, and the frontend never calls it, so D-15 is likely. |
| LGN-14 | FAIL | ISS-009 | Opening `/homework` logged out goes to `/login`, and logging in lands on `/dashboard`, not `/homework`. |
| LGN-15 | FAIL | ISS-009 | With a valid session, `/login` shows the login form with no redirect. |
| LGN-16 | PASS | | Signed out in a second tab on the same origin; the first tab went to `/login` on its next click. |
| LGN-17 | PASS | | With a garbage token the public header still shows Dashboard and Logout, but clicking through ends at `/login` (LGN-12). No message. |
| LGN-18 | PASS | | `<script>alert(1)</script>` and `' OR 1=1 --` both give "Invalid credentials". |
| LGN-19 | FAIL | ISS-011 | 20 wrong passwords in a row all returned 401, and the right password worked straight afterwards. No rate limit or lockout. |
| LGN-20 | PASS | | Enter in the password field submits. |
| PRF-10 | PASS | | Run as `qa_student_d`: a blank full name saves with no error, the API stores `null`, and the profile shows the username in its place. The admin Enrollments and Access Roles pages were not checked for that user yet (needs the `admin_test` password). Name restored to "QA Student D Edited". |
| PRF-12 | PASS | | All five gender options save; "Prefer not to say" shows as "Not provided". |
| PRF-24 | PASS | | `<img src=x onerror=...>` as name and address renders as plain text; no image injected, no handler fired. Both values restored afterwards. |
| CRS-01 | PASS | | Student A: Enrolled tab shows QA Physics, QA-101, progress 0%, Continue learning. Counts Enrolled 1 / Available 6 were right at the time. |
| CRS-02 | PASS | | Available tab lists the other courses marked "Open for enrollment". |
| CRS-03 | PASS | | Search (in the header box) filters by name and by code; "zzzz" gives "No courses found". |
| CRS-04 | PASS | | `/courses?search=QA` fills the search box and filters. (Enrolled tab is the default, so an unenrolled student sees "No courses found" until switching to Available.) |
| CRS-05 | PASS | | Modal shows course name, code, instructions and a file picker. |
| CRS-06 | FAIL | ISS-014 | "Message admissions" goes to `/messages`, which for a student with no live class says "No live classes right now" and has no way to write. D-13 confirmed. |
| CRS-07 | PASS | | Cancel and the X both close the modal with nothing submitted. |
| CRS-08 | PASS | | PDF (`qa_student_b`, QA-102), JPG (`qa_student_b`, QA-103), PNG (`qa_signup_1`, QA-101), WebP (`qa_signup_2`, QA-102) each gave "…is now pending payment review" and the card changed to Pending review. Files were set by script (DataTransfer), not the OS picker. |
| CRS-09 | PASS | | Pending card shows "Pending review" and "Your enrollment request is awaiting approval…"; no Request button. |
| CRS-10 | PASS | | The picker's `accept` filter is bypassed by a script, and the page does not reject `notes.txt` or `tool.exe` on selection (Submit stays enabled). The server rejects `text/plain` on submit with "Upload a PDF, JPEG, PNG, or WebP file" and the modal stays open. `tool.exe` was not submitted. The server checks the declared content type only. |
| CRS-11 | PASS | | 11 MB file: "Payment proof must be 10 MB or smaller.", Submit disabled, file cleared. |
| CRS-12 | PASS | | Submit for review is disabled with no file. |
| CRS-13 | PASS | | `spaces & symbols (1).pdf` uploaded (`qa_signup_2`, QA-103); the admin proof link fetched it (stored as `spaces  symbols 1_….pdf`). |
| CRS-14 | PASS | | After approval, `qa_student_c` sees QA Physics under Enrolled with Continue learning going to `/schedule`. |
| CRS-15 | FAIL | ISS-014 | No price, bank or wallet details anywhere; the modal only says admissions will give "official payment instructions". |
| CRS-16 | PASS | | 409 "Your payment proof is already pending review". |
| CRS-17 | PASS | | 409 "You are already enrolled in this course". |
| CRS-18 | PASS | | Pending `qa_student_c` on QA-101: `/homeworks/course/5` 403, `/quizzes/course/5` 403, `GET /quizzes/6` 403, `zoom-sdk` for class 31 403. `/quiz/6` shows "Failed to load quiz" and `/meeting/31` shows "Failed to load the meeting"; both are generic, not "no access". |
| CRS-19 | FAIL | ISS-013 | There is no way for an admin to reject a proof, so the student never sees a rejected state. |
| CRS-21, CRS-22 | not run | | CRS-22 only checked in code: the catalog `catch` sets an error banner and `finally` clears loading. CRS-20 (progress and Completed) not run. |
| ACR-02 | PASS | | `QA-104` without a WhatsApp link was created. |
| ACR-03 | FAIL | ISS-012 | Duplicate code `QA-101`: the form shows "Network error. Make sure the server is running." The raw API call fails with no CORS header, so the server is crashing (likely a 500). No duplicate was created. D-32 confirmed. |
| ACR-04 | PASS | | Empty name and code are blocked by the browser (`required`). |
| ACR-05 | FAIL | ISS-012 | Three spaces in both name and code created a course (id 10, name and code `"   "`). |
| ACR-06 | PASS | | `not a url` fails the browser's URL check; no request sent. |
| ACR-07 | PASS | | New courses appear in the course lists and `admin_test` is auto-enrolled (seen in the enrollments API). The admin `/courses` page itself was not opened. |
| ACR-08 | FAIL | ISS-014 | The Courses tab only has the create form. There is no screen to add or edit the WhatsApp link later, although the help text says "You can add it later". D-51 confirmed by looking at the tab. |
| ACR-09 | PASS | | Two quick clicks created one course (`QA-105`). |
| ACR-10 | PASS | | A 266-character name was accepted; the five admin tabs showed no horizontal overflow. I did not inspect how the long name is truncated in cards. |
| ACR-11 | PASS | | All five admin tabs render. Checklist text fit was not inspected closely. |
| ENR-01 | PASS | | Course list on the left and a "Select a course" prompt. |
| ENR-02 | PASS | | Selecting QA-103 lists non-enrolled students; admins are not listed. TAs are listed. |
| ENR-03 | PASS | | Name, username and email searches work, case-insensitive. |
| ENR-04 | PASS | | Enrolling `qa_student_c` showed "QA Student C enrolled in QA Biology"; the student got paid access and a "Course access granted" notification. |
| ENR-05 | PASS | | The student left the list. |
| ENR-06 | PASS | | Switching course reloads the list; the search text stays in the box. |
| ENR-07 | PASS | | `GET /courses/me` as the student returned QA-103. |
| ENR-08 | FAIL | ISS-013 | The Enrollments screen has no unenroll control. The API works (ENR-10). D-12 confirmed. |
| ENR-09 | FAIL | ISS-013 | Students with a pending proof (`qa_student_b` in QA-103) do not appear in the Enrollments list, with no indication. D-12 confirmed. |
| ENR-10 | PASS | | `POST /admin/courses/unenroll` 200; the student's `/courses/me` was empty straight after. The enrollment row is deleted, including any proof. |
| ENR-11 | PASS | | 400 "User already enrolled in this course". |
| ENR-12 | PASS | | 404 "User not found" and 404 "Course not found". |
| ENR-13 | PASS | | `qa_dup_new3` (blank name) enrolled with no crash; the row shows the username. |
| ENR-14 | SKIP | | WhatsApp ignored per the owner; email not configured. |
| PAY-01 | PASS | | Course list and a select prompt. |
| PAY-02 | PASS | | Selected QA-101 lists enrollments with Paid or Unpaid buttons. |
| PAY-04 | PASS | | "View payment proof" fetched all five types from `/uploads/payments/…?mode=view` (PDF, JPG, PNG, WebP and the symbols-named PDF) with auth; each call opened a window. I did not look at the rendered new tab. Direct URLs without a token return 401. |
| PAY-05 | PASS | | Unpaid to Paid for `qa_student_c` in QA-101: the button turned green and the student got access. |
| PAY-06 | PASS | | "Enrollment confirmed" notification arrived. WhatsApp not checked. |
| PAY-07 | PASS | | After Paid to Unpaid the student lost access (`/courses/me` empty, `/homeworks/course/5` 403). On the course card the student goes back to "Pending review" with no notification (see PAY-09). |
| PAY-08 | FAIL | ISS-013 | There is no reject or "ask for a new proof" action. D-11 confirmed. |
| PAY-09 | FAIL | ISS-013 | After a reversal the student sees "Pending review" again and gets no notification, so they are not told what happened. |
| PAY-10 | FAIL | ISS-015 | Paid, Unpaid, Paid created a second "Enrollment confirmed" notification, and the code sends the welcome email and WhatsApp on every Unpaid-to-Paid change. Not confirmed on a real phone. |
| PAY-11 | PASS | | Unpaid shows amber and Paid green, and the proof link appears only where a proof exists. There is no filter, sort or count for items needing review, and an admin-added unpaid student looks the same. |
| PAY-12 | PASS | | A course with no enrollments shows "No enrolled students found". (I unenrolled `admin_test` from QA-106 for this, then enrolled them again.) |
| PAY-13 | PASS | | The course list stays visible while students load. |
| PAY-14 | PASS | | Simulated a failed request (the backend was not stopped): the button stayed Unpaid and an error banner showed ("Not Found" from my simulated failure). |
| ROL-01 | PASS | | User list with current roles and a working search. |
| ROL-02 | PASS | | `qa_val_1` made TA with QA-104: user is TA and enrolled. |
| ROL-03 | PASS | | `qa_val_1` TA to Admin with QA-105: `is_admin` true, `is_ta` false, enrolled. A "User already enrolled" banner from the earlier attempt was still showing; it may be stale. |
| ROL-04 | PASS | | Checked by API: a token issued before the change shows the new role on the next `/auth/me`, no re-login. I did not look at the TA workspace in the browser afterwards. |
| ROL-05 | FAIL | ISS-016 | Assigning TA with a course the user is already in (`qa_signup_1`, QA-101) shows "User already enrolled in this course", but the role had changed to TA. D-34 confirmed. The role also gave the user course access while the payment was still Unpaid. |
| ROL-06 | PASS | | `qa_signup_1` assigned a second course (QA-102); `/courses/me` returned QA-101 and QA-102. |
| ROL-07 | FAIL | ISS-016 | The screen only offers Admin and TA; there is no Student option. `PATCH /users/{id}/role` with both flags false works, which is how I restored the test users. |
| ROL-08 | SKIP | | Not run. It needs a spare admin and SQL access to undo, and the plan says to be ready to fix with SQL. |
| ROL-09 | PASS | | Assign stays disabled until both a role and a course are chosen. |
| ROL-10 | PASS | | Mark as paid on `user_test` set `payment` true and gave no course access (`/courses/me` empty). The label does not say what it does. Restored to false. |
| ROL-11 | PASS | | Users with a blank full name show their username; no crash. |
| ROL-12 | FAIL | ISS-016 | No way in the UI to remove a TA from a course. |
| PAY-03 | not run | | Payments search not run. |
| LCC-01 | PASS | | UI form created "QA Class UI" (QA-101, 120 min, +7 days) with "Success", Join Class and Share on WhatsApp buttons. |
| LCC-02 | PASS | | API: 422 "Class start time must be in the future". |
| LCC-03 | PASS | | All four fields are `required`. |
| LCC-04 | PASS | | Duration has min 15 and max 480; 14 and 481 fail the browser's check. API also rejects 481 and 0. |
| LCC-05 | FAIL | ISS-018 | The API schema only requires more than 0, so a duration of 1 to 14 is accepted by the server but blocked by the form. Not sent, to avoid creating a Zoom meeting; read from `schemas/live_classes.py`. |
| LCC-06 | FAIL | ISS-017 | "Join Class" right after creation navigates the same tab to `/meeting/{id}` and shows "Failed to load the meeting. You may close this tab." Cause as admin: the class is in the future ("Class has not started yet"), or 403 "You are not enrolled in this course" for an admin who is not enrolled in the course (`admin_test` was not until I enrolled it). D-21 confirmed. |
| LCC-07 | SKIP | | WhatsApp not tested, per the owner. |
| LCC-08, LCC-09 | not run | | Admin quick-access banner not checked. |
| LCC-10 | PASS | | Entered 13:08 in a UTC+5 browser; stored as 08:08Z; students see 13:08. |
| LCC-11 | PASS | | Paid students got "Class scheduled" with `href=/schedule`; unpaid `qa_signup_2` got none. |
| LCC-12 | SKIP | | WhatsApp ignored. |
| LCC-13 | BLOCKED | | The class record has the right 120-minute window; the Zoom meeting's own duration was not inspected (needs Zoom). |
| LCC-14 | BLOCKED | | Needs bad Zoom credentials on a test environment. |
| LCC-15 | FAIL | ISS-018 | Two quick clicks on Create Live Class created two classes (ids 35 and 36), two Zoom meetings and two notifications. |
| SCH-01 | PASS | | Student A's schedule lists QA-101 classes only. |
| SCH-02 | PASS | | Today shows only the live class; Week and Month add the upcoming ones. |
| SCH-03 | PASS | | "Happening now" with "Join live lecture"; the button opens `/meeting/34` in a new tab. |
| SCH-04 | PASS | | Upcoming classes show time and date with no join button. |
| SCH-05 | PASS | | Course filter exists; Student A has only one course, so narrowing was not really exercised. |
| SCH-06 | not run | | Empty view not checked. |
| SCH-07 | PASS | | By API (`/live-classes/me`): `qa_student_b` gets none. |
| SCH-08 | PASS | | By API: pending `qa_signup_2` gets none. |
| SCH-09 | FAIL | ISS-017 | An admin only gets classes from courses they are enrolled in (API `/live-classes/me` for `admin_test` returned QA-101 classes only after I enrolled it, and nothing before). The plan expects all classes. |
| SCH-10 | PASS | | By API: `qa_ta` gets QA-101 classes. Course names on the TA's page were not checked. |
| SCH-11 to SCH-13 | not run | | Not run. |
| SCH-14 | FAIL | ISS-014 | "Report a schedule issue" links to `/messages`, which is unusable outside a live class. |
| PCL-01 | PASS | | Past Classes lists two, newest first, with "No material posted" and "View all past classes (2)". |
| PCL-02, PCL-04, PCL-06 to PCL-11, PCL-13, PCL-15, PCL-17 | not run | | The upload modal and `/schedule/past` were not exercised in the browser. |
| PCL-03 | PASS | | By API only: a PDF uploads to `/live-classes/32/attachment`. |
| PCL-05 | PASS | | By API: a paid student gets 200 for the file (content type `application/octet-stream`). |
| PCL-12 | FAIL | ISS-019 | By API: `.txt`, `.exe`, `.html` and a 51 MB file were all accepted. The server has no type or size check. The UI's own check was not tried. |
| PCL-14 | PASS | | By API: a student's upload returns 403. The page was not checked for upload controls. |
| PCL-16 | PASS | | By API: unenrolled `qa_student_b` gets 403 for the attachment and no token gets 401. |
| MTG-01 | FAIL | ISS-020 | `/meeting/34` as Student A shows a black page. The console has "Zoom Error: TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')" from the Zoom SDK bundle. No "Preparing your classroom" text. The session was claimed and released by the page. |
| MTG-02, MTG-03, MTG-08, MTG-14, MTG-15, MTG-17, MTG-19 | BLOCKED | ISS-020 | The Zoom client never starts in this environment, so nothing past the API can be tried. |
| MTG-04 | FAIL | ISS-017 | The API says "Class has not started yet", but the page shows only "Failed to load the meeting. You may close this tab." |
| MTG-05 | FAIL | ISS-017 | Student B gets 403 "You are not enrolled in this course" from the API, but the page shows the same generic message. |
| MTG-06 | PASS | | By API: a second device id gets 409 "This account is already active on another device." |
| MTG-07 | PASS | | By API: after leaving the page, the second device was still blocked at about 20 seconds and allowed at about 29 seconds. |
| MTG-09 | FAIL | ISS-017 | Ended class: API says "Class has ended"; the page shows the generic message. |
| MTG-10 | FAIL | ISS-017 | By code: a logged-out visitor is sent to `/login` with no return address, so they don't come back to the meeting. Not run in the browser. |
| MTG-11 | FAIL | ISS-017 | `/meeting/abc` and `/meeting/999999` use the same generic message (checked `/meeting/33` and `/meeting/36` in the browser, the others by code). |
| MTG-12 | FAIL | ISS-017 | Close Tab calls `window.close()`, which does nothing in a tab the script did not open (Join Class opens the meeting in the same tab). By code. |
| MTG-13 | PASS | | By code: the name sent to Zoom is `full_name or username`. Not run with a live meeting. |
| MTG-16, MTG-18 | BLOCKED | ISS-020 | No Zoom page to watch. The SDK error above is on the page. |
| MCQ-01, MCQ-06, MCQ-09 | BLOCKED | ISS-020 | The MCQ panel lives on the meeting page, which doesn't render. I tested the socket protocol instead (below). |
| MCQ-02 | PASS | | By socket: admin publish reaches all; admin gets counts 0,0,0,0. |
| MCQ-03 | PASS | | By socket: no question, or fewer than 2 options, or a blank option is not published. The server says nothing back, so the admin isn't told why. |
| MCQ-04 | FAIL | ISS-021 | A question with one blank option in the middle is dropped entirely (the server rejects any blank option); the plan expects the blank to be skipped. The browser panel may filter blanks first; not checked. |
| MCQ-05 | PASS | | Students receive the question without a reload. |
| MCQ-07 | PASS | | Answer returns an acknowledgement with `is_correct` and the correct option. |
| MCQ-08 | PASS | | Admin counts update per answer (0,0,1,0 then 0,1,1,0); students get no counts. |
| MCQ-10 | PASS | | A reconnecting student gets the question again with `user_answer` set. Feedback does not come back (only the answer). |
| MCQ-11 | PASS | | A student joining later gets the question. |
| MCQ-12 | PASS | | End sends the correct option and counts to everyone. |
| MCQ-13 | PASS | | A student's `question_publish` and `question_end` are ignored. |
| MCQ-14 | PASS | | A second answer is ignored; the acknowledgement repeats the first. |
| MCQ-16 | FAIL | ISS-022 | Redis went down mid-session. For class 34, sockets stayed open and acknowledgements still worked, but broadcasts to everyone else never arrived again (publish, counts, end), with no message to anyone, even after Redis came back. A fresh class worked. |
| MCQ-17 | PASS | | A new question replaced the active one for everyone. |
| MCQ-15 | not run | | Not run. |
| CHT-01 | PASS | | Student B at `/messages`: "No live classes right now". |
| CHT-02 | FAIL | ISS-014 | A student has no way to message anyone outside a live class. |
| CHT-03 to CHT-20 | BLOCKED | ISS-001 | Chat cannot be tested: every chat history request crashes for anyone with access (see ISS-001), and messages sent over the socket were never delivered, even to the admin. |
| CHT-13 | FAIL | ISS-021 | By code: any chat text that is JSON with an `action` of `question_end` (or the other actions) is handled as a command and never saved as chat. |
| CHT-08 | FAIL | ISS-021 | By code: a second message within a second is silently dropped with no error. |
| CHT-21 | PASS | | Student B gets 403 "You do not have access to this class". |
| CHT-22 | PASS | | The socket for Student B on a live class was accepted, then closed with 1008 right away. A student on a class outside its window was not checked. |
| HWC-01 | PASS | | Created by API (the same call the form makes): appears in the admin list and in students' `/homeworks/overview`. The admin form itself was not driven. |
| HWC-02 | not run | | Form message not checked (see HWC-13). |
| HWC-03 | not run | | Image preview not checked. |
| HWC-04 | PASS | | API image upload: `.txt` and `.gif` give 400 "Only JPEG and PNG images are allowed"; an 11 MB PNG gives 413 "File size exceeds 10MB limit". |
| HWC-05 | PASS | | API: 0, -5 and blank all give 422, with raw validator text ("Input should be greater than 0"). How the form words it was not checked. |
| HWC-06 | PASS | | 12.5 accepted (`QA HW Decimal`); shown on the student's list. Display of the maximum was not checked. |
| HWC-07 to HWC-09, HWC-11 | not run | | Form behaviour not driven. |
| HWC-10 | PASS | | The admin list is grouped by course; overdue items carry an "Overdue" label; times show in local time. |
| HWC-12 | PASS | | Recorded: the list has only Create Homework and View Submissions; there is no edit or delete. |
| HWC-13 | FAIL | ISS-024 | The API accepted a due date one day in the past (`QA HW PastDue`, id 6). |
| HWC-14 | PASS | | `qa_ta` created `QA HW ByTA` (id 8) in QA-101 by API; a TA is refused for QA-102 (403). |
| HWC-15 | PASS | | Homework in QA-104 (no students) created with no error (`QA HW EmptyCourse`, id 9). |
| HWS-01 | PASS | | Student A's page lists QA-101 items only (counts 0 overdue, 2 upcoming after my submissions); `QA HW Other` is not shown. |
| HWS-02 | PASS | | Details shows the instructions. The question image on `QA HW Open` was not looked at. |
| HWS-03 | PASS | | `?tab=graded` selects the Graded tab; Submitted and Graded tabs show the right items. |
| HWS-04 | not run | | Course filter, sort and search not exercised. |
| HWS-05, HWS-06, HWS-10, HWS-14, HWS-15, HWS-21, HWS-22 | not run | | Need the browser's file picker or real clicks through the modal. Submitting by API works (HWS-13). |
| HWS-07 | FAIL | ISS-025 | Submitting to an overdue homework succeeded (HW Overdue and HW PastDue) and the page shows plain "SUBMITTED"; nothing marks it late. |
| HWS-08 | FAIL | ISS-025 | The API accepted `tool.exe` as a submission. |
| HWS-09 | FAIL | ISS-025 | The API accepted an 11 MB PDF. |
| HWS-11 | PASS | | Graded tab shows "90/100" with "Feedback: final" and View result. |
| HWS-12 | not run | | The API gives the solution (200) after submitting and refuses it before (403, "You must submit the homework before viewing the solution"); the page link was not found because I had removed the solution. |
| HWS-13 | PASS | | 409 "You have already submitted this assignment". |
| HWS-16 | PASS | | A PDF named `spaces & symbols (1).pdf` submitted (stored as `spaces  symbols 1_….pdf`). The grader opening it was not checked. |
| HWS-17 | PASS | | `/homework/3/grades` shows "QA HW Open - Your Grade", 90 points, feedback and a download link. |
| HWS-18 | FAIL | ISS-025 | `/homework/999999/grades` reads "null - Your Grade" with "You have not submitted this homework yet." D-50 confirmed. |
| HWS-19 | PASS | | Due times shown in local time (13:37 for 08:37Z). |
| HWS-20 | PASS | | Student B's overview is empty with no error. |
| HWG-01 | PASS | | The View Submissions modal shows totals (Total Submissions, Graded), a Solution File section and the submissions. Checked on an existing homework, read-only. |
| HWG-02 | FAIL | ISS-025 | Submissions are listed as "Student #6", no name or email; the API returns only `user_id`. D-30 confirmed. |
| HWG-03, HWG-04, HWG-13 to HWG-15 | not run | | Not exercised in the modal. |
| HWG-05 | PASS | | By API: grade saved, status Graded, the student got an "Assignment graded" notification linking to `/results`. The Save Grade button was not clicked. |
| HWG-06 | PASS | | API: score over the maximum gives 422 "Score must be between 0 and 100.0". |
| HWG-07 | PASS | | API: negative gives the same 422. |
| HWG-08 | PASS | | A score of 0 saves as graded with 0. |
| HWG-09 | FAIL | ISS-025 | A remark with no score leaves the submission "submitted" but still sends the student an "Assignment graded" notification. |
| HWG-10 | PASS | | Updating works and the student sees the latest. Clearing the score returns the submission to "submitted" and keeps the remark. Each save sends another "graded" notification. |
| HWG-11 | PASS | | API: a solution PDF uploaded and a student who submitted could fetch it. The View and Remove buttons were not checked. |
| HWG-12 | PASS | | Delete removes it; students then get 404. |
| HWG-16 | FAIL | ISS-025 | `/homework-submissions/1/grade` as admin is a completely blank page. D-25 confirmed. |
| HWG-17 | FAIL | ISS-025 | The same URL as a student is also blank, with no permission message. |
| HWG-18 | FAIL | ISS-019 | The API accepted a `.exe` solution; no type limit. D-41 confirmed. |
| QZC-01 | PASS | | The Phase 1 quizzes (ids 6 to 11) were created by API with the form's call; students see them. The admin form itself was not driven. |
| QZC-02, QZC-05 to QZC-09, QZC-12, QZC-14 to QZC-19 | not run | | Quiz creation form interactions, image handling, double-click and edit/delete checks not run. |
| QZC-03 | FAIL | ISS-026 | The server accepted a quiz with a blank option, and one with no correct option. D-28. The form's own checks were not tried. |
| QZC-04 | FAIL | ISS-026 | Total marks 50 with one 5-mark question was accepted. |
| QZC-10 | PASS | | API: total marks 0 gives 422, duration 0 and 481 give 422, with raw validator text. |
| QZC-11 | FAIL | ISS-026 | A deadline in the past was accepted. |
| QZC-13 | FAIL | ISS-026 | A question with two correct options was accepted (students pick one). Also accepted: one option only, no questions, negative marks. |
| QZL-01 | PASS | | Student A's quizzes are QA-101 only, with marks, duration and deadline in the data. |
| QZL-05 | PASS | | By API: the passed-deadline quiz is "closed" when late is off, and "available" when late is on. |
| QZL-10 | PASS | | Student B: no quizzes, no error. |
| QZL-11 | PASS | | By API: a score of 0 shows as graded with score 0. |
| QZL-02 to QZL-04, QZL-06 to QZL-09 | not run | | List page filters and links not run. |
| QZT-01 | PASS | | Rules screen shows the title, total marks, question count and the proctoring terms. It does not show the duration. |
| QZT-02 | PASS | | Start puts the page in fullscreen with a status bar (tab switches 0/2, fullscreen exits 0/2) and the questions. |
| QZT-03 | FAIL | ISS-027 | No countdown or time limit is shown anywhere in the quiz. D-16 confirmed. |
| QZT-04 | FAIL | ISS-027 | The 30-minute duration is not enforced: the server has no duration check and the page has no timer. Not waited out. |
| QZT-05 | PASS | | Choosing an option updates "1/1 answered". |
| QZT-09 | PASS | | The question image loads (1536 px wide) and a Download button is shown. I did not open the viewer or click Download. |
| QZT-10 | PASS | | "Quiz submitted successfully" shows right after Submit. |
| QZT-11 | PASS | | After submit the page left fullscreen, showed the success message for about 5 seconds, then went to `/quizzes`. No violation warning or error. |
| QZT-12 | PASS | | One fullscreen exit, then Return to Fullscreen, then a normal submit: one POST, no auto-submit overlay. |
| QZT-13 | PASS | | Two quick clicks on Submit sent one POST. |
| QZT-14 | FAIL | ISS-027 | Opening a quiz already submitted (`qa_student_e`, quiz 9) shows the rules screen as if it were new. The API then refuses with 400 "You have already submitted this quiz." |
| QZT-15 | FAIL | ISS-027 | A closed quiz: the API says "Quiz not published yet or deadline has passed", the page shows "Failed to load quiz". |
| QZT-16 | FAIL | ISS-027 | A quiz that allows late work cannot be opened after the deadline (403 on `GET /quizzes/11`), although a direct submission is accepted and marked late. D-07 confirmed. |
| QZT-20 | FAIL | ISS-027 | A student without paid access (`qa_student_c` while pending) sees "Failed to load quiz", not a no-access message. |
| QZT-28 | PASS | | `GET /quizzes/{id}` has no `is_correct` or answer data. |
| QZT-06 to QZT-08, QZT-17 to QZT-19, QZT-21 to QZT-27 | not run | | Not run: needs file pickers, long waits, navigation prompts or other roles. |
| QZP-01 | PASS | | Simulated by dispatching `visibilitychange` (a real tab switch was not tried): "Warning: Tab switching detected (1/2)" and the counter updates. |
| QZP-02 | PASS | | The second switch shows "Auto-Submitting Quiz". |
| QZP-03 | PASS | | The auto-submit POST contained both chosen answers, `tab_switches: 2`, `auto_submitted: true`. D-02 not reproduced. |
| QZP-04 | PASS | | Admin sees the submission with both answers, tab switches 2, auto-submitted and flagged. |
| QZP-05 | PASS | | Exiting fullscreen shows "Warning: You exited fullscreen (1/2)…" and "Click to Return to Fullscreen". |
| QZP-06 | PASS | | Clicking it resumed fullscreen. |
| QZP-08 | PASS | | The rules say 2 times; auto-submit fires on the second tab switch, as stated. The server's flag rule differs (more than 2 tab switches or more than 1 fullscreen exit, or auto-submitted). |
| QZP-09 | FAIL | ISS-027 | Copy, paste and right-click are blocked, but with no warning shown; cut is not blocked. |
| QZP-10 | FAIL | ISS-027 | Refreshing during a quiz returns to the rules screen; the counters start from 0 and chosen answers are gone. D-46 confirmed. |
| QZP-19 | PASS | | Recorded: the counters and the auto-submit flag come from the browser; the server stores whatever is sent. |
| QZP-07, QZP-11 to QZP-18, QZP-20 | not run | | Not run. |
| RES-01 | PASS | | API: `qa_student_a` average 45% (quiz 0/10 = 0%, homework 90/100 = 90%), letter F, 2 graded items. The average is the unweighted mean of the two percentages. |
| RES-02 | PASS | | `qa_student_b` (no enrollments): empty results, "—", no items. |
| RES-03 | PASS | | Admin and TA `/results/me` return 200; admin lists every course (including the blank-name one), TA lists QA-101 with no items. |
| RES-01, RES-02 (UI) | PASS | | `/results` as `qa_student_a`: ring "F 45%", "Based on 2 graded items", standing "Not provided", Recent Results lists quiz 0/10 (0%) and homework 90/100 (90%), matching the grades. |
| RES-05 | PASS | | The ring shows 45% and is about 45% filled. |
| RES-08 | PASS | | Clicking the quiz result opens `/quiz/7/grades` (shows 0 / 10, "Flagged for Review"); clicking the homework result opens `/homework?tab=graded`. |
| RES-04, RES-06, RES-07 | not run | | Letter boundaries, a trend of one item or over eight, and the course filter were not run (only one course has results). |
| NTF-11 | PASS | | `qa_student_b` has 0 notifications. |
| NTF-13 | PASS | | Marking another user's notification read gives 404. |
| NTF-14 | PASS | | Recorded: `admin_test` got 23 unread notifications for its own actions ("New quiz available" etc.). Admins are notified of what they create. |
| NTF-15 | PASS | | `qa_student_a` had 25 unread; the list returns 20. Mark all read updated 24 and the count went to 0. |
| NTF-07 | PASS | | Clicking a "Quiz graded" notification in the bell goes to `/results`. |
| NTF-08 | PASS | | With everything read, the panel says "You are all caught up" and "Mark all read" is greyed out. The badge showed "9+" while there were unread ones. |
| NTF-10 | FAIL | ISS-015 | `qa_student_a` has five identical "Assignment graded" notifications for the same homework (it was graded repeatedly). Each re-grade adds one. |
| NTF-12, NTF-16 | not run | | Not run. |
| TAP-05 | PASS | | `qa_ta` gets 403 on QA-102 homework submissions and QA-104 quiz submissions. |
| TAP-06 | PASS | | Grading a QA-102 submission as `qa_ta` gives 403. |
| TAP-07 | PASS | | Solution upload and remove in QA-101 work for the TA. |
| TAP-08 | PASS | | Solution upload in QA-102 gives 403. |
| TAP-14 | PASS | | TA gets 403 on create course, role change, users list, enroll and admin enrollments. |
| TAP-15 | PASS | | `/ta/pending-quiz-submissions` and `/ta/pending-homework-submissions` return 200, scoped to QA-101. A student gets 403 "Only TAs can access this endpoint". |
| TAP-16 | PASS | | `/ta/quiz-submissions/{id}/grade?score=5&remarks=ok` works. A JSON body without the query returns 422. |
| TAP-01 | PASS | | `qa_ta` lands on "Grading Workspace" with Quiz submissions and Homework submissions tabs. |
| TAP-09 | PASS | | UI: the quiz list shows only QA-101 quizzes (six), the homework list only QA-101 homework (ByTA, Decimal, Open, Overdue, PastDue); QA-102's homework 4 and the other courses' work are absent. |
| TAP-10 | PASS | | Opening a quiz shows counts (Total 2, Graded 0, Pending 2, Flagged 0), a Solution File card, and each student's name, email and time. View Answers opens a modal with each answer; a file answer has View and Download buttons. |
| TAP-11 | PASS | | Score above the maximum: "Score cannot exceed 10" and nothing is saved. The Grade button is disabled until a score is typed. |
| TAP-12, TAP-13 | not run | | Saving a TA grade and the homework grading modal were not driven in the UI (the API grade call is covered by TAP-16). |
| TAP-17 | FAIL | ISS-028 | Student E's answers on "QA Quiz Normal" show questions from another quiz ("QA image question") and a file called `qa_hw_A.pdf`, which is another student's homework upload. The TA sees it as if valid (follows from SEC-10/SEC-11). |
| AUZ-02, AUZ-03 | PASS | | `qa_student_b` opening `/ta` is redirected to `/dashboard`; no admin or TA panel is shown. |
| AUZ-01 | PASS | | Logged-out `/dashboard` redirects to `/login`. Other routes were not individually checked. |
| AUZ-10 to AUZ-31 | PASS | | Every admin API route returns 403 as a student (`qa_student_b`) and 401 with no token. |
| AUZ-40 to AUZ-45, AUZ-47 | PASS | | Cross-course reads and writes return 403 or 404 as expected, including a class outside QA-101 for the TA. AUZ-46 not run. |
| SEC-01 | PASS | | Rerun with encoded paths (`..%5C.env`, `..%2f.env`): 401 logged out, 404 logged in. |
| SEC-06 | FAIL | ISS-023 | `/homeworks/course/5` shows `solution_url` to a paid student who has not submitted. D-23 confirmed. |
| SEC-07 | PASS | | No `is_correct` in any quiz payload for students. |
| SEC-08 | FAIL | ISS-019 | Any logged-in user, including one not enrolled, can upload `page.html` to `/uploads/homeworks`. Files are served as attachments with `nosniff`, so the rendering risk is limited. |
| SEC-09 | FAIL | ISS-019 | `/uploads/quiz-answer` accepted a 51 MB file from a non-enrolled user. No size limit. |
| SEC-10, SEC-11 | FAIL | ISS-028 | Quiz submission accepted question and option ids from another quiz, and an `uploaded_file_url` pointing at another student's homework file. |
| SEC-14 | FAIL | ISS-029 | `/docs` and `/openapi.json` are public. |
| SEC-15 | PASS | | A preflight from `https://evil.example` is rejected (400). |
| SEC-16 | FAIL | ISS-029 | The CORS allow list contains two unrelated `vercel.app` origins (`meramusafir`, `mera-musafir-web`); the first was echoed back as allowed. |
| SEC-19 | PASS | | Login returns only an access token, no refresh token, so there is nothing to store. This corrects the refresh-token claim in ISS-011. |
| SEC-21 | FAIL | ISS-011 | An old access token still works after a password change and after changing it back (D-42). |
| SEC-03 | PASS | | Both payment proofs (`.png`, `.pdf`) return 401 with no token, 403 to students (B, A, D), 200 to admin. |
| SEC-04 | PASS | | Homework submission file, homework image and quiz question image: 401 logged out; 403 to a non-enrolled student (B); a different enrolled student (D) gets 403 on another student's submission but 200 on the course's homework and quiz images; the owner and admin get 200. Solution files, class material and quiz answer files were not fetched in this pass. ISS-023 is corrected below. |
| SEC-12 | PASS | | A homework titled with `<img onerror>` and `<script>` tags and a quiz with a script tag in the question, viewed as a student on `/homework`, `/quizzes`, `/quiz/20`, `/dashboard` and `/schedule`: shown as text, no script ran, no injected image or script element. |
| SEC-13 | PASS | | `' OR 1=1 --` as a homework description and `' OR 1=1 -- ; DROP TABLE users;--` in a quiz title are stored and shown as text with no error; logins still work afterwards. |
| SEC-17 | PASS | | Recorded: the chat WebSocket takes the token in the URL (`?token=`), so it can appear in server and proxy logs. Needs an owner decision. |
| SEC-18 | PASS | | Recorded: the access token is stored in `localStorage` (the only app key), so any XSS could read it. Known exposure. |
| SEC-20 | FAIL | ISS-036 | `/test-image-feature` returns 200 with no login (D-44). |
| SEC-22 | FAIL | ISS-036 | Local response headers only (Railway not checked): the API sends none of HSTS, CSP, X-Frame-Options, nosniff; the frontend sends only the two cross-origin policy headers. |
| SEC-23, SEC-24 | PASS | | Uploaded files are served as `application/octet-stream`; the files open or download for those allowed. `page.html` is not rendered. Not every file type clicked in the UI. |
| SEC-25 | PASS | | Quiz question images and homework images display for enrolled students (QZT-09, HWS-02). |
| SEC-26 | PASS | | An `.html` submission is served as a binary download, so it doesn't render or run. |
| AUZ-04 | PASS | | As a student, setting `is_admin`, `isAdmin`, `is_ta`, `user` and `role` in localStorage and reloading `/dashboard` still shows the student dashboard. |
| AUZ-05 | FAIL | ISS-025 | A student opening `/homework-submissions/1/grade` gets a blank page, not a permission message. |
| SEC-05 | not run | | Owner question: confirm `SECRET_KEY` is set on Railway. Cannot be checked from here. |
| PRF-04, PRF-06 | PASS | | API returns 422 for bad email and blank name. |
| PRF-05 | PASS | | Duplicate email: 409 "Email address is already in use". |
| PRF-07 | FAIL | ISS-030 | 422 text is "Value error, Phone number must include a country code…" with the raw "Value error," prefix. |
| PRF-08 | FAIL | ISS-030 | 422 "Value error, Date of birth must be in the past", raw prefix. |
| PRF-09 | FAIL | ISS-030 | Too-short value returns the raw `string_too_short` message. |
| PRF-11 | FAIL | ISS-030 | A 501-character address was accepted (restored afterwards). |
| PRF-13 | PASS | | Password change works (`qa_student_d`, restored to the original afterwards). |
| PRF-14 | PASS | | Old password then gives 401, new one 200. |
| PRF-15 | PASS | | Wrong current password: "Current password is incorrect". |
| PRF-17 | PASS | | "New password must be different". |
| PRF-18 | PASS | | Under 8 characters gives 422. |
| PRF-20 | FAIL | ISS-011 | Same as SEC-21: the old token keeps working. |
| PRF-22 | PASS | | `is_admin`, `is_ta`, payment flag, `student_id`, `major` and `academic_standing` in a profile update are ignored. |
| PRF-21 | not run | | The `qa_ph1` password is unknown, so its login returns 401. |
| JAZ-01 | SKIP | ISS-031 | No JazzCash button or frontend reference exists (D-24). Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-02 | SKIP | ISS-031 | The initiate response includes a `pp_Password` field (value not recorded). Sandbox host `sandbox.jazzcash.com.pk`, 12 payload keys. Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-03 | SKIP | ISS-031 | A second initiate gives 409 "A payment is already pending for this course", and a pending payment never expires, so the student is locked out. Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-04 | SKIP |  | An enrolled student gets 409. Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-05 | SKIP |  | Unknown course: 404. Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-06 | SKIP |  | Callback with no hash or a wrong hash returns 400. Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-09 | SKIP | ISS-031 | Amount is hard-coded to 200000 paisa (PKR 2,000) for every course (code read). Out of scope: JazzCash is a future improvement, per the owner. |
| JAZ-07, JAZ-08, JAZ-10 | SKIP |  | Need the sandbox or a valid hash. Out of scope: JazzCash is a future improvement, per the owner. |

**Phase 11 method note:** the browser window cannot be resized (the page viewport stays 2133 px), so mobile checks used a 390 x 844 iframe of the same pages, which applies the real mobile CSS breakpoints. Touch, fullscreen, file pickers and real devices were not tested.

| ID | Status | Issue | Notes |
|---|---|---|---|
| MOB-01 | FAIL | ISS-032 | At 390 px the landing page is 396 px wide against a 371 px viewport (decorative elements, the hero image at `right-[-25px]` and the review marquee extend past the edge). `/about`, `/our-teachers`, `/contact` and `/signup` fit. |
| MOB-02 | PASS | | `/login` and `/signup` fit at 390 px (no overflow). A short screen was not tried. |
| MOB-03 | PASS | | Hamburger opens the sidebar with all links (Dashboard, Courses, Assignments, Quizzes, Results, Messages, Schedule, Settings, Help); following Courses navigates and closes it. Close via X and overlay not separately tried (two "Close navigation" buttons exist). |
| MOB-04 | PASS | | Search is hidden at 390 px, as the plan expects. Pages that rely on it have no alternative. |
| MOB-08 | PASS | | Admin dashboard, courses, homework, quizzes and messages show no horizontal overflow at 390 px. Forms and modals not individually opened. |
| MOB-09 | PASS | | `/messages` has no overflow at 390 px; the list and chat usability were not fully exercised. |
| MOB-10 | FAIL | ISS-032 | The notification panel starts 40 px left of the screen edge at 390 px (left −40, right 324), so its left side is cut off. |
| MOB-14 | PASS | | Schedule has one element wider than the screen (a `select` filter); other pages fit. Treated as minor. |
| MOB-05, MOB-06, MOB-07, MOB-11, MOB-12, MOB-13 | BLOCKED | | Need real touch, file pickers, fullscreen and rotation on a device. Not possible from this browser. |

| ERR-10 | PASS | | Clearing localStorage while on `/courses` and then clicking a link sends the user to `/login`. |
| NAV-01, NAV-02 | PASS | | Each sidebar item opens its page and is highlighted; `/schedule/past` keeps Schedule highlighted and `/profile` highlights Settings. (Rerun; checked by computed style in an iframe.) |
| NAV-03, NAV-04, NAV-06, NAV-08 | PASS | | Links: logo to `/`, "Academic Portal" to `/dashboard`, Settings to `/profile`, header Messages icon to `/messages`. Link targets read from the page, not clicked one by one. |
| NAV-05 | PASS | ISS-035 | "New Request" is a link to `/messages` (it opens the chat, with no request form). Matches D-13: it doesn't start a typed request. |
| NAV-07 | PASS | | Help links to `/contact` (public page). The way back from there was not checked. |
| NAV-09 | PASS | | The avatar menu shows the name and email, with Profile, Settings and Sign out. |
| NAV-10 | FAIL | ISS-035 | Clicking on the page body outside the avatar menu and the notifications panel closes neither. Escape closes the panel. |
| NAV-11 | FAIL | ISS-035 | The avatar menu and notifications panel can be open together and overlap. |
| NAV-12 | PASS | | Searching `quiz`, `assignment`, `schedule`, `message`, `profile` goes to `/quizzes`, `/homework`, `/schedule`, `/messages`, `/profile`. |
| NAV-13 | PASS | | `QA Physics` goes to `/courses?search=QA%20Physics` and the course is listed. |
| NAV-14 | FAIL | ISS-035 | `QA Chemistry` (available, not enrolled) goes to `/courses?search=QA%20Chemistry` on the Enrolled tab and shows "No courses found", although Available has 10 courses. D-26 confirmed. |
| NAV-15 | FAIL | ISS-035 | A single letter `a` redirects to `/courses` with no filter. |
| NAV-16 | PASS | | Empty search stays on `/dashboard`. |
| NAV-17 | PASS | | Typing in the header search filters `/courses`, `/homework`, `/quizzes` and `/schedule/past` as you type (content shrank for a nonsense term on each). |
| NAV-18 | FAIL | ISS-035 | Admin and TA see the identical student sidebar (Results, Courses, Assignments...). Results for an admin lists every course, including the blank-name one, with nothing to grade or review. |
| DSH-01 | PASS | | "Good afternoon, QA." in the afternoon, using the first word of the full name. Morning and evening not tried. |
| DSH-02 | PASS | | Student A: QA Physics, QA-101, progress 0%. |
| DSH-03 | PASS | | Student B: "No active courses yet" with Browse available courses linking to `/courses`; Upcoming "Nothing upcoming right now". |
| DSH-04 | not run | | `qa_student_c` was approved earlier, so it is no longer pending; no pending-only account was checked. |
| DSH-05 | PASS | | Student ID "Not assigned", major and current year "Not provided", email correct; View profile goes to `/profile`. D-51: the standing is "Not provided". |
| DSH-06 | PASS | | Upcoming shows four items in date order, "Today, 13:10" and "Today, 13:34" for classes and "8 Nov" for later ones. "Tomorrow" not seen. |
| DSH-07 | FAIL | ISS-035 | `QA HW Open`, already submitted and graded by `qa_student_a`, still appears in Upcoming for student C and A's list; the card says "Due". Submitted work isn't removed. (Student C's own view was checked; A's own submission is graded.) |
| DSH-08 | PASS | | Quick Links go to `/schedule`, `/homework`, `/quizzes`, `/messages`. |
| DSH-09 | not run | | No quiz with a deadline appears in Upcoming, but only four items fit so this is inconclusive. |
| DSH-10 | PASS | | The course card links to `/courses`. |
| DSH-12 | FAIL | ISS-035 | `qa_student_a` has a graded quiz and a graded homework, and progress is still 0% on the dashboard and profile. D-39 confirmed. |
| DSH-11, DSH-13 | not run | | A whitespace-only name and a blocked catalog request were not tried. |
| PRF-01 | PASS | | `/profile` shows name, initials, "Member since Nov 2026", date of birth, gender, nationality, email, phone, address, and the Academic Status card. |
| PRF-02 | PASS | | Changed the address, saved: "Your profile has been updated." and the new value was there after a reload. Restored to "QA Street 1" afterwards. |
| PRF-03 | PASS | | Edit, change the name, Cancel: the page still shows the old name and nothing is saved. |
| PRF-16 | PASS | | "New password and confirmation do not match." |
| PRF-19 | FAIL | ISS-035 | After an error, closing and reopening the password modal clears the message, but the three typed passwords are still in the fields (lengths 11, 13, 15). |
| PRF-25 | FAIL | ISS-035 | "Two-factor authentication: Not configured" looks like an available setting; nothing says it isn't available. |
| PRF-26 | FAIL | ISS-035 | After a successful save, "Your profile has been updated." is still on the page when Edit is opened again. |
| PRF-23 | not run | | Course progress with paid courses not checked (progress is always 0%, see DSH-12). |
| ERR-01 | FAIL | ISS-034 | Backend stopped (I killed the uvicorn reloader and its worker), then reloaded `/dashboard` as a student: it stays on "Loading your dashboard..." for over 35 seconds with no error and no retry. D-33 confirmed. |
| ERR-02 | FAIL | ISS-034 | The same for `/courses`, `/homework`, `/quizzes`, `/results`, `/messages`, `/schedule` and `/profile`: each stays on its "Loading …" text after 5 s. The session is kept (no logout). |
| ERR-03 | PASS | ISS-034 | Contact form: "Your message could not be sent. Please try again." and the typed text stays. Login: only "Login failed" (same as a wrong password, not a network message); the typed username and password stay. Portal forms not tried. |
| ERR-05 | FAIL | ISS-034 | After the backend came back (restarted with `uvicorn main:app --reload`), the stuck page never recovered or retried; only a full reload worked. |
| ERR-04, ERR-06, ERR-07, ERR-08, ERR-09, ERR-11, ERR-12 | not run | | Throttling, request blocking, other browsers and large lists not run. |
| A11-01 | FAIL | ISS-033 | Viewport meta is `maximum-scale=1, user-scalable=no` on every page, so pinch-zoom is disabled. D-49 confirmed. |
| A11-05 | FAIL | ISS-033 | Form fields without a label or `aria-label`: login 2 of 3, signup 5 of 6, contact 3 of 3, dashboard 3 of 4. |
| A11-06 | FAIL | ISS-033 | Icon-only buttons with no name: 1 on the landing page, 2 on login, 1 each on signup and contact. |
| A11-08 | FAIL | ISS-033 | Every page has the title "Cambfordable Academic Portal". |
| A11-09 | FAIL | ISS-033 | Landing page has 3 `h1` elements; `/signup` has none. |
| A11-10 | PASS | | No image without `alt` text on the pages checked (landing, login, signup, contact, dashboard, courses, quizzes). The wording of the alt text was not judged. |
| A11-12 | FAIL | ISS-033 | Favicon present; no Open Graph / social preview tags. |
| A11-02, A11-03, A11-04, A11-07, A11-11, A11-13 | not run | | Keyboard-only use, Esc and focus trap in modals, contrast, reduced motion and Lighthouse not run. |

## Phase 12: end-to-end flows

**Method:** one continuous journey was run with a fresh student, `qa_signup_2` (id 28), in QA-101, mixing API calls (the same ones the forms make) with the UI checks recorded above. Result: proof upload (pending, homework list 403 while pending: CRS-18 pass) → admin got "Payment proof to review" → approval → student enrolled and got "Enrollment confirmed" → homework `QA XSS…` (id 10) submitted → TA `qa_ta` graded it 7 → quiz 20 submitted (no `is_correct` in the payload) → TA graded it 5/5 → student got "Assignment graded" and "Quiz graded" → results showed 53.5% (the mean of 7% and 100%), letter F. Note the homework's maximum stayed 100 although `total_marks: 10` was sent, so 7 counted as 7%. The quiz grade call needs `submission_id` (16), not the student id. The other flows are decided by the component results above:

| Flow | Status | Notes |
|---|---|---|
| F-01 Visitor signs up | FAIL | Subject cards and footer links go nowhere and Terms and Privacy are `#` (ISS-005, ISS-009). Signup and login themselves work. |
| F-02 Student requests a course | PASS with issues | Proof upload, pending state and approval work (Phase 5); no payment instructions, no reject path (ISS-013, ISS-014). |
| F-03 Admin reviews a payment | FAIL | No reject, no unenroll from the UI (ISS-013); re-approval repeats notifications (ISS-015). |
| F-04 Admin enrolls directly | PASS with issues | Works; see ISS-013. |
| F-05 Admin sets up a course | FAIL | Course form accepts blank values and crashes on a duplicate (ISS-012); validation gaps in quiz creation (ISS-026). |
| F-06 Student attends a live class | BLOCKED | The Zoom SDK crashes on load in the dev build (ISS-020); chat history is broken in production because of the missing column (ISS-001). |
| F-07 Homework | FAIL | Late, wrong-type and oversized submissions are accepted (ISS-025). The happy path works. |
| F-08 Quiz taken normally | FAIL | No timer, and states are unclear (ISS-027). Submission and grading work. |
| F-09 Proctoring | PASS with issues | Tab-switch and fullscreen warnings, auto-submit and the admin flag work; refresh resets counters (ISS-027). |
| F-10 TA grades | PASS | Scoped access and grading work (Phase 9). Homework grading modal not driven. |
| F-11 Student reviews performance | PASS | `/results` and links work. |
| F-12 to F-19 | covered by section 8 | Not run as separate flows. Mobile (F-16), security, access and error flows are covered by the MOB, SEC, AUZ and ERR results above: mobile partly, security mostly pass (open: ISS-028, ISS-029, ISS-036), errors fail (ISS-034). |

## Issues

### ISS-036: Debug page and security headers

- **Severity:** Low
- **Test:** SEC-20, SEC-22
- **Actual:** `/test-image-feature` is public. No HSTS, CSP, X-Frame-Options or nosniff headers on the local API or frontend (production not checked).

### ISS-035: Shell, search, dashboard and profile gaps

- **Severity:** Medium
- **Test:** NAV-05, NAV-10, NAV-11, NAV-14, NAV-15, NAV-18, DSH-07, DSH-12, PRF-19, PRF-25, PRF-26
- **Suspected defect:** D-13, D-26, D-39 (confirmed)
- **Actual:** The header menus don't close on an outside click and can overlap. Searching for an unenrolled course shows "No courses found" because the Enrolled tab is selected. Course progress stays at 0% after completed work. Submitted homework still shows as upcoming. Admins and TAs get the student sidebar, with a dead-end Results page. After errors or saves, passwords stay typed and the success message lingers. 2FA looks like a real setting.

### ISS-034: Backend outage leaves portal pages on an endless loading screen

- **Severity:** High
- **Test:** ERR-01, ERR-02, ERR-03, ERR-05
- **Suspected defect:** D-33 (confirmed)
- **Actual:** With the backend down every portal page shows its "Loading …" text forever, with no error, no retry button and no sidebar. It doesn't recover when the backend returns until the user reloads. The login form shows "Login failed" for a network failure.

### ISS-033: Accessibility gaps

- **Severity:** Medium
- **Test:** A11-01, A11-05, A11-06, A11-08, A11-09, A11-12
- **Suspected defect:** D-49 (confirmed)
- **Actual:** Pinch-zoom is disabled; many form fields have no label; icon-only buttons have no name; all pages share one title; the landing page has three `h1` and `/signup` has none; there is no social preview.

### ISS-001: Chat history request returns 503, conversation shows "We could not load this conversation"

- **Severity:** Medium
- **Test:** ENV-05
- **Suspected defect:** new
- **Role and account:** hamza (admin)
- **URL:** /messages
- **Steps:**
  1. Log in as hamza.
  2. Open `/messages`. The first class chat (`numbers`, live class id 30) is selected automatically.
- **Expected:** Chat history loads, or an empty conversation shows with no error.
- **Actual:** Red banner "We could not load this conversation." `GET /chat/30/messages` returns 503, twice. The WebSocket for the same class opens fine. A `fetch` I ran from the page console to the same URL failed with "Failed to fetch" (no status), while other API calls from that page worked.
- **Console or network errors:** `GET http://localhost:8000/chat/30/messages` 503 (x2). No console errors. The cause is not visible from the browser; the backend log should show it.
- **Screenshot:** Taken during the run, not saved to disk.
- **Cause found in Phase 6 (read-only check of the database):** the production table `live_class_messages` has the columns `id, live_class_id, user_id, message, created_at`, but the `LiveClassMessage` model also has an `is_admin` column and no migration adds it (alembic version `c8e4a2b90d11`). Every chat history request and every chat save therefore fails. Severity should be Critical: live chat does not work at all on this database.

### ISS-002: 404 page is the bare Next.js default with no way back

- **Severity:** Low
- **Test:** ENV-06
- **Suspected defect:** new
- **Role and account:** hamza (admin)
- **URL:** /nope
- **Steps:** Open `http://localhost:3000/nope`.
- **Expected:** A branded 404 page with a link back to the site or dashboard.
- **Actual:** Black page with "404 | This page could not be found." and no link or navigation.
- **Console or network errors:** None.
- **Screenshot:** Taken during the run, not saved to disk.

### ISS-003: Interactive components never hydrate on `127.0.0.1:3000`, so the plan's two-role tip doesn't work

- **Severity:** Low (dev server only; affects testing, not users)
- **Test:** found during PUB-19
- **Suspected defect:** new
- **Role and account:** logged out
- **URL:** http://127.0.0.1:3000/
- **Steps:**
  1. Open `http://127.0.0.1:3000/`.
  2. Click any FAQ question.
- **Expected:** The FAQ opens, like on `localhost`.
- **Actual:** Nothing happens. React props are missing from the button (no `__react*` keys), and `GET /_next/webpack-hmr` with an `Origin: http://127.0.0.1:3000` header returns 403. Plain links (such as Join) still work. `next.config.mjs` has no `allowedDevOrigins`.
- **Impact on testing:** The plan says to use `127.0.0.1:3000` for a second session (MTG-06, MTG-07, student role). That won't work in the dev server. Use a separate browser profile or a logged-out state on `localhost` instead.
- **Console or network errors:** HMR request 403 from the `127.0.0.1` origin.
- **Screenshot:** Not saved.

### ISS-004: `/meet-the-developer` crashes on load

- **Severity:** Medium
- **Test:** DEV-01
- **Suspected defect:** new
- **Role and account:** logged out
- **URL:** /meet-the-developer
- **Steps:** Open `http://localhost:3000/meet-the-developer`.
- **Expected:** The portfolio page renders with the 3D hero.
- **Actual:** Next.js runtime error overlay: "Cannot read properties of undefined (reading 'ReactCurrentOwner')", thrown while loading `@react-three/fiber` and `react-reconciler` from `app/components/Portfolio/hero/HeroScene.tsx` (via `Hero.tsx` and `app/meet-the-developer/page.tsx`). That looks like a React version mismatch with the three.js renderer. The page has no content.
- **Console or network errors:** The TypeError above, with a long module-evaluation stack. Not tested on a production build.
- **Screenshot:** Taken, not saved.

### ISS-005: Footer links and subject cards go nowhere (D-17 partly confirmed)

- **Severity:** Medium
- **Test:** PUB-16, PUB-21, PUB-22
- **Suspected defect:** D-17 (confirmed for these items; not reproduced for Join, Enroll Now, Learn More, Start Learning and Schedule Demo, which now work)
- **Role and account:** logged out
- **URL:** /
- **Steps:** Inspect and hover the footer and the Subjects cards.
- **Expected:** Every link opens a real page; cards that look clickable are clickable.
- **Actual:** `Learning Tools`, `My Credentials`, `Privacy Policy`, `Terms of Service`, `Refund Policy` and all four social icons link to `#`. The six subject cards show a pointer cursor but have no link or click handler. There are no policy pages at all, and the signup form links to Terms of Service and Privacy Policy (SGN-19).
- **Console or network errors:** None.
- **Screenshot:** Not saved.

### ISS-006: Footer phone number is a placeholder and differs from the contact page

- **Severity:** Low
- **Test:** PUB-24
- **Suspected defect:** new
- **Role and account:** logged out
- **URL:** / (footer) and /contact
- **Expected:** The same real numbers everywhere.
- **Actual:** Footer: `+1 (234) 567-890` (also in the About page's `tel:+1234567890`). Contact page: `+92 345 9202628`, `+92 345 9225425`, `051-7066015`.
- **Console or network errors:** None.
- **Screenshot:** Not saved.

### ISS-007: Usernames and emails that differ only by case are accepted as new accounts

- **Severity:** Medium
- **Test:** SGN-05, SGN-06
- **Suspected defect:** new
- **Role and account:** logged out
- **URL:** /signup, `POST /auth/signup`
- **Steps:**
  1. Sign up as `QA_Student_A` (existing account: `qa_student_a`) with a new email.
  2. Sign up as `qa_dup_new3` with `QA_STUDENT_A@EXAMPLE.COM` (existing: `qa_student_a@example.com`).
- **Expected:** Both are rejected as duplicates.
- **Actual:** Both return 201. Login is case-sensitive, so `qa_student_a` and `QA_Student_A` are two separate accounts. The email domain is lower-cased on save but the local part is not.
- **Impact:** Look-alike accounts, for example `Admin` next to `admin`.
- **Screenshot:** Not applicable (API).

### ISS-008: Signup accepts almost any username, phone and email text

- **Severity:** Medium
- **Test:** SGN-11, SGN-13, SGN-14, SGN-16, SGN-17
- **Suspected defect:** D-38 (confirmed for signup)
- **Role and account:** logged out
- **URL:** /signup, `POST /auth/signup`
- **Actual:** Accepted with 201: phone `abc`, phone `03001234567`, an empty phone, a username of three spaces, a 199-character username, and a username with a space and non-Latin letters. The only phone check is "required" in the browser. A 129-character password is rejected, but the page shows the raw text "String should have at most 128 characters" with no field name.
- **Expected:** Phone, username and length rules match the form hint ("include country code"), and error messages name the field.
- **Console or network errors:** None.
- **Screenshot:** Not applicable (API).

### ISS-009: Session and navigation gaps around login and signup

- **Severity:** Low (LGN-11 is Medium: a stale page shows a signed-out user's details)
- **Test:** LGN-11, LGN-12, LGN-14, LGN-15, SGN-24, SGN-25
- **Suspected defect:** new
- **Role and account:** `qa_signup_1`
- **Actual:**
  - After Sign out, Back brings the dashboard back with the user's name, email and profile until the page is reloaded (LGN-11).
  - A bad or expired token redirects to `/login` with no message (LGN-12).
  - A deep link such as `/homework` is lost: after login you land on `/dashboard` (LGN-14).
  - `/login` and `/signup` show their forms to a logged-in user (LGN-15, SGN-24).
  - `/signup` has no link back to the site (SGN-25).
- **Screenshot:** LGN-11 screenshot taken, not saved.

### ISS-010: Login with email address fails

- **Severity:** High (a P0 test)
- **Test:** LGN-02
- **Suspected defect:** D-18 (confirmed)
- **Role and account:** `qa_signup_1`
- **URL:** /login
- **Steps:** Log in with `qa_signup_1@example.com` and the correct password.
- **Expected:** Logs in; the field is labelled "Username or Email".
- **Actual:** "Invalid credentials". The same user logs in with the username. The page returned no other error.
- **Console or network errors:** `POST /auth/login` 401.
- **Screenshot:** Not saved.

### ISS-011: No brute-force protection and no session renewal

- **Severity:** Medium
- **Test:** LGN-19, LGN-13
- **Suspected defect:** D-15 (likely; the 30-minute wait was not run)
- **Role and account:** `qa_signup_2` (throwaway)
- **Actual:** 20 wrong passwords in a row all return 401 with no delay, and the correct password still works afterwards. Separately, the access token lasts 30 minutes and the frontend never uses the refresh token the server issues, so a student is logged out 30 minutes after login, even mid-quiz.
- **Screenshot:** Not applicable.

### ISS-012: Course form accepts blank values and crashes on a duplicate code

- **Severity:** High
- **Test:** ACR-03, ACR-05
- **Suspected defect:** D-32 (confirmed)
- **Role and account:** `admin_test`
- **Steps:** (1) Create a course with code `QA-101`, which exists. (2) Create a course with three spaces in name and code.
- **Expected:** (1) A "code already exists" message. (2) Rejected.
- **Actual:** (1) "Network error. Make sure the server is running." The server fails without CORS headers (a crash, not a clean 4xx). (2) Created as course id 10 with name and code `"   "`; it appears in every course list.
- **Screenshot:** Not saved.

### ISS-013: No way to reject a payment, unenroll from the UI, or see pending students in Enrollments

- **Severity:** High
- **Test:** PAY-08, PAY-09, CRS-19, ENR-08, ENR-09
- **Suspected defect:** D-11, D-12 (confirmed)
- **Actual:** Payments only toggles Paid and Unpaid. Reversing a payment returns the student to "Pending review" with no notification. The Enrollments screen has no unenroll button and hides students whose proof is pending. Only the API can unenroll, and that deletes the row and the proof.

### ISS-014: Students and admins lack payment and contact information

- **Severity:** Medium
- **Test:** CRS-06, CRS-15, ACR-08
- **Suspected defect:** D-13, D-51 (confirmed)
- **Actual:** The enrollment modal shows no price or payment method; "Message admissions" opens a Messages page that only works during a live class. The Courses admin tab has no way to add or edit the WhatsApp link after creation.

### ISS-015: Re-approving a payment repeats notifications

- **Severity:** Low
- **Test:** PAY-10
- **Actual:** Each Unpaid to Paid change creates a new "Enrollment confirmed" notification, and the code sends the welcome email and WhatsApp each time. The delivery of the messages was not checked.

### ISS-016: Access Roles screen: error after changing a role, no demote, no remove

- **Severity:** Medium
- **Test:** ROL-05, ROL-07, ROL-12
- **Suspected defect:** D-34 (confirmed)
- **Actual:** Assigning a role for a course the user is already in saves the role but shows "User already enrolled in this course". There is no option to make someone a student again or to remove a TA from a course. A TA assigned to a course has access to it even when their own payment is Unpaid.

### ISS-017: Meeting and schedule give no reasons, and admins need an enrollment to host

- **Severity:** High
- **Test:** LCC-06, SCH-09, MTG-04, MTG-05, MTG-09, MTG-10, MTG-11, MTG-12
- **Suspected defect:** D-21, D-03 (partly confirmed)
- **Actual:** The server returns precise reasons ("Class has not started yet", "Class has ended", "You are not enrolled in this course"), but `/meeting/{id}` shows only "Failed to load the meeting. You may close this tab." for every one of them, including a bad id. Admins and TAs can only open or list classes in courses they are enrolled in, so an admin who creates a class in a course they are not enrolled in cannot join it (403), and `/schedule` doesn't show it. "Join Class" opens the meeting in the same tab, so "Close Tab" (`window.close()`) does nothing. Logged-out visitors are sent to `/login` with no way back to the meeting.

### ISS-018: Live class form: double-click creates duplicates, and server limits differ from the form

- **Severity:** Medium
- **Test:** LCC-15, LCC-05
- **Actual:** Two quick clicks created two classes (ids 35 and 36) and two Zoom meetings and sent two notifications. The form enforces a duration of 15 to 480 but the server accepts 1 to 480.

### ISS-019: Class attachments have no server-side type or size limit

- **Severity:** High
- **Test:** PCL-12
- **Suspected defect:** D-41 (confirmed for this upload)
- **Actual:** `POST /live-classes/{id}/attachment` as admin accepted `.txt`, `.exe`, `.html` and a 51 MB file, and stored them under `/uploads/live_classes/`. Downloads need a login and an enrolled student, and are served as `application/octet-stream`, which limits the HTML risk. The page's own check was not tried.

### ISS-020: Zoom SDK crashes on load, so the meeting page is blank

- **Severity:** Critical (blocks every class)
- **Test:** MTG-01, MTG-02, MTG-03 and the rest of 8.15, MCQ-01
- **Role and account:** `qa_student_a`, class 34 (live)
- **Steps:** Open `/meeting/34` during the class window.
- **Expected:** "Preparing your classroom…", then Zoom.
- **Actual:** Black page with only a fullscreen icon and a Next.js "1 issue" badge. Console: "Zoom Error: TypeError: Cannot read properties of undefined (reading 'ReactCurrentOwner')" thrown from the `@zoom/meetingsdk` bundle during `ZoomProvider` setup. The backend calls succeed (`zoom-sdk` and `session/claim`). Likely a React version mismatch between the Zoom SDK and the app (dev build, Turbopack); not checked in a production build.
- **Screenshot:** Taken during the run, not saved to disk.

### ISS-021: Live MCQ and chat protocol quirks

- **Severity:** Low
- **Test:** MCQ-03, MCQ-04, CHT-08, CHT-13
- **Actual:** The server silently ignores invalid or incomplete questions. A single blank option drops the whole question. Chat messages sent less than a second apart are dropped without telling the sender. Any chat text that is JSON with an `action` the server knows (for example `question_end` typed by an admin in the chat box) is run as a command and never appears as chat.

### ISS-022: After a Redis outage, a class's live updates never recover

- **Severity:** Medium
- **Test:** MCQ-16
- **Actual:** Redis stopped (Docker Desktop was not running) while class 34 had open sockets. Afterwards the sockets stayed connected and direct replies still worked, but broadcasts to the other users never arrived again, even after Redis was restarted, until the class had no sockets left or the backend was restarted. Nobody sees a message. A class that no socket had touched during the outage worked normally.

### ISS-023: Any logged-in user can download any uploaded file if they have the path

- **Severity:** High
- **Test:** found in HWS-13 and PCL-16 checks; SEC-06
- **Latest check (rerun): fixed.** Every uploaded file type I fetched (payment proofs, homework files, homework images, quiz images) now returns 401 logged out and 403 to a non-enrolled student; another student can't get a classmate's homework file; only the owner, enrolled students (for course images) and admins can. The `solution_url` exposure before submission (SEC-06) remains.
- **Actual (corrected, earlier in the run):** Early in the run `/uploads/homeworks/{file}` returned 200 to a non-enrolled student (`qa_student_b`) and to another student (`qa_student_d`). The backend then reloaded with the new `crud/file_access.py`, and afterwards B and D got 403 on homework files, so that part is fixed in the current code. Still open: B (not enrolled) got 200 on a quiz question image (`/uploads/quiz_images/photo_415d6731.png`), which the access rules don't explain; and `/homeworks/course/{id}` shows `solution_url` to a paid student before they submit (SEC-06). No token gives 401.

### ISS-024: Server accepts a homework due date in the past

- **Severity:** Low
- **Test:** HWC-13
- **Actual:** `POST /homeworks/` with a due date a day ago returned 200 and created the homework. The plan expects "Due date must be in the future" from the server too.

### ISS-025: Homework gaps: late and unsupported submissions, student names, blank grading page, null title

- **Severity:** High
- **Test:** HWS-07, HWS-08, HWS-09, HWS-18, HWG-02, HWG-09, HWG-16, HWG-17
- **Suspected defect:** D-25, D-30, D-31, D-43, D-50 (confirmed)
- **Actual:** The submit endpoint has no file type or size check (a `.exe` and an 11 MB file were accepted) and no deadline check; late work shows as plain "Submitted". The submissions modal shows "Student #N" instead of names. A remark without a score notifies the student that work is graded. `/homework-submissions/{id}/grade` is blank for everyone. `/homework/{bad id}/grades` shows "null - Your Grade".

### ISS-026: The quiz API accepts invalid quizzes

- **Severity:** Medium
- **Test:** QZC-03, QZC-04, QZC-11, QZC-13
- **Suspected defect:** D-28 (confirmed at API level)
- **Actual:** `POST /quizzes/` returned 200 for a blank option, no correct option, two correct options, one option, no questions, negative question marks, a total that doesn't match the questions, and a past deadline. Quizzes `QA Val …` (ids 12 to 19) exist in QA-104 because of this. Whether the form blocks these was not checked.

### ISS-027: Quiz taking: no timer, refresh loses the attempt, unclear states

- **Severity:** High
- **Test:** QZT-03, QZT-04, QZT-14, QZT-15, QZT-16, QZT-20, QZP-09, QZP-10
- **Suspected defect:** D-07, D-16, D-46 (confirmed)
- **Actual:** There is no countdown and no time limit enforced (page or server). A submitted quiz still shows the start screen. Closed, late-allowed and no-access quizzes all show "Failed to load quiz" (a late-allowed quiz cannot be opened after its deadline although a direct submission is accepted as late). Refreshing resets violation counters and answers. Copy and paste are blocked silently.

### ISS-028: Quiz submission trusts whatever ids and file URLs the client sends

- **Severity:** Medium
- **Test:** SEC-10, SEC-11
- **Actual:** `POST` of a quiz submission accepted question and option ids from a different quiz, and an `uploaded_file_url` that points at another student's homework file (`qa_student_e` on quiz 6, submission 15). There is no answer validation on the server.

### ISS-029: API docs are public and CORS allows unrelated origins

- **Severity:** Low
- **Test:** SEC-14, SEC-16
- **Actual:** `/docs` and `/openapi.json` return 200 with no login. The CORS list includes `meramusafir.vercel.app` and `mera-musafir-web.vercel.app`, which look like another project; the first is echoed back in `Access-Control-Allow-Origin`.

### ISS-030: Profile validation gaps and raw validator text

- **Severity:** Low
- **Test:** PRF-07, PRF-08, PRF-09, PRF-11
- **Actual:** API error text includes "Value error," and raw pydantic types. A 501-character address is accepted.

### ISS-031: JazzCash payment is not usable and leaks a field (OUT OF SCOPE: future improvement, per owner)

- **Severity:** High
- **Test:** JAZ-01, JAZ-02, JAZ-03, JAZ-09
- **Suspected defect:** D-24 (confirmed)
- **Actual:** No UI uses it. The initiate response contains `pp_Password`. A pending payment blocks the student forever (409). The amount is fixed at PKR 2,000 for all courses. This left a pending JazzCash payment for `qa_student_b` in QA-104.

### ISS-032: Small mobile layout problems

- **Severity:** Low
- **Test:** MOB-01, MOB-10
- **Actual:** At 390 px the landing page can scroll sideways by about 25 px, and the notification panel is cut off on the left by 40 px.

### Rerun of Phase 1 to 3 failures

Rerun in this session, with no new accounts created: ENV-06 (`/nope` is still the default 404 with no links), PUB-16, PUB-21, PUB-22 (subject cards not links, footer links still `#`), PUB-24 (footer `+1 (234) 567-890`), DEV-01 (`/meet-the-developer` still fails with "This page couldn't load"), SGN-19 (Terms and Privacy still `#`), SGN-24, SGN-25 and LGN-15 (with a valid session `/signup` and `/login` still show their forms, and the signup page only links back via "Login here"), LGN-07 (Forgot password still `#`), LGN-02 (login by email still returns 401). All still fail. I did not rerun the signup validation failures (SGN-05, 06, 11, 13, 14, 16, 17), LGN-08, LGN-11, LGN-12, LGN-14 and LGN-19, because rerunning most of them would create more real accounts on the production database; their evidence stands.

### Other observations (no test ID)

- Course ids 9, 11, 12 and 14 are gaps from failed or duplicate inserts; no rows exist for them.

- `/test-image-feature` returns 200 to a logged-out visitor (D-44 confirmed; to be recorded under SEC-20).
- FAQ buttons have no `aria-expanded` attribute, so screen readers can't tell whether a question is open.
- A Chrome extension error ("A listener indicated an asynchronous response...") appears in the console on most pages. It comes from the browser extension, not the site.

### Observation (no test ID)

- `GET /assets/video.mp4` returned 503 once on the first landing page load, then 206 on the next request. Not reproduced since. Watch for it in PUB-13.

## Test data created

Pre-run catalog: 4 courses, none QA-prefixed.

| Item | Created | Notes |
|---|---|---|
| Course `QA-101` "QA Physics" | yes (id 5) | WhatsApp link is the placeholder `https://chat.whatsapp.com/QAtestgroup101` |
| Course `QA-102` "QA Chemistry" | yes (id 6) | No WhatsApp link |
| Course `QA-103` "QA Biology" | yes (id 7) | No WhatsApp link |
| Users `qa_ta`, `qa_student_a` to `qa_student_e` | yes (6 accounts, plain students so far) | Created with `POST /auth/signup`. Emails `<username>@example.com`, fake phones `+920000000001` to `+920000000006`. User ids 8 to 13 in that order. |
| `qa_ta` role and course | yes | `is_ta` set via `PATCH /users/8/role`, enrolled in QA-101 via `POST /admin/courses/enroll`, the same two calls the Access Roles screen makes |
| Paid enrollments in QA-101 | yes | `qa_student_a`, `qa_student_d`, `qa_student_e` via `POST /admin/courses/enroll`. This sent welcome messages to the fake phone numbers and created enrollment notifications. |
| Pending proof in QA-101 | yes | `qa_student_c`, uploaded `receipt.pdf` (a tiny fake PDF) as `/uploads/payments/receipt_048e7b70.pdf`. **Every real admin got a notification for this proof.** |
| `qa_student_b` | yes | No enrollments, as planned |
| Phase 3 accounts (13) | yes | ids 16 to 28, all students, mostly created by `POST /auth/signup`: `QA_Student_A` (16, `qa_dup_new2@example.com`), `qa_dup_new3` (17, `QA_STUDENT_A@example.com`), `qa_val_1` (18), `qa_val_7pw` (19, blank name), `qa_ph1` (20, phone `abc`), `qa_ph2` (21), a username of three spaces (22, `qa_sp@example.com`), `qa_empty` (23, empty phone), `qauuu…` 199-character username (24, `qa_long@example.com`), `qa_admin_flag` (25), `qa üser 日本` (26, `qa_uni@example.com`), `qa_signup_1` (27), `qa_signup_2` (28). Emails are `<username>@example.com` unless noted. Accounts 22, 24 and 26 are awkward to type into SQL, so delete them by id. `admin_test` and `user_test` (14, 15) are the owner's, not mine. Password for the accounts I made: the shared QA password (kept out of the repo), except `qa_val_7pw` and `qa_val_1`, which use other 8-character test passwords. |
| Contact form messages (Phase 2) | yes (2) | From "QA Tester" and "QA Tester Double", `qa_contact@example.com`. Each created a `contact` notification for every admin, including the real ones. |
| Quiz `QA Quiz Normal` | yes (id 6) | QA-101, 1 MCQ + 1 file question, deadline +7 days |
| Quiz `QA Quiz Proctor Tab` | yes (id 7) | QA-101, 2 MCQs, no deadline |
| Quiz `QA Quiz Proctor FS` | yes (id 8) | QA-101, 2 MCQs, no deadline |
| Quiz `QA Quiz Image` | yes (id 9) | QA-101, 1 MCQ with the banner image attached |
| Homework `QA HW Open` | yes (id 3) | QA-101, due +7 days, description and image |
| Homework `QA HW Other` | yes (id 4) | QA-102, due +7 days |

| Quiz `QA Quiz Closed` | yes (id 10) | QA-101, 1 MCQ, late off, deadline 13:14:40 UTC |
| Quiz `QA Quiz Late` | yes (id 11) | QA-101, 1 MCQ, late on, deadline 13:14:40 UTC |
| Homework `QA HW Overdue` | yes (id 5) | QA-101, due 13:14:40 UTC |
| Live class `QA Class Live` | yes (id 31) | QA-101, 13:14:16 to 14:14:16 UTC. **Real Zoom meeting created.** |
| Live class `QA Class Past` | yes (id 32) | QA-101, 13:14:21 to 13:29:21 UTC. **Real Zoom meeting created.** |
| Live class `QA Class Future` | yes (id 33) | QA-101, 2026-11-08 13:11 to 14:11 UTC. **Real Zoom meeting created.** |

Creating the three live classes also attempted WhatsApp messages (via Twilio) to the paid QA-101 enrollees, whose numbers are fake. Whether those sends succeeded was not checked.

All of these created notifications for paid QA-101 students and `hamza` (QA-102 has no paid students except `hamza`). Quizzes and homework were created with the same API calls the admin forms make (`POST /quizzes/`, `POST /quizzes/questions/{id}/image`, `POST /homeworks/`, `POST /homeworks/{id}/image`).

### Phase 4 and 5 data changes

| Item | Notes |
|---|---|
| `qa_student_d` profile | Name and address edited, cleared and restored to "QA Student D Edited" / "QA Street 1". Gender and phone may still differ from the original. |
| Courses `QA-104` (id 8), `QA-105` (id 13), `QA-106` (id 15, 266-character name) | Created by `admin_test` (auto-enrolled). |
| Course id 10, name and code three spaces | Created by ACR-05. Delete by id. |
| Pending proofs | `qa_student_b` in QA-102 (PDF) and QA-103 (JPG); `qa_signup_2` in QA-102 (WebP) and QA-103 (`spaces & symbols (1).pdf`); `qa_signup_1` in QA-101 (PNG). `qa_student_c` in QA-101 was approved, so it is now Paid; use `qa_signup_1` as the pending student in later phases. |
| Enrollments | `qa_dup_new3` paid in QA-103; `qa_signup_1` paid in QA-102 via Access Roles (and unpaid with a proof in QA-101); `qa_val_1` in QA-104 and QA-105; `qa_student_c` was enrolled in QA-103 and then unenrolled. |
| Roles | `qa_val_1` and `qa_signup_1` went TA or Admin and were restored to students by `PATCH /users/{id}/role`. `user_test` payment flag toggled on and off. `admin_test` was unenrolled from QA-106 and enrolled again. |
| Notifications | `qa_student_c` has "Course access granted" and two "Enrollment confirmed". |

### Phase 6 to 10 data (add to cleanup)

| Item | Notes |
|---|---|
| Live classes 34 to 37 | "QA Class Live 2" (34), duplicates "QA Class UI" (35, 36), "QA Class Live 3" (37). Real Zoom meetings. |
| Homeworks 6 to 9 | PastDue, Decimal (12.5), ByTA, EmptyCourse. Plus submissions and files. |
| Quizzes 12 to 19 | "QA Val …" in QA-104, created by the validation checks. Plus quiz submissions (e.g. submission 15). |
| Uploaded files | Includes `page.html`, an `.exe`, and a 51 MB file under `/uploads`. Delete from disk and storage. |
| JazzCash payment | Pending payment for `qa_student_b` in QA-104 (course 8). |
| `qa_student_d` | Password changed and restored to the shared QA password (kept out of the repo); address restored to "QA Street 1". |

### Browser input note (resolved)

**Cause (reported by the owner):** after login as `hamza`, Chrome showed a "change your password, it was found in a data breach" prompt. It took over input, so real keystrokes and clicks never reached the page (document-level key and mouse listeners saw no events, while `type` and `left_click` reported success). It is a Chrome prompt, not a site defect.

**Workaround used for setup:** fields were filled by dispatching React-compatible `input` events from script and submitted with `form.requestSubmit()`, which runs the app's own handler. Setup data was created this way.

**Going forward:** the owner created two accounts that are not in the breached-password list, `admin_test` (admin) and `user_test` (student), so the prompt should not appear again. These are owner-created, not QA-prefixed, and are not part of the cleanup list. The password is deliberately not recorded here. Dismiss the prompt manually if it ever reappears.

**Scope change:** Twilio and WhatsApp checks are ignored for now, per the owner. Tests tagged for WhatsApp messages (for example LCC-12 and ENR-14) will be marked SKIP, not BLOCKED.

### Browser input problem (first attempt, Browser 1)

Before the second attempt below, creating QA-101 through the Create Course form on `/dashboard` did not work.

- Typed text and clicks on the form inputs have no effect. `document.activeElement` stays `BODY`. Even after focusing the input from script, typed text never appears in it (value stays empty).
- Clicking Create Course (by reference and by coordinates) and pressing Enter sent no request and showed no message.
- Login typing worked earlier in the same tab, so the page itself accepts input. Something changed in the session.
- Possible contributors: the Next.js dev server was rebuilding (Fast Refresh at 17:56:46 and 17:57:05) while source files were being modified, and Chrome page zoom is 90% (`devicePixelRatio` 0.9). Neither is confirmed as the cause.
- Not treated as a site defect, since typing worked at login.

### Second pass additions to the cleanup list

| Item | Notes |
|---|---|
| Homework 10 `QA XSS …` and quiz 20 `QA SQL …` | QA-101. Created by SEC-12/13 and used in the end-to-end flow; each has a `qa_signup_2` submission and grade. |
| `qa_signup_2` | Now paid in QA-101 (proof `qa_flow.pdf` uploaded and approved), plus earlier pending proofs in QA-102 and QA-103. |
| Backend | I stopped the local uvicorn process for ERR-01 to ERR-05 and restarted it with `uvicorn main:app --reload` from `backend` (minimised window). The original terminal that started it no longer owns the process. |
