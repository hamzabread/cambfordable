# schemas/enrollments.py
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

class AdminEnrollRequest(BaseModel):
    user_id: int
    course_id: int


class AdminPaymentRequest(BaseModel):
    user_id: int
    course_id: int
    paid: bool


class AdminPaymentApproveRequest(BaseModel):
    user_id: int
    course_id: int


class AdminPaymentRejectRequest(BaseModel):
    user_id: int
    course_id: int
    reason: str = Field(min_length=3, max_length=500)

    @field_validator("reason", mode="before")
    @classmethod
    def strip_reason(cls, value):
        return str(value or "").strip()


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
    payment_rejection_reason: str | None = None
    enrolled_at: datetime | None = None
    proof_pending: bool = False
    paid_until: datetime | None = None
    overdue: bool = False
    pauses_on: datetime | None = None
    paused_at: datetime | None = None
    removal_on: datetime | None = None
    user: EnrollmentUserOut

    class Config:
        from_attributes = True
