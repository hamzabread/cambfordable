"""Monthly billing: first payment, reminders, grace period, pause, removal,
renewals and payment proof retention. Time moves by passing `now`.

One scenario: later steps build on earlier ones. Every failed check is
listed when the test fails."""
from datetime import datetime, timedelta, timezone
import io
import os

from core.hashing import get_password_hash
from crud.billing import run_billing_cycle
from models.courses import Course
from models.enrollments import Enrollment
from models.notifications import Notification
from models.payment_proof import PaymentProof
from models.users import User


def test_monthly_billing(check, client, db, monkeypatch):
    os.makedirs("uploads/payments", exist_ok=True)

    def add(obj):
        db.add(obj)
        db.commit()
        db.refresh(obj)
        return obj

    pw = get_password_hash("Passw0rd!")
    admin = add(User(username="admin", email="admin@x.co", hashed_password=pw, is_admin=True))
    ta = add(User(username="ta", email="ta@x.co", hashed_password=pw, is_ta=True))
    student = add(User(username="student", email="student@x.co", hashed_password=pw, full_name="Student"))
    course = add(Course(name="Physics", code="PHY"))

    def tok(name):
        return client.post("/auth/login", data={"username": name, "password": "Passw0rd!"}).json()["access_token"]

    def h(t):
        return {"Authorization": f"Bearer {t}"}

    def proof(name="proof.pdf"):
        return {"file": (name, io.BytesIO(b"%PDF-1.4 real enough"), "application/pdf")}

    def enrollment():
        db.expire_all()
        return db.query(Enrollment).filter_by(user_id=student.id, course_id=course.id).first()

    def titles():
        db.expire_all()
        return [n.title for n in db.query(Notification).filter_by(user_id=student.id).order_by(Notification.id)]

    def catalog():
        return next(c for c in client.get("/courses/catalog", headers=h(s_tok)).json() if c["id"] == course.id)

    a_tok, s_tok = tok("admin"), tok("student")
    ta_enrolled = add(Enrollment(user_id=ta.id, course_id=course.id, paid=True))

    print("--- first payment")
    check("upload first proof", client.post(f"/courses/{course.id}/enroll-with-proof", files=proof(), headers=h(s_tok)).status_code, 200)
    check("proof recorded as pending", db.query(PaymentProof).filter_by(user_id=student.id).one().status, "pending")
    check("second upload while pending refused", client.post(f"/courses/{course.id}/enroll-with-proof", files=proof(), headers=h(s_tok)).status_code, 409)
    check("approve", client.post("/admin/courses/payment/approve", json={"user_id": student.id, "course_id": course.id}, headers=h(a_tok)).status_code, 200)
    e = enrollment()
    start = datetime.now(timezone.utc)
    check("access runs 30 days", abs((e.paid_until - start) - timedelta(days=30)) < timedelta(minutes=1), True)
    check("proof marked approved", db.query(PaymentProof).filter_by(user_id=student.id).one().status, "approved")
    check("catalog shows paid until", catalog()["paid_until"] is not None and catalog()["enrollment_status"] == "enrolled", True)
    check("renewal too early refused", client.post(f"/courses/{course.id}/enroll-with-proof", files=proof(), headers=h(s_tok)).status_code, 409)

    due = e.paid_until
    print("--- reminders, grace and pause")
    check("nothing to do mid-month", run_billing_cycle(db, now=due - timedelta(days=10))["reminded"], 0)
    check("reminder 3 days before", run_billing_cycle(db, now=due - timedelta(days=2, hours=23))["reminded"], 1)
    check("reminder only once", run_billing_cycle(db, now=due - timedelta(days=1))["reminded"], 0)
    check("reminder notification", titles()[-1], "Payment due soon")
    check("overdue notice at due date", run_billing_cycle(db, now=due + timedelta(hours=1))["overdue"], 1)
    check("still has access in grace", enrollment().paid, True)
    check("pause after 3-day grace", run_billing_cycle(db, now=due + timedelta(days=3, hours=1))["paused"], 1)
    e = enrollment()
    check("access paused", (e.paid, e.paused_at is not None), (False, True))
    check("student told", titles()[-1], "Course access paused")
    check("catalog shows paused", catalog()["enrollment_status"], "paused")
    check("TA never billed", db.query(Enrollment).filter_by(user_id=ta.id).one().paid, True)

    print("--- paying while paused restores access from approval")
    check("paused student can upload", client.post(f"/courses/{course.id}/enroll-with-proof", files=proof("renew.pdf"), headers=h(s_tok)).status_code, 200)
    check("pending proof holds removal", run_billing_cycle(db, now=e.paused_at + timedelta(days=31))["removed"], 0)
    client.post("/admin/courses/payment/approve", json={"user_id": student.id, "course_id": course.id}, headers=h(a_tok))
    e = enrollment()
    check("access restored", (e.paid, e.paused_at), (True, None))
    check("restored message", titles()[-1], "Course access restored")
    check("new month from approval", abs((e.paid_until - datetime.now(timezone.utc)) - timedelta(days=30)) < timedelta(minutes=1), True)

    print("--- early renewal extends from the due date")
    due = e.paid_until
    e.paid_until = datetime.now(timezone.utc) + timedelta(days=5)
    db.commit()
    due = enrollment().paid_until
    check("renewal allowed inside 7 days", client.post(f"/courses/{course.id}/enroll-with-proof", files=proof("early.pdf"), headers=h(s_tok)).status_code, 200)
    check("catalog shows renewal under review", catalog()["proof_pending"], True)
    client.post("/admin/courses/payment/approve", json={"user_id": student.id, "course_id": course.id}, headers=h(a_tok))
    check("extended from old due date", enrollment().paid_until == due + timedelta(days=30), True)
    check("renewal message", titles()[-1], "Payment received")

    print("--- rejected renewal keeps current access")
    e = enrollment()
    e.paid_until = datetime.now(timezone.utc) + timedelta(days=2)
    db.commit()
    client.post(f"/courses/{course.id}/enroll-with-proof", files=proof("bad.pdf"), headers=h(s_tok))
    check("reject renewal", client.post("/admin/courses/payment/reject", json={"user_id": student.id, "course_id": course.id, "reason": "Blurry"}, headers=h(a_tok)).status_code, 200)
    e = enrollment()
    check("still paid after rejection", e.paid, True)
    check("pointer back to last approved proof", e.payment_proof_name, "early.pdf")
    check("catalog shows reason and lets them retry", (catalog()["rejection_reason"], catalog()["renewal_open"]), ("Blurry", True))

    print("--- removal a month after pause")
    due = enrollment().paid_until
    run_billing_cycle(db, now=due + timedelta(days=4))
    paused_at = enrollment().paused_at
    check("not removed after 29 days", run_billing_cycle(db, now=paused_at + timedelta(days=29))["removed"], 0)
    check("removed after 30 days", run_billing_cycle(db, now=paused_at + timedelta(days=30, minutes=1))["removed"], 1)
    check("enrollment gone", enrollment(), None)
    check("student told about removal", titles()[-1], "Removed from a course")
    check("proof history kept", db.query(PaymentProof).filter_by(user_id=student.id).count(), 4)
    check("can request the course again", catalog()["enrollment_status"], "available")

    print("--- proofs deleted after a year")
    old = db.query(PaymentProof).filter_by(user_id=student.id).first()
    with open(old.file_url.lstrip("/"), "wb") as handle:
        handle.write(b"x")
    deleted = run_billing_cycle(db, now=datetime.now(timezone.utc) + timedelta(days=366))["proofs_deleted"]
    check("year-old proofs deleted", deleted, 4)
    check("file removed from disk", os.path.exists(old.file_url.lstrip("/")), False)

    print("--- manual controls")
    legacy = add(User(username="legacy", email="legacy@x.co", hashed_password=pw))
    add(Enrollment(user_id=legacy.id, course_id=course.id, paid=True))
    check("pre-billing students get a month from rollout", run_billing_cycle(db)["started"], 1)
    check("mark unpaid pauses", client.patch("/admin/courses/payment", json={"user_id": legacy.id, "course_id": course.id, "paid": False}, headers=h(a_tok)).json()["paid"], False)
    check("admin list shows removal date", next(r for r in client.get(f"/admin/courses/enrollments/{course.id}", headers=h(a_tok)).json() if r["user_id"] == legacy.id)["removal_on"] is not None, True)
    check("manual run endpoint", client.post("/admin/courses/billing/run", headers=h(a_tok)).status_code, 200)
    check("students can't run billing", client.post("/admin/courses/billing/run", headers=h(s_tok)).status_code, 403)
