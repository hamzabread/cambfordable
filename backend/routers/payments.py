# routers/payments.py
from fastapi import APIRouter, Depends, HTTPException, Request
from models.users import User
from models.payments import Payment
from core.security import get_current_user
from crud.payments import create_jazzcash_payment_payload
from core.jazz_config import settings
from core.jazzcash import generate_secure_hash
from database import get_db
from sqlalchemy.orm import Session
from crud.enrollments import create_enrollment
from crud.payments import (
    create_jazzcash_payment_payload,
    create_pending_payment,
)


router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/jazzcash/initiate/{course_id}")
def initiate_jazzcash_payment(
    course_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
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

    if received_hash != calculated_hash:
        raise HTTPException(status_code=400, detail="Invalid hash")

    txn_ref = data.get("pp_TxnRefNo")
    response_code = data.get("pp_ResponseCode")

    payment = db.query(Payment).filter(
        Payment.txn_ref == txn_ref
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if response_code == "000":
        payment.status = "SUCCESS"

        create_enrollment(
            db,
            user_id=payment.user_id,
            course_id=payment.course_id,
            enrolled_by="PAYMENT"
        )
    else:
        payment.status = "FAILED"

    db.commit()
    return {"status": "ok"}