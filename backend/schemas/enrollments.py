# schemas/enrollments.py
from pydantic import BaseModel

class AdminEnrollRequest(BaseModel):
    user_id: int
    course_id: int


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
    user: EnrollmentUserOut

    class Config:
        from_attributes = True
