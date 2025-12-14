from pydantic import BaseModel
from typing import Optional


class Token(BaseModel):
    """
    Response returned after successful login
    """
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    """
    Data stored inside the JWT
    """
    sub: Optional[str] = None
