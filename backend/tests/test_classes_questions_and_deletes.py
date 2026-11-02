"""Zoom recordings and attendance (Zoom mocked), course questions, course
archiving, and admin deletes with foreign keys enforced.

One scenario: later steps build on earlier ones. Every failed check is
listed when the test fails."""
from datetime import datetime, timedelta, timezone
import os

from sqlalchemy import text

from database import engine
import crud.deletion as deletion
import crud.zoom_sync as zoom_sync
from core.hashing import get_password_hash
from crud.billing import run_billing_cycle
from models.class_attendance import ClassAttendance
from models.course_threads import CourseThread, ThreadReply
from models.courses import Course
from models.enrollments import Enrollment
from models.homeworks import Homework, HomeworkSubmission
from models.live_class_messages import LiveClassMessage
from models.live_class_sessions import LiveClassSession
from models.live_classes import LiveClass
from models.notifications import Notification
from models.payment_proof import PaymentProof
from models.quiz import Quiz
from models.quiz_answer import QuizAnswer
from models.quiz_attempt import QuizAttempt
from models.quiz_option import QuizOption
from models.quiz_question import QuizQuestion
from models.quiz_submission import QuizSubmission
from models.users import User


def test_recordings_questions_archive_and_deletes(check, client, db, monkeypatch):
    for d in ("payments", "live_classes", "homeworks", "quiz_answers", "solutions"):
        os.makedirs(f"uploads/{d}", exist_ok=True)

    with engine.begin() as conn:
        # Exists on Railway but isn't modeled.
        conn.execute(text("CREATE TABLE IF NOT EXISTS class_materials (id INTEGER PRIMARY KEY, live_class_id INTEGER NOT NULL REFERENCES live_classes(id), title TEXT)"))

    # --- Zoom mocks
    zoom_calls = {"recording": None, "participants": None, "deleted": []}
    monkeypatch.setattr(zoom_sync, "get_meeting_recording", lambda meeting_id: zoom_calls["recording"])
    monkeypatch.setattr(zoom_sync, "get_meeting_participants", lambda meeting_id: zoom_calls["participants"])
    monkeypatch.setattr(deletion, "delete_zoom_meeting", lambda meeting_id: zoom_calls["deleted"].append(meeting_id) or True)

    def add(obj):
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    def count(model, **filters):
        db.expire_all()
        return db.query(model).filter_by(**filters).count()

    pw = get_password_hash("Passw0rd!")
    admin = add(User(username="admin", email="admin@x.co", hashed_password=pw, is_admin=True))
    ta = add(User(username="ta", email="ta@x.co", hashed_password=pw, is_ta=True, full_name="Tara TA"))
    other_ta = add(User(username="ta2", email="ta2@x.co", hashed_password=pw, is_ta=True))
    alice = add(User(username="alice", email="alice@x.co", hashed_password=pw, full_name="Alice Khan"))
    bob = add(User(username="bob", email="bob@x.co", hashed_password=pw, full_name="Bob Ali"))
    carol = add(User(username="carol", email="carol@x.co", hashed_password=pw, full_name="Carol"))
    course = add(Course(name="Physics", code="PHY"))
    other = add(Course(name="Chemistry", code="CHEM"))
    now = datetime.now(timezone.utc)
    for user in (ta, alice, bob, carol):
        add(Enrollment(user_id=user.id, course_id=course.id, paid=True, paid_until=now + timedelta(days=20)))
    add(Enrollment(user_id=other_ta.id, course_id=other.id, paid=True))
    IDS = {u.username: u.id for u in (admin, ta, other_ta, alice, bob, carol)}
    COURSE_ID, OTHER_ID = course.id, other.id

    def tok(name):
        return client.post("/auth/login", data={"username": name, "password": "Passw0rd!"}).json()["access_token"]

    def h(name):
        return {"Authorization": f"Bearer {tokens[name]}"}

    tokens = {name: tok(name) for name in ("admin", "ta", "ta2", "alice", "bob", "carol")}

    # ---------------------------------------------------------------- recordings + attendance
    print("--- recordings and attendance")
    past = add(LiveClass(course_id=course.id, title="Waves", starts_at=now - timedelta(hours=2), ends_at=now - timedelta(hours=1), meeting_id="111")); past_id = past.id
    recent = add(LiveClass(course_id=course.id, title="Optics", starts_at=now - timedelta(minutes=65), ends_at=now - timedelta(minutes=5), meeting_id="222"))
    future = add(LiveClass(course_id=course.id, title="Next", starts_at=now + timedelta(days=1), ends_at=now + timedelta(days=1, hours=1), meeting_id="333"))

    zoom_calls["recording"] = {"share_url": "https://zoom.us/rec/share/abc?pwd=xyz", "passcode": "p@ss", "files": 2}
    zoom_calls["participants"] = [
        {"customer_key": f"u{alice.id}", "name": "Alice phone", "duration": 1800, "join_time": (now - timedelta(hours=2)).isoformat(), "leave_time": (now - timedelta(minutes=90)).isoformat()},
        {"customer_key": f"u{alice.id}", "name": "Alice laptop", "duration": 1500, "join_time": (now - timedelta(minutes=85)).isoformat(), "leave_time": (now - timedelta(hours=1)).isoformat()},
        {"name": "bob ali", "user_email": "", "duration": 600},
        {"name": "Random Guest", "duration": 3000},
    ]
    counts = zoom_sync.run_zoom_sync(db, now=now)
    check("hourly job syncs only settled classes", counts, {"recordings": 1, "attendance": 1})
    db.expire_all()
    p = db.get(LiveClass, past.id)
    check("recording saved", (p.recording_url, p.recording_passcode), ("https://zoom.us/rec/share/abc?pwd=xyz", "p@ss"))
    check("recent class not touched yet", db.get(LiveClass, recent.id).attendance_synced_at, None)
    rows = {r.display_name: r for r in db.query(ClassAttendance).filter_by(live_class_id=past.id)}
    check("alice rejoins merged by customerKey", rows["Alice Khan"].minutes, 55)
    check("bob matched by name", rows["Bob Ali"].user_id, bob.id)
    check("guest kept unmatched", rows["Random Guest"].user_id, None)
    check("second run is a no-op", zoom_sync.run_zoom_sync(db, now=now), {"recordings": 0, "attendance": 0})

    me = {c["id"]: c for c in client.get("/live-classes/me", headers=h("alice")).json()}
    check("student sees recording", me[past.id]["recording_url"], "https://zoom.us/rec/share/abc?pwd=xyz")
    check("student present", (me[past.id]["my_attendance_minutes"], me[past.id]["attendance_status"]), (55, "present"))
    check("student has no start_url", me[past.id]["start_url"], None)
    check("unsynced class has no status", me[future.id]["attendance_status"], None)
    bob_me = {c["id"]: c for c in client.get("/live-classes/me", headers=h("bob")).json()}
    check("bob partial", bob_me[past.id]["attendance_status"], "partial")
    carol_me = {c["id"]: c for c in client.get("/live-classes/me", headers=h("carol")).json()}
    check("carol absent", (carol_me[past.id]["my_attendance_minutes"], carol_me[past.id]["attendance_status"]), (0, "absent"))

    att = client.get(f"/live-classes/{past.id}/attendance", headers=h("ta"))
    check("TA on course can see attendance", att.status_code, 200)
    body = att.json()
    check("attendance lists students only", sorted(s["username"] for s in body["students"]), ["alice", "bob", "carol"])
    check("attendance unmatched guest", [u["name"] for u in body["unmatched"]], ["Random Guest"])
    check("attendance source", body["source"], "zoom")
    check("TA on other course refused", client.get(f"/live-classes/{past.id}/attendance", headers=h("ta2")).status_code, 403)
    check("student refused attendance", client.get(f"/live-classes/{past.id}/attendance", headers=h("alice")).status_code, 403)

    # Portal fallback when Zoom has no report.
    zoom_calls["recording"] = None
    zoom_calls["participants"] = None
    add(LiveClassSession(user_id=carol.id, live_class_id=recent.id, device_id="d", started_at=now - timedelta(minutes=70), last_seen=now - timedelta(minutes=20), is_active=False))
    check("refresh before class ends refused", client.post(f"/live-classes/{future.id}/zoom-sync", headers=h("admin")).status_code, 409)
    r = client.post(f"/live-classes/{recent.id}/zoom-sync", headers=h("ta"))
    check("forced refresh falls back to portal data", (r.status_code, r.json().get("attendance"), r.json().get("recording")), (200, "portal", "none"))
    carol_row = db.query(ClassAttendance).filter_by(live_class_id=recent.id, user_id=carol.id).one()
    check("portal minutes clipped to class start", carol_row.minutes, 45)
    check("student cannot force sync", client.post(f"/live-classes/{recent.id}/zoom-sync", headers=h("alice")).status_code, 403)

    # ---------------------------------------------------------------- course questions
    print("--- course questions")
    r = client.post("/threads", json={"course_id": course.id, "title": "  Question on   waves ", "body": "How does interference work?"}, headers=h("alice"))
    check("student asks", r.status_code, 201)
    thread_id = r.json()["id"]
    check("title tidied", r.json()["title"], "Question on waves")
    check("awaiting staff", r.json()["awaiting_staff"], True)
    db.expire_all()
    staff_notes = {n.user_id for n in db.query(Notification).filter_by(kind="question")}
    check("admin and course TA notified, not other TA", staff_notes, {admin.id, ta.id})
    check("not enrolled course refused", client.post("/threads", json={"course_id": other.id, "title": "Hello there", "body": "x"}, headers=h("alice")).status_code, 403)
    check("staff cannot start a thread", client.post("/threads", json={"course_id": course.id, "title": "Hello there", "body": "x"}, headers=h("ta")).status_code, 403)
    check("empty body refused", client.post("/threads", json={"course_id": course.id, "title": "Hello there", "body": "   "}, headers=h("alice")).status_code, 422)
    check("other student can't see it", client.get(f"/threads/{thread_id}", headers=h("bob")).status_code, 404)
    check("other student's list is empty", client.get("/threads", headers=h("bob")).json(), [])
    check("other-course TA can't see it", client.get(f"/threads/{thread_id}", headers=h("ta2")).status_code, 404)
    check("course TA lists it", [t["id"] for t in client.get("/threads", headers=h("ta")).json()], [thread_id])
    r = client.post(f"/threads/{thread_id}/replies", json={"body": "Think of two waves adding up."}, headers=h("ta"))
    check("TA replies", (r.status_code, r.json()["replies"][-1]["is_staff"], r.json()["awaiting_staff"]), (201, True, False))
    db.expire_all()
    check("student told about the answer", db.query(Notification).filter_by(user_id=alice.id, kind="question").count(), 1)
    r = client.patch(f"/threads/{thread_id}", json={"is_resolved": True}, headers=h("alice"))
    check("student marks answered", r.json()["is_resolved"], True)
    check("open filter hides it", client.get("/threads?status=open", headers=h("ta")).json(), [])
    r = client.post(f"/threads/{thread_id}/replies", json={"body": "One more thing"}, headers=h("alice"))
    check("student follow-up reopens", (r.json()["is_resolved"], r.json()["awaiting_staff"], r.json()["reply_count"]), (False, True, 2))
    check("is_mine flags", [x["is_mine"] for x in r.json()["replies"]], [True, False, True])
    check("ask-in courses", [c["code"] for c in client.get("/threads/courses", headers=h("alice")).json()], ["PHY"])
    check("TA cannot delete thread", client.delete(f"/threads/{thread_id}", headers=h("ta")).status_code, 403)

    # ---------------------------------------------------------------- archive
    print("--- archive")
    r = client.post(f"/courses/{course.id}/archive", headers=h("admin"))
    check("archive", r.status_code == 200 and r.json()["archived_at"] is not None, True)
    check("dave can't see archived course", any(c["id"] == course.id for c in client.get("/courses/catalog", headers=h("ta2")).json()), False)
    cat = next(c for c in client.get("/courses/catalog", headers=h("alice")).json() if c["id"] == course.id)
    check("enrolled student still sees it, marked archived", cat["archived"], True)
    check("public course list hides archived", [c["code"] for c in client.get("/courses/").json()], ["CHEM"])
    admin_courses = client.get("/courses/admin", headers=h("admin")).json()
    check("admin list shows archived last with counts", [(c["code"], c["student_count"], c["class_count"]) for c in admin_courses], [("CHEM", 0, 0), ("PHY", 3, 3)])
    check("no new questions in archived course", client.post("/threads", json={"course_id": course.id, "title": "Hello there", "body": "x"}, headers=h("alice")).status_code, 403)
    check("no enrollment requests", client.post(f"/courses/{course.id}/enroll", headers=h("ta2")).status_code, 409)
    e = db.query(Enrollment).filter_by(user_id=alice.id, course_id=course.id).one()
    e.paid_until = now - timedelta(days=10)
    db.commit()
    check("billing skips archived course", run_billing_cycle(db, now=now)["paused"], 0)
    check("unarchive", client.post(f"/courses/{course.id}/unarchive", headers=h("admin")).json()["archived_at"], None)
    check("billing runs again after unarchive", run_billing_cycle(db, now=now)["paused"], 1)
    check("TA cannot archive", client.post(f"/courses/{course.id}/archive", headers=h("ta")).status_code, 403)

    # ---------------------------------------------------------------- deletes
    print("--- deletes")
    def touch(path):
        open(path, "wb").write(b"x")
        return "/" + path

    quiz = add(Quiz(course_id=course.id, title="Q1", total_marks=10, solution_url=touch("uploads/solutions/q1.pdf")))
    question = add(QuizQuestion(quiz_id=quiz.id, question_text="2+2?", marks=10))
    add(QuizOption(question_id=question.id, option_text="4"))
    sub = add(QuizSubmission(quiz_id=quiz.id, user_id=alice.id))
    add(QuizAnswer(submission_id=sub.id, question_id=question.id, uploaded_file_url=touch("uploads/quiz_answers/a.pdf")))
    add(QuizAttempt(quiz_id=quiz.id, user_id=alice.id))
    check("TA cannot delete quiz", client.delete(f"/quizzes/{quiz.id}", headers=h("ta")).status_code, 403)
    check("admin deletes quiz", client.delete(f"/quizzes/{quiz.id}", headers=h("admin")).status_code, 204)
    check("quiz children gone", (count(Quiz), count(QuizQuestion), count(QuizOption), count(QuizSubmission), count(QuizAnswer), count(QuizAttempt)), (0, 0, 0, 0, 0, 0))
    check("quiz files removed", (os.path.exists("uploads/solutions/q1.pdf"), os.path.exists("uploads/quiz_answers/a.pdf")), (False, False))

    hw = add(Homework(course_id=course.id, title="H1", due_date=now)); hw_id = hw.id
    add(HomeworkSubmission(homework_id=hw.id, user_id=bob.id, file_url=touch("uploads/homeworks/b.pdf")))
    check("admin deletes homework", client.delete(f"/homeworks/{hw.id}", headers=h("admin")).status_code, 204)
    check("homework gone", (count(Homework), count(HomeworkSubmission), os.path.exists("uploads/homeworks/b.pdf")), (0, 0, False))
    check("missing homework 404", client.delete(f"/homeworks/{hw_id}", headers=h("admin")).status_code, 404)

    add(LiveClassMessage(live_class_id=past.id, user_id=alice.id, message="hi", is_admin=False))
    with engine.begin() as conn:
        conn.execute(text("INSERT INTO class_materials (live_class_id, title) VALUES (:id, 'notes')"), {"id": past.id})
    past.attachment_url = touch("uploads/live_classes/slides.pdf")
    db.commit()
    check("admin deletes class", client.delete(f"/live-classes/{past_id}", headers=h("admin")).status_code, 204)
    with engine.connect() as conn:
        materials = conn.execute(text("SELECT count(*) FROM class_materials")).scalar()
    check("class children gone", (count(LiveClass, id=past_id), count(LiveClassMessage), count(ClassAttendance, live_class_id=past_id), materials), (0, 0, 0, 0))
    check("zoom meeting cancelled", zoom_calls["deleted"], ["111"])

    # User delete
    add(PaymentProof(user_id=IDS['carol'], course_id=COURSE_ID, file_url=touch("uploads/payments/c.pdf")))
    check("wrong confirm refused", client.delete(f"/users/{IDS['carol']}?confirm=nope", headers=h("admin")).status_code, 422)
    check("admin can't delete self", client.delete(f"/users/{IDS['admin']}?confirm=admin", headers=h("admin")).status_code, 409)
    check("TA cannot delete users", client.delete(f"/users/{IDS['carol']}?confirm=carol", headers=h("ta")).status_code, 403)
    check("delete carol", client.delete(f"/users/{IDS['carol']}?confirm=Carol", headers=h("admin")).status_code, 204)
    check("carol's records gone", (count(User, id=IDS['carol']), count(Enrollment, user_id=IDS['carol']), count(PaymentProof, user_id=IDS['carol']), count(LiveClassSession, user_id=IDS['carol']), count(ClassAttendance, user_id=IDS['carol'])), (0, 0, 0, 0, 0))
    check("carol's proof file removed", os.path.exists("uploads/payments/c.pdf"), False)
    r = client.delete(f"/users/{IDS['alice']}?confirm=alice", headers=h("admin"))
    check("delete alice with a thread", (r.status_code, count(CourseThread), count(ThreadReply)), (204, 0, 0))

    # Course delete
    add(Quiz(course_id=COURSE_ID, title="Q2", total_marks=5))
    add(Homework(course_id=COURSE_ID, title="H2", due_date=now))
    r2 = client.post("/threads", json={"course_id": COURSE_ID, "title": "Bob asks", "body": "?"}, headers=h("bob"))
    check("bob can ask", r2.status_code, 201)
    check("wrong code refused", client.delete(f"/courses/{COURSE_ID}?confirm=PHYS", headers=h("admin")).status_code, 422)
    r = client.delete(f"/courses/{COURSE_ID}?confirm=phy", headers=h("admin"))
    check("delete course", (r.status_code, r.json().get("classes"), r.json().get("quizzes"), r.json().get("homework")), (200, 2, 1, 1))
    check("course contents gone", (count(Course, id=COURSE_ID), count(LiveClass), count(Quiz), count(Homework), count(Enrollment, course_id=COURSE_ID), count(CourseThread)), (0, 0, 0, 0, 0, 0))
    check("other course untouched", (count(Course, id=OTHER_ID), count(Enrollment, course_id=OTHER_ID)), (1, 1))
    check("users kept", count(User, id=IDS['bob']), 1)
    check("zoom meetings cancelled for course", sorted(zoom_calls["deleted"]), ["111", "222", "333"])

    # Path safety
    f = deletion.Files()
    f.add("/uploads/../main.py", "../secret", "/etc/passwd", None, "")
    check("file cleanup stays inside uploads/", f.paths, set())
