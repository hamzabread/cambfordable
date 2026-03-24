from pydantic import BaseModel, Field
from typing import Optional

class SetWhatsAppInviteLinkRequest(BaseModel):
    """Request to set the manual WhatsApp group invite link for a course"""
    whatsapp_invite_link: str = Field(..., description="WhatsApp group invite link (e.g., https://chat.whatsapp.com/ABC123)")

    class Config:
        json_schema_extra = {
            "example": {
                "whatsapp_invite_link": "https://chat.whatsapp.com/ABC123XYZ"
            }
        }

class UpdateUserPhoneRequest(BaseModel):
    """Request to update user phone number"""
    phone_number: str = Field(..., description="Phone number with country code (e.g., +92333123456)")

    class Config:
        json_schema_extra = {
            "example": {
                "phone_number": "+92333123456"
            }
        }

class CourseOutWithWhatsApp(BaseModel):
    """Course with WhatsApp invite link"""
    id: int
    name: str
    code: str
    whatsapp_invite_link: Optional[str]

    class Config:
        from_attributes = True
