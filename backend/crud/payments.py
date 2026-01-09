# crud/payments.py
from datetime import datetime, timezone
from models.users import User
from core.jazz_config import settings
from core.jazzcash import generate_secure_hash
from sqlalchemy.orm import Session
from models.payments import Payment

def create_jazzcash_payment_payload(
    *,
    course_id: int,
    user: User,
    amount_paisa: int,
):
    txn_ref = f"COURSE{course_id}_{user.id}_{int(datetime.now(timezone.utc).timestamp())}"

    data = {
        "pp_Version": "1.1",
        "pp_TxnType": "MWALLET",
        "pp_Language": "EN",
        "pp_MerchantID": settings.JAZZCASH_MERCHANT_ID,
        "pp_Password": settings.JAZZCASH_PASSWORD,
        "pp_TxnRefNo": txn_ref,
        "pp_Amount": str(amount_paisa),
        "pp_TxnCurrency": "PKR",
        "pp_TxnDateTime": datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S"),
        "pp_ReturnURL": settings.JAZZCASH_RETURN_URL,
        "pp_TxnExpiryDateTime": (
            datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")
        ),
    }

    data["pp_SecureHash"] = generate_secure_hash(
        data,
        settings.JAZZCASH_INTEGRITY_SALT
    )

    return {
        "txn_ref": txn_ref,
        "payload": data,
        "payment_url": settings.JAZZCASH_PAYMENT_URL,
    }


def create_pending_payment(
    db: Session,
    *,
    user_id: int,
    course_id: int,
    txn_ref: str,
    amount: int,
):
    payment = Payment(
        user_id=user_id,
        course_id=course_id,
        txn_ref=txn_ref,
        amount=amount,
        status="PENDING"
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment
