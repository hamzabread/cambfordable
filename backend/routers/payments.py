# routers/payments.py
import hmac

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request
from models.courses import Course
from models.enrollments import Enrollment
from models.users import User
from models.payments import Payment
from core.security import get_current_user
from crud.payments import create_jazzcash_payment_payload
from core.jazz_config import settings
from core.jazzcash import generate_secure_hash
from database import get_db
from sqlalchemy.orm import Session
from crud.payments import create_pending_payment
from crud.notifications import create_notification
from crud.enrollments import send_enrollment_welcome


router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/jazzcash/initiate/{course_id}")
def initiate_jazzcash_payment(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    enrollment = db.query(Enrollment).filter(
        Enrollment.user_id == user.id,
        Enrollment.course_id == course_id,
    ).first()
    if enrollment and enrollment.paid:
        raise HTTPException(status_code=409, detail="You are already enrolled in this course")

    pending_payment = db.query(Payment).filter(
        Payment.user_id == user.id,
        Payment.course_id == course_id,
        Payment.status == "PENDING",
    ).first()
    if pending_payment:
        raise HTTPException(status_code=409, detail="A payment is already pending for this course")

    amount_paisa = 200000

    payment_data = create_jazzcash_payment_payload(
        course_id=course_id,
        user=user,
        amount_paisa=amount_paisa,
    )

    # ✅ SAVE PENDING PAYMENT
    create_pending_payment(
        db,
        user_id=user.id,
        course_id=course_id,
        txn_ref=payment_data["txn_ref"],
        amount=amount_paisa,
    )

    return {
        "payment_url": payment_data["payment_url"],
        "payload": payment_data["payload"],
    }


@router.post("/jazzcash/callback")
async def jazzcash_callback(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    data = dict(await request.form())

    received_hash = data.get("pp_SecureHash")
    if not received_hash:
        raise HTTPException(status_code=400, detail="Missing secure hash")

    calculated_hash = generate_secure_hash(
        data,
        settings.JAZZCASH_INTEGRITY_SALT
    )

    if not hmac.compare_digest(received_hash, calculated_hash):
        raise HTTPException(status_code=400, detail="Invalid hash")

    txn_ref = data.get("pp_TxnRefNo")
    response_code = data.get("pp_ResponseCode")

    payment = db.query(Payment).filter(
        Payment.txn_ref == txn_ref
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    was_successful = payment.status == "SUCCESS"
    if response_code == "000":
        payment.status = "SUCCESS"
        enrollment = db.query(Enrollment).filter(
            Enrollment.user_id == payment.user_id,
            Enrollment.course_id == payment.course_id,
        ).first()
        if enrollment:
            enrollment.paid = True
        else:
            db.add(
                Enrollment(
                    user_id=payment.user_id,
                    course_id=payment.course_id,
                    paid=True,
                )
            )
    else:
        payment.status = "FAILED"

    db.commit()
    if response_code == "000" and not was_successful:
        course = db.query(Course).filter(Course.id == payment.course_id).first()
        create_notification(
            db,
            user_id=payment.user_id,
            kind="enrollment",
            title="Enrollment confirmed",
            message=f"Your enrollment in {course.name if course else 'the course'} is now active.",
            href="/courses",
        )
        student = db.query(User).filter(User.id == payment.user_id).first()
        send_enrollment_welcome(background_tasks, user=student, course=course)
    return {"status": "ok"}
