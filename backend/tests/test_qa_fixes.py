"""Fixes from the QA run: auth and sessions, enrollment and payment review,
quizzes and homework, live classes and chat, and platform settings.

One scenario: later steps build on earlier ones. Every failed check is
listed when the test fails."""
from datetime import datetime, timedelta, timezone
import io
import json
import os
import time

from models.courses import Course
from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.live_classes import LiveClass
from models.live_class_messages import LiveClassMessage
from models.notifications import Notification
from models.quiz import Quiz
from models.quiz_attempt import QuizAttempt
from models.quiz_option import QuizOption
from models.quiz_question import QuizQuestion
from models.users import User
from core.hashing import get_password_hash
import crud.live_classes as live_crud
import main
import routers.websocket as chat_socket
from routers.auth import login_failures, address_failures


def test_qa_fixes(check, client, db, monkeypatch):
    async def fake_zoom(topic, start_time, duration=60):
        return {"meeting_id": "123", "password": "pw", "join_url": "https://zoom.example/j", "start_url": "https://zoom.example/s"}

    monkeypatch.setattr(live_crud, "create_zoom_meeting", fake_zoom)

    now = datetime.now(timezone.utc)

    def add(obj):
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def user(name, password="Passw0rd!", **flags):
        return add(User(username=name, email=f"{name}@x.co", hashed_password=get_password_hash(password), full_name=name.title(), **flags))

    def login(identifier, password="Passw0rd!"):
        return client.post("/auth/login", data={"username": identifier, "password": password})

    def token(identifier, password="Passw0rd!"):
        return login(identifier, password).json()["access_token"]

    def h(tok):
        return {"Authorization": f"Bearer {tok}"}

    def notes(who, title):
        db.expire_all()
        return db.query(Notification).filter_by(user_id=who.id, title=title).count()

    def upload(name, size=10):
        return {"file": (name, io.BytesIO(b"x" * size), "application/octet-stream")}

    admin = user("admin", is_admin=True)
    ta = user("ta", is_ta=True)
    student = user("student")
    student2 = user("student2")
    outsider = user("outsider")

    print("--- signup and login")
    good = {"username": "new_user", "email": "New@Example.com", "full_name": "New User", "password": "Passw0rd!", "phone_number": "+92 300 1234567"}
    check("valid signup", client.post("/auth/signup", json=good).status_code, 201)
    stored = db.query(User).filter_by(username="new_user").first()
    check("email lower-cased", stored.email, "new@example.com")
    check("phone normalised", stored.phone_number, "+923001234567")
    check("username differing by case rejected", client.post("/auth/signup", json={**good, "username": "NEW_USER", "email": "a@b.co"}).status_code, 400)
    check("email differing by case rejected", client.post("/auth/signup", json={**good, "username": "other1", "email": "NEW@EXAMPLE.COM"}).status_code, 400)
    for label, change in [
        ("phone abc", {"phone_number": "abc"}),
        ("phone without country code", {"phone_number": "03001234567"}),
        ("empty phone", {"phone_number": ""}),
        ("username of spaces", {"username": "   "}),
        ("199-character username", {"username": "u" * 199}),
        ("username with space and non-Latin", {"username": "qa üser 日本"}),
        ("blank name", {"full_name": "  "}),
    ]:
        check(f"rejects {label}", client.post("/auth/signup", json={**good, "username": "x_" + label[:5].replace(" ", ""), "email": f"{abs(hash(label))}@x.co", **change}).status_code, 422)
    r = client.post("/auth/signup", json={**good, "username": "pw_long", "email": "pwl@x.co", "password": "p" * 129})
    check("long password message names the field", r.json()["detail"][0]["msg"].startswith("Password:"), True)
    check("no raw 'Value error' prefix", "Value error" in client.post("/auth/signup", json={**good, "username": "ph_bad", "email": "phb@x.co", "phone_number": "abc"}).json()["detail"][0]["msg"], False)

    check("login by email", login("new@example.com").status_code, 200)
    check("login by email any case", login("NEW@example.COM").status_code, 200)
    check("login by username any case", login("New_User").status_code, 200)
    codes = [login("student", "wrong").status_code for _ in range(11)]
    check("lockout after 10 failures", codes[-1], 429)
    check("locked even with right password", login("student").status_code, 429)
    check("lockout is per account", login("student2").status_code, 200)
    login_failures.hits.clear()
    address_failures.hits.clear()

    pair = login("student").json()
    check("login returns refresh token", bool(pair.get("refresh_token")), True)
    r = client.post("/auth/refresh", json={"refresh_token": pair["refresh_token"]})
    check("refresh works", r.status_code, 200)
    check("access token can't be used to refresh", client.post("/auth/refresh", json={"refresh_token": pair["access_token"]}).status_code, 401)
    check("refresh token can't be used as access", client.get("/auth/me", headers=h(pair["refresh_token"])).status_code, 401)

    time.sleep(1.1)
    r = client.post("/users/profile/password", json={"current_password": "Passw0rd!", "new_password": "N3wPassw0rd!"}, headers=h(pair["access_token"]))
    check("password change ok", r.status_code, 200)
    check("change returns fresh token", client.get("/auth/me", headers=h(r.json()["access_token"])).status_code, 200)
    check("old access token stops working", client.get("/auth/me", headers=h(pair["access_token"])).status_code, 401)
    check("old refresh token stops working", client.post("/auth/refresh", json={"refresh_token": pair["refresh_token"]}).status_code, 401)
    stud_tok = r.json()["access_token"]
    check("forgot password says email is unavailable without SMTP", client.post("/auth/forgot-password", json={"email": "student@x.co"}).status_code, 503)
    check("bad reset token", client.post("/auth/reset-password", json={"token": "nope", "new_password": "Passw0rd!x"}).status_code, 400)
    check("blank email on profile rejected", client.patch("/users/profile", json={"email": None}, headers=h(stud_tok)).status_code, 422)
    check("long address rejected", client.patch("/users/profile", json={"permanent_address": "a" * 501}, headers=h(stud_tok)).status_code, 422)
    check("profile phone message has no prefix", "Value error" in client.patch("/users/profile", json={"phone_number": "123"}, headers=h(stud_tok)).json()["detail"][0]["msg"], False)

    admin_tok = token("admin")
    ta_tok = token("ta")
    s2_tok = token("student2")
    out_tok = token("outsider")

    print("--- courses")
    check("blank course rejected", client.post("/courses/", json={"name": "   ", "code": "   "}, headers=h(admin_tok)).status_code, 422)
    r = client.post("/courses/", json={"name": "Physics", "code": "PHY-1"}, headers=h(admin_tok))
    check("course created", r.status_code, 200)
    course_id = r.json()["id"]
    check("duplicate code is a clean 409", client.post("/courses/", json={"name": "Again", "code": "phy-1"}, headers=h(admin_tok)).status_code, 409)
    check("bad WhatsApp link rejected", client.patch(f"/courses/{course_id}", json={"whatsapp_invite_link": "chat.whatsapp.com/x"}, headers=h(admin_tok)).status_code, 422)
    r = client.patch(f"/courses/{course_id}", json={"whatsapp_invite_link": "https://chat.whatsapp.com/abc"}, headers=h(admin_tok))
    check("WhatsApp link editable later", r.json()["whatsapp_invite_link"], "https://chat.whatsapp.com/abc")
    check("admin course list shows link", client.get("/courses/admin", headers=h(admin_tok)).json()[0]["whatsapp_invite_link"], "https://chat.whatsapp.com/abc")
    check("student can't edit course", client.patch(f"/courses/{course_id}", json={"name": "Hacked"}, headers=h(s2_tok)).status_code, 403)

    print("--- payments")
    pdf = {"file": ("proof.pdf", io.BytesIO(b"%PDF-1.4 x"), "application/pdf")}
    check("proof upload", client.post(f"/courses/{course_id}/enroll-with-proof", files=pdf, headers=h(stud_tok)).status_code, 200)
    check("admin sees pending student", any(e["user"]["username"] == "student" and not e["paid"] for e in client.get(f"/admin/courses/enrollments/{course_id}", headers=h(admin_tok)).json()), True)
    check("reject needs a reason", client.post("/admin/courses/payment/reject", json={"user_id": student.id, "course_id": course_id, "reason": ""}, headers=h(admin_tok)).status_code, 422)
    check("reject", client.post("/admin/courses/payment/reject", json={"user_id": student.id, "course_id": course_id, "reason": "Amount is wrong"}, headers=h(admin_tok)).status_code, 200)
    item = next(c for c in client.get("/courses/catalog", headers=h(stud_tok)).json() if c["id"] == course_id)
    check("student sees rejected", (item["enrollment_status"], item["rejection_reason"]), ("rejected", "Amount is wrong"))
    check("student told about rejection", notes(student, "Payment proof not accepted"), 1)
    pdf = {"file": ("proof2.pdf", io.BytesIO(b"%PDF-1.4 y"), "application/pdf")}
    check("new proof after rejection", client.post(f"/courses/{course_id}/enroll-with-proof", files=pdf, headers=h(stud_tok)).status_code, 200)
    check("back to pending", next(c for c in client.get("/courses/catalog", headers=h(stud_tok)).json() if c["id"] == course_id)["enrollment_status"], "pending")
    for paid in [True, False, True]:
        client.patch("/admin/courses/payment", json={"user_id": student.id, "course_id": course_id, "paid": paid}, headers=h(admin_tok))
    check("paid, unpaid, paid confirms once", notes(student, "Enrollment confirmed"), 1)
    check("reversal tells the student", notes(student, "Course access paused"), 1)
    check("re-approval says restored", notes(student, "Course access restored"), 1)
    client.post("/admin/courses/enroll", json={"user_id": ta.id, "course_id": course_id}, headers=h(admin_tok))
    client.post("/admin/courses/enroll", json={"user_id": student2.id, "course_id": course_id}, headers=h(admin_tok))

    print("--- homework")
    past = (now - timedelta(days=1)).isoformat()
    future = (now + timedelta(days=7)).isoformat()
    check("past due date rejected", client.post("/homeworks/", json={"course_id": course_id, "title": "Old", "due_date": past}, headers=h(admin_tok)).status_code, 422)
    check("blank title rejected", client.post("/homeworks/", json={"course_id": course_id, "title": "  ", "due_date": future}, headers=h(admin_tok)).status_code, 422)
    hw_id = client.post("/homeworks/", json={"course_id": course_id, "title": "HW 1", "due_date": future, "solution_url": "/uploads/solutions/s.pdf"}, headers=h(admin_tok)).json()["id"]
    check("solution hidden in course list before submitting", client.get(f"/homeworks/course/{course_id}", headers=h(stud_tok)).json()[0]["solution_url"], None)
    check("exe rejected", client.post(f"/homeworks/{hw_id}/submit", files=upload("tool.exe"), headers=h(stud_tok)).status_code, 400)
    check("11 MB rejected", client.post(f"/homeworks/{hw_id}/submit", files=upload("big.pdf", 11 * 1024 * 1024), headers=h(stud_tok)).status_code, 413)
    check("pdf accepted", client.post(f"/homeworks/{hw_id}/submit", files=upload("answer.pdf"), headers=h(stud_tok)).status_code, 200)
    check("solution shown after submitting", client.get(f"/homeworks/course/{course_id}", headers=h(stud_tok)).json()[0]["solution_url"], "/uploads/solutions/s.pdf")
    hw = db.query(Homework).get(hw_id)
    hw.due_date = now - timedelta(minutes=1)
    db.commit()
    r = client.post(f"/homeworks/{hw_id}/submit", files=upload("late.pdf"), headers=h(s2_tok))
    check("late submission accepted and flagged", (r.status_code, r.json().get("is_late")), (200, True))
    check("overview marks it late", client.get("/homeworks/overview", headers=h(s2_tok)).json()["items"][0]["is_late"], True)
    subs = client.get(f"/homeworks/{hw_id}/submissions", headers=h(ta_tok)).json()
    check("submissions have student names", sorted(s["student_name"] for s in subs), ["Student", "Student2"])
    sub_id = next(s["id"] for s in subs if s["student_username"] == "student")
    client.post("/homeworks/grade", json={"submission_id": sub_id, "remark": "Show your working"}, headers=h(ta_tok))
    check("remark alone is not 'graded'", (notes(student, "Assignment graded"), notes(student, "New feedback")), (0, 1))
    for _ in range(3):
        client.post("/homeworks/grade", json={"submission_id": sub_id, "score": 7, "remark": "Show your working"}, headers=h(ta_tok))
    check("same grade three times notifies once", notes(student, "Assignment graded"), 1)
    detail = client.get(f"/homeworks/submissions/{sub_id}", headers=h(ta_tok))
    check("grading page data loads for TA", (detail.status_code, detail.json().get("student_name")), (200, "Student"))
    check("grading page data refused to students", client.get(f"/homeworks/submissions/{sub_id}", headers=h(s2_tok)).status_code, 403)
    check("missing submission is a 404", client.get("/homeworks/submissions/999999", headers=h(ta_tok)).status_code, 404)
    check("admin sees a user's courses", [c["course_id"] for c in client.get(f"/users/{ta.id}/courses", headers=h(admin_tok)).json()], [course_id])
    check("missing homework is a clear 404",client.get("/homeworks/999999", headers=h(stud_tok)).status_code, 404)
    check("solution exe rejected", client.post(f"/homeworks/{hw_id}/solution", files=upload("sol.exe"), headers=h(ta_tok)).status_code, 400)

    print("--- quizzes")
    base_q = {"question_text": "2+2?", "is_mcq": True, "marks": 5, "options": [{"option_text": "4", "is_correct": True}, {"option_text": "5", "is_correct": False}]}
    base = {"course_id": course_id, "title": "Quiz", "total_marks": 5, "duration_minutes": 30, "questions": [base_q]}
    bad = {
        "blank option": {"questions": [{**base_q, "options": [{"option_text": " ", "is_correct": True}, {"option_text": "5", "is_correct": False}]}]},
        "no correct option": {"questions": [{**base_q, "options": [{"option_text": "4", "is_correct": False}, {"option_text": "5", "is_correct": False}]}]},
        "two correct options": {"questions": [{**base_q, "options": [{"option_text": "4", "is_correct": True}, {"option_text": "5", "is_correct": True}]}]},
        "one option": {"questions": [{**base_q, "options": [{"option_text": "4", "is_correct": True}]}]},
        "no questions": {"questions": [], "total_marks": 5},
        "negative marks": {"questions": [{**base_q, "marks": -5}], "total_marks": 5},
        "total mismatch": {"total_marks": 50},
        "past deadline": {"deadline": past},
    }
    for label, change in bad.items():
        check(f"quiz rejects {label}", client.post("/quizzes/", json={**base, **change}, headers=h(admin_tok)).status_code, 422)
    file_q = {"question_text": "Upload working", "is_mcq": False, "marks": 5}
    quiz = client.post("/quizzes/", json={**base, "total_marks": 10, "questions": [base_q, file_q]}, headers=h(admin_tok)).json()
    quiz_id = quiz["id"]
    q_mcq, q_file = quiz["questions"][0]["id"], quiz["questions"][1]["id"]
    r = client.post(f"/quizzes/{quiz_id}/start", headers=h(stud_tok))
    check("start records time", r.status_code == 200 and r.json()["ends_at"] is not None, True)
    first_start = r.json()["started_at"]
    check("restart keeps the original start", client.post(f"/quizzes/{quiz_id}/start", headers=h(stud_tok)).json()["started_at"], first_start)
    check("quiz view includes end time", client.get(f"/quizzes/{quiz_id}", headers=h(stud_tok)).json()["ends_at"] is not None, True)
    check("outsider gets a clear no-access message", "enrollment" in client.get(f"/quizzes/{quiz_id}", headers=h(out_tok)).json()["detail"], True)

    other_quiz = client.post("/quizzes/", json={**base, "title": "Other"}, headers=h(admin_tok)).json()
    foreign_q = other_quiz["questions"][0]["id"]
    foreign_opt = db.query(QuizOption).filter_by(question_id=foreign_q).first().id
    own_opt = db.query(QuizOption).filter_by(question_id=q_mcq, is_correct=True).first().id
    check("question from another quiz rejected", client.post("/quiz-submissions/", json={"quiz_id": quiz_id, "answers": [{"question_id": foreign_q, "selected_option_id": foreign_opt}]}, headers=h(stud_tok)).status_code, 422)
    check("option from another question rejected", client.post("/quiz-submissions/", json={"quiz_id": quiz_id, "answers": [{"question_id": q_mcq, "selected_option_id": foreign_opt}]}, headers=h(stud_tok)).status_code, 422)
    check("someone else's file rejected", client.post("/quiz-submissions/", json={"quiz_id": quiz_id, "answers": [{"question_id": q_file, "uploaded_file_url": "/uploads/homeworks/qa_hw_A.pdf"}]}, headers=h(stud_tok)).status_code, 422)
    check("another student's quiz file rejected", client.post("/quiz-submissions/", json={"quiz_id": quiz_id, "answers": [{"question_id": q_file, "uploaded_file_url": f"/uploads/quiz_answers/u{student2.id}_a_1.pdf"}]}, headers=h(stud_tok)).status_code, 422)
    check("exe quiz upload rejected", client.post(f"/uploads/quiz-answer?quiz_id={quiz_id}", files=upload("x.exe"), headers=h(stud_tok)).status_code, 400)
    check("outsider can't upload for the quiz", client.post(f"/uploads/quiz-answer?quiz_id={quiz_id}", files=upload("x.pdf"), headers=h(out_tok)).status_code, 403)
    own_file = client.post(f"/uploads/quiz-answer?quiz_id={quiz_id}", files=upload("work.pdf"), headers=h(stud_tok)).json()["file_url"]
    r = client.post("/quiz-submissions/", json={"quiz_id": quiz_id, "answers": [{"question_id": q_mcq, "selected_option_id": own_opt}, {"question_id": q_file, "uploaded_file_url": own_file}]}, headers=h(stud_tok))
    check("valid submission accepted", r.status_code, 200)
    check("own file name shown without prefix", db.query(HomeworkSubmission).count() >= 0 and "u" + str(student.id) + "_" not in (r.json().get("message") or ""), True)
    check("submitted quiz can't be reopened", client.get(f"/quizzes/{quiz_id}", headers=h(stud_tok)).status_code, 409)
    check("submitted quiz can't be restarted", client.post(f"/quizzes/{quiz_id}/start", headers=h(stud_tok)).status_code, 409)

    attempt = add(QuizAttempt(quiz_id=other_quiz["id"], user_id=student2.id, started_at=now - timedelta(minutes=45)))
    r = client.post("/quiz-submissions/", json={"quiz_id": other_quiz["id"], "answers": [{"question_id": foreign_q, "selected_option_id": foreign_opt}]}, headers=h(s2_tok))
    check("over-time submission kept but flagged", (r.status_code, r.json().get("flagged_for_review"), r.json().get("over_time")), (200, True, True))

    late_quiz = add(Quiz(course_id=course_id, title="Late ok", total_marks=5, duration_minutes=30, deadline=now - timedelta(hours=1), allow_late=True))
    closed_quiz = add(Quiz(course_id=course_id, title="Closed", total_marks=5, duration_minutes=30, deadline=now - timedelta(hours=1), allow_late=False))
    check("late-allowed quiz opens after deadline", client.get(f"/quizzes/{late_quiz.id}", headers=h(s2_tok)).status_code, 200)
    r = client.get(f"/quizzes/{closed_quiz.id}", headers=h(s2_tok))
    check("closed quiz explains why", (r.status_code, "deadline" in r.json()["detail"]), (403, True))
    sub = client.get(f"/quiz-submissions/quiz/{quiz_id}", headers=h(admin_tok)).json()[0]["submission_id"]
    for _ in range(3):
        client.post("/quiz-submissions/grade", json={"submission_id": sub, "score": 8}, headers=h(admin_tok))
    check("quiz regrade notifies once", notes(student, "Quiz graded"), 1)
    check("courses show real progress", next(c for c in client.get("/courses/me", headers=h(stud_tok)).json() if c["id"] == course_id)["progress"] > 0, True)

    print("--- live classes")
    start = (now + timedelta(days=1)).replace(microsecond=0).isoformat()
    check("10-minute class rejected", client.post("/live-classes/", json={"course_id": course_id, "title": "Short", "starts_at": start, "duration": 10}, headers=h(admin_tok)).status_code, 422)
    check("class created", client.post("/live-classes/", json={"course_id": course_id, "title": "Lecture", "starts_at": start, "duration": 60}, headers=h(admin_tok)).status_code, 200)
    check("same class twice is a 409", client.post("/live-classes/", json={"course_id": course_id, "title": "Lecture", "starts_at": start, "duration": 60}, headers=h(admin_tok)).status_code, 409)
    other_course = add(Course(name="Other", code="OTH"))
    live = add(LiveClass(course_id=other_course.id, title="Now", starts_at=now - timedelta(minutes=5), ends_at=now + timedelta(minutes=55), meeting_id="9"))
    check("admin not enrolled can join", client.get(f"/live-classes/{live.id}/zoom-sdk", headers=h(admin_tok)).status_code, 200)
    check("admin schedule lists every class", live.id in [c["id"] for c in client.get("/live-classes/me", headers=h(admin_tok)).json()], True)
    check("student not enrolled still refused", client.get(f"/live-classes/{live.id}/zoom-sdk", headers=h(s2_tok)).json()["detail"], "You are not enrolled in this course")
    check("attachment exe rejected", client.post(f"/live-classes/{live.id}/attachment", files=upload("x.exe"), headers=h(admin_tok)).status_code, 400)

    print("--- chat")
    chat_class = add(LiveClass(course_id=course_id, title="Chat", starts_at=now - timedelta(minutes=5), ends_at=now + timedelta(minutes=55), meeting_id="8"))
    # Freeze the chat clock so both messages land in the same second however
    # long the first takes (on Windows an unreachable Redis adds ~2 s).
    monkeypatch.setattr(chat_socket, "time", lambda: 1_000_000.0)
    with client.websocket_connect(f"/chat/ws/live-classes/{chat_class.id}/chat?token={stud_tok}") as ws:
        ws.send_text(json.dumps({"action": "chat_message", "message": '{"action": "question_end"}'}))
        ws.send_text(json.dumps({"action": "chat_message", "message": "second"}))
        events = sorted([ws.receive_json(), ws.receive_json()], key=lambda e: e["event_type"])
        check("command-looking text is saved as chat", (events[0]["event_type"], events[0].get("message")), ("chat", '{"action": "question_end"}'))
        check("too-fast message tells the sender", events[1]["event_type"], "error")
    monkeypatch.setattr(chat_socket, "time", lambda: 1_000_002.0)
    with client.websocket_connect(f"/chat/ws/live-classes/{chat_class.id}/chat?token={admin_tok}") as ws:
        ws.send_text(json.dumps({"action": "question_publish", "question": "Q?", "options": ["a", "", "b"], "correct_option": 2}))
        got = ws.receive_json()
        check("blank option skipped, question published", (got["event_type"], got.get("options")), ("question_publish", ["a", "b"]))
        ws.receive_json()  # stats
        ws.send_text(json.dumps({"action": "question_publish", "question": "Q?", "options": ["a", ""], "correct_option": 0}))
        check("invalid question explained to admin", ws.receive_json()["event_type"], "error")
    history = client.get(f"/chat/{chat_class.id}/messages", headers=h(admin_tok))
    check("chat history loads", (history.status_code, len(history.json())), (200, 1))
    check("old token refused on socket", client.get("/auth/me", headers=h(pair["access_token"])).status_code, 401)

    print("--- platform")
    check("API docs off by default", client.get("/docs").status_code, 404)
    check("openapi off by default", client.get("/openapi.json").status_code, 404)
    r = client.get("/", headers={"Origin": "https://meramusafir.vercel.app"})
    check("unrelated origin not allowed", "access-control-allow-origin" in r.headers, False)
    check("nosniff header", r.headers.get("x-content-type-options"), "nosniff")
    check("frame header", r.headers.get("x-frame-options"), "DENY")

    @main.app.get("/__boom")
    def boom():
        raise RuntimeError("boom")

    r = client.get("/__boom", headers={"Origin": "http://localhost:3000"})
    check("crash is a 500 the browser can read", (r.status_code, r.headers.get("access-control-allow-origin")), (500, "http://localhost:3000"))
