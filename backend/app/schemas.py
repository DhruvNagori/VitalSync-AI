from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, model_validator


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=30)
    password: str = Field(min_length=8, max_length=128)
    role: Literal["patient", "doctor"]
    date_of_birth: date | None = None
    specialization: str | None = Field(default=None, max_length=120)
    registration_number: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validate_role_fields(self):
        if self.role == "doctor":
            if not self.specialization or not self.specialization.strip():
                raise ValueError("Specialization is required for doctors")
            if not self.registration_number or not self.registration_number.strip():
                raise ValueError("Professional registration number is required for doctors")
        return self


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    phone: str
    role: Literal["patient", "doctor"]
    date_of_birth: date | None
    specialization: str | None
    registration_number: str | None
    is_verified: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
