# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Students** (primary): Cambridge O Level and A Level students in Pakistan, mostly working at a laptop or desktop. They come to the portal to join live classes, take timed quizzes, submit homework, read feedback, and keep their course access paid up.
- **Parents** usually pay the monthly fee and often upload the payment proof using the student's account. They have no separate role; the payment flow is the same whoever uses it.
- **Teaching assistants** grade quiz and homework submissions and answer course questions in the courses they are assigned to.
- **Admins** run courses, schedule live classes, review payment proofs, manage roles, and clean up data.

## Product Purpose

Cambfordable is an online academy for O and A Level students: live classes on Zoom, timed quizzes, homework, and personal feedback, organised per course in one portal. Success is a student who always knows what is next (the next class, the work due, whether access is paid) and improves from the feedback on each submission.

## Positioning

- **Affordable** compared with typical academies and private tutors.
- **Feedback on every piece of work:** every quiz and homework submission gets an individual score and remark from a teacher or TA, not just an automatic mark.

The landing copy also states that grades are never guaranteed; keep that honesty.

## Operating Context

- Live classes run on Zoom inside the portal (Meeting SDK). Cloud recordings and attendance come back from Zoom after class and appear under Past Classes.
- Billing is monthly per course. Fees are paid outside the portal (bank or JazzCash transfer); someone uploads the proof, an admin approves it, and access runs 30 days. Reminder 3 days before the due date, 3-day grace period, then access pauses; a paused enrollment is removed after a month. Payment proofs are kept for a year.
- Quizzes are proctored in the browser: fullscreen, tab-switch and fullscreen-exit counts, auto-submit.
- Outside class, students ask their teachers through course question threads; during class, through the live chat.
- Each course can have a WhatsApp group, linked in the welcome email.
- Hosting: backend on Railway (FastAPI, Postgres, Redis); frontend Next.js.

## Capabilities and Constraints

- Roles: student, TA (per course), admin. Students see only courses whose payment is approved; paused courses show what to do to restore access.
- Courses can be archived (no new students, no billing, history kept) or deleted.
- Voice typing (browser speech recognition) is available for quiz questions, homework text and course questions; hidden where the browser lacks support.
- Terminology in the UI: "course", "live class", "quiz", "homework" (also "assignments" in navigation), "payment proof", "paid until".

## Evidence on Hand

- Teachers and subjects shown on the public site (`frontend/app/our-teachers`, `components/Landing/Subjects`).
- No real testimonials, enrollment numbers, results statistics or press are confirmed. Do not invent any.

## Product Principles

1. **What's next, first.** Every student screen answers: when is my next class, what is due, and is my access paid.
2. **Feedback is the product.** Scores and teacher remarks are shown prominently and promptly, never buried.
3. **Payment is a step, not a threat.** Due dates and paused access are stated plainly with the one action that fixes them; whoever pays, the student is not shamed.
4. **Honest claims only.** No guaranteed grades, no invented proof.
5. **Affordable and lean.** Prefer what works on ordinary laptops and connections in Pakistan over heavy effects.
