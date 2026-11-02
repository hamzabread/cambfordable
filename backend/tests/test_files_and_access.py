"""Uploaded file access rules, homework overview, live class join, quiz
score rules, the contact form and saved upload paths.

One scenario: later steps build on earlier ones. Every failed check is
listed when the test fails."""
from datetime import datetime, timedelta, timezone
from io import BytesIO
import os

from core.security import create_access_token
from models.courses import Course
from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.live_classes import LiveClass
from models.notifications import Notification
from models.quiz import Quiz
from models.quiz_answer import QuizAnswer
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from models.users import User
from routers.uploads import save_file
from fastapi import UploadFile


def test_file_access_grading_and_contact(check, client, db, monkeypatch):
    # SQLite drops timezones; Postgres keeps them. Restore them so the app sees what it sees in production.

    now = datetime.now(timezone.utc)

    # Decoy secret where the old traversal would have landed.
    with open(".env", "w") as handle:
        handle.write("SECRET=decoy")

    def add(obj):
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def user(name, **flags):
        return add(User(username=name, email=f"{name}@x.co", hashed_password="x", **flags))

    admin = user("admin", is_admin=True, full_name="Admin")
    ta_a = user("ta_a", is_ta=True, full_name="TA A")
    ta_b = user("ta_b", is_ta=True, full_name="TA B")
    paid = user("paid", full_name="Paid")
    submitter2 = user("submitter2", full_name="Second")
    other = user("other", full_name="Other")
    unpaid = user("unpaid", full_name="Unpaid")
    noname = user("noname", full_name=None)

    course_a = add(Course(name="A", code="A"))
    course_b = add(Course(name="B", code="B"))
    for who, course, is_paid in [
        (ta_a, course_a, True), (ta_b, course_b, True), (paid, course_a, True),
        (submitter2, course_a, True), (other, course_b, True), (unpaid, course_a, False),
        (noname, course_a, True),
    ]:
        add(Enrollment(user_id=who.id, course_id=course.id, paid=is_paid))

    def make_file(directory, name, body=b"data"):
        os.makedirs(directory, exist_ok=True)
        with open(f"{directory}/{name}", "wb") as handle:
            handle.write(body)

    hw = add(Homework(course_id=course_a.id, title="HW", description="Do it", due_date=now + timedelta(days=1),
                      image_url="/uploads/homework_images/q_1.png", solution_url="/uploads/solutions/hwsol_1.pdf"))
    add(HomeworkSubmission(homework_id=hw.id, user_id=paid.id, file_url="/uploads/homeworks/sub_1.pdf", submitted_at=now))
    # Stored with a backslash, the way older Windows runs saved it.
    add(HomeworkSubmission(homework_id=hw.id, user_id=submitter2.id, file_url="/uploads/homeworks\\sub_2.pdf", submitted_at=now))
    paid_enroll = db.query(Enrollment).filter_by(user_id=unpaid.id).first()
    paid_enroll.payment_proof_url = "/uploads/payments/proof_1.png"
    db.commit()
    quiz = add(Quiz(course_id=course_a.id, title="Q", total_marks=10, solution_url="/uploads/solutions/qsol_1.pdf"))
    question = add(QuizQuestion(quiz_id=quiz.id, question_text="Q1", is_mcq=False, marks=1, image_url="/uploads/quiz_images/qi_1.png"))
    submission = add(QuizSubmission(quiz_id=quiz.id, user_id=paid.id))
    add(QuizAnswer(submission_id=submission.id, question_id=question.id, uploaded_file_url="/uploads/quiz_answers/ans_1.pdf"))
    live = add(LiveClass(course_id=course_a.id, title="L", starts_at=now - timedelta(minutes=5), ends_at=now + timedelta(minutes=55),
                         meeting_id="123456", attachment_url="/uploads/live_classes/notes_1.pdf"))

    for directory, name in [
        ("uploads/homework_images", "q_1.png"), ("uploads/solutions", "hwsol_1.pdf"), ("uploads/solutions", "qsol_1.pdf"),
        ("uploads/homeworks", "sub_1.pdf"), ("uploads/homeworks", "sub_2.pdf"), ("uploads/payments", "proof_1.png"),
        ("uploads/quiz_images", "qi_1.png"), ("uploads/quiz_answers", "ans_1.pdf"), ("uploads/live_classes", "notes_1.pdf"),
        ("uploads", "legacy_1.pdf"), ("uploads/homeworks", "evil_1.html"),
    ]:
        make_file(directory, name)
    add(HomeworkSubmission(homework_id=hw.id, user_id=other.id, file_url="/uploads/legacy_1.pdf", submitted_at=now))
    add(HomeworkSubmission(homework_id=hw.id, user_id=noname.id, file_url="/uploads/homeworks/evil_1.html", submitted_at=now))

    def headers(who):
        return {"Authorization": f"Bearer {create_access_token({'sub': who.username}, timedelta(minutes=5))}"}

    print("--- traversal, logged in as admin, decoy .env in place")
    for path in ["/uploads/..%5C.env", "/uploads/payments/..%5C..%5C.env", "/uploads/homeworks/..%5C..%5C.env",
                 "/uploads/..%2F.env", "/uploads/nope/x.pdf", "/uploads/homeworks/C:%5Cwindows%5Cwin.ini"]:
        r = client.get(path, headers=headers(admin))
        check(path, r.status_code, 404)
        assert b"decoy" not in r.content

    print("--- no login")
    for path in ["/uploads/payments/proof_1.png", "/uploads/homeworks/sub_1.pdf", "/uploads/solutions/hwsol_1.pdf",
                 "/uploads/quiz_images/qi_1.png", "/uploads/legacy_1.pdf", "/uploads/..%5C.env"]:
        check(path, client.get(path).status_code, 401)

    print("--- permission matrix")
    matrix = [
        ("/uploads/payments/proof_1.png", {admin: 200, unpaid: 200, paid: 403, ta_a: 403, ta_b: 403}),
        ("/uploads/homeworks/sub_1.pdf", {admin: 200, paid: 200, submitter2: 403, ta_a: 200, ta_b: 403, other: 403}),
        ("/uploads/homeworks/sub_2.pdf", {admin: 200, submitter2: 200, paid: 403, ta_a: 200}),
        ("/uploads/homework_images/q_1.png", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, other: 403, unpaid: 403}),
        ("/uploads/quiz_images/qi_1.png", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, other: 403, unpaid: 403}),
        ("/uploads/quiz_answers/ans_1.pdf", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, submitter2: 403}),
        ("/uploads/solutions/hwsol_1.pdf", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, unpaid: 403}),
        ("/uploads/solutions/qsol_1.pdf", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, submitter2: 403}),
        ("/uploads/live_classes/notes_1.pdf", {admin: 200, paid: 200, ta_a: 200, ta_b: 403, other: 403, unpaid: 403}),
        ("/uploads/live-classes/notes_1.pdf", {paid: 200, other: 403}),
        ("/uploads/legacy_1.pdf", {admin: 200, other: 200, paid: 403}),
        ("/uploads/homeworks/legacy_1.pdf", {other: 200, paid: 403}),
    ]
    for path, expected in matrix:
        for who, want in expected.items():
            check(f"{who.username:10} {path}", client.get(path, headers=headers(who)).status_code, want)

    print("--- how files are served")
    r = client.get("/uploads/homeworks/sub_1.pdf?mode=view", headers=headers(admin))
    check("pdf view disposition", r.headers["content-disposition"].split(";")[0], "inline")
    check("pdf view type", r.headers["content-type"].split(";")[0], "application/pdf")
    r = client.get("/uploads/homeworks/evil_1.html?mode=view", headers=headers(admin))
    check("html view disposition", r.headers["content-disposition"].split(";")[0], "attachment")
    check("html view type", r.headers["content-type"].split(";")[0], "application/octet-stream")
    r = client.get("/uploads/homeworks/sub_1.pdf", headers=headers(admin))
    check("default disposition", r.headers["content-disposition"].split(";")[0], "attachment")

    print("--- homework overview")
    items = client.get("/homeworks/overview", headers=headers(paid)).json()["items"]
    check("description returned", items[0]["description"], "Do it")
    check("image returned", items[0]["image_url"], "/uploads/homework_images/q_1.png")
    check("solution after submitting", items[0]["solution_url"], "/uploads/solutions/hwsol_1.pdf")
    fresh = user("fresh", full_name="Fresh")
    add(Enrollment(user_id=fresh.id, course_id=course_a.id, paid=True))
    items = client.get("/homeworks/overview", headers=headers(fresh)).json()["items"]
    check("solution hidden before submitting", items[0]["solution_url"], None)

    print("--- join with no full name")
    r = client.get(f"/live-classes/{live.id}/zoom-sdk", headers=headers(noname))
    check("zoom-sdk status", r.status_code, 200)
    check("falls back to username", r.json().get("user_name"), "noname")

    print("--- quiz score rules")
    r = client.post("/quiz-submissions/grade", json={"submission_id": submission.id, "score": 7.5}, headers=headers(admin))
    check("half mark rejected by API", r.status_code, 422)
    r = client.post("/quiz-submissions/grade", json={"submission_id": submission.id, "score": 7}, headers=headers(admin))
    check("whole mark accepted", r.status_code, 200)

    print("--- contact form")
    ok = {"name": "Ali", "email": "ali@example.com", "message": "Hello there, I have a question."}
    before = db.query(Notification).filter_by(kind="contact").count()
    r = client.post("/contact", json=ok)
    check("valid message", r.status_code, 201)
    check("admin notified", db.query(Notification).filter_by(kind="contact").count() - before, 1)
    stored = db.query(Notification).filter_by(kind="contact").first()
    check("message has sender and text", "ali@example.com" in stored.message and "question" in stored.message, True)
    check("admin can read it", client.get("/notifications/", headers=headers(admin)).json()["items"][0]["kind"], "contact")
    check("student didn't get it", db.query(Notification).filter_by(kind="contact", user_id=paid.id).count(), 0)
    check("bad email", client.post("/contact", json={**ok, "email": "nope"}).status_code, 422)
    check("blank name", client.post("/contact", json={**ok, "name": "   "}).status_code, 422)
    check("too long", client.post("/contact", json={**ok, "message": "x" * 5001}).status_code, 422)
    codes = [client.post("/contact", json=ok).status_code for _ in range(6)]
    check("rate limit kicks in after 5", codes, [201, 201, 201, 201, 429, 429])

    print("--- saved paths use forward slashes")
    saved = save_file(UploadFile(file=BytesIO(b"x"), filename="a b&c.pdf"), "uploads/homeworks")
    check("no backslash", "\\" in saved, False)
