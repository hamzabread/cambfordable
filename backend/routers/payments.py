# routers/payments.py
from fastapi import APIRouter, Depends
from models.users import User
from core.security import get_current_user
from crud.payments import create_jazzcash_payment_payload

router = APIRouter(prefix="/payments", tags=["Payments"])

@router.post("/jazzcash/initiate/{course_id}")
def initiate_jazzcash_payment(
    course_id: int,
    user: User = Depends(get_current_user)
):
    payment = create_jazzcash_payment_payload(
        course_id=course_id,
        user=user,
        amount_paisa=200000,  # PKR 2000
    )

    return {
        "payment_url": payment["payment_url"],
        "payload": payment["payload"],
    }

