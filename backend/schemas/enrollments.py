# schemas/enrollments.py
from datetime import datetime

from pydantic import BaseModel

class AdminEnrollRequest(BaseModel):
    user_id: int
    course_id: int
    paid: bool = False


class AdminPaymentRequest(BaseModel):
    user_id: int
    course_id: int
    paid: bool


class EnrollmentUserOut(BaseModel):
    id: int
    username: str
    full_name: str | None = None
    email: str

    class Config:
        from_attributes = True


class EnrollmentPaymentOut(BaseModel):
    user_id: int
    course_id: int
    paid: bool
    payment_proof_url: str | None = None
    payment_proof_name: str | None = None
    payment_uploaded_at: datetime | None = None
    user: EnrollmentUserOut

    class Config:
        from_attributes = True
