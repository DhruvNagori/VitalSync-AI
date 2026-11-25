from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .database import get_db
from .models import User
from .schemas import AuthResponse, LoginRequest, RegisterRequest, UserResponse
from .security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)


router = APIRouter(prefix="/api/v1/auth", tags=["authentication"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(
    request: RegisterRequest,
    database: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    email = request.email.lower().strip()
    existing_user = database.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    registration_number = (
        request.registration_number.strip().upper()
        if request.registration_number
        else None
    )
    if registration_number:
        existing_registration = database.scalar(
            select(User).where(User.registration_number == registration_number)
        )
        if existing_registration is not None:
            raise HTTPException(
                status_code=409,
                detail="This professional registration number is already registered.",
            )

    user = User(
        name=request.name.strip(),
        email=email,
        phone=request.phone.strip(),
        password_hash=hash_password(request.password),
        role=request.role,
        date_of_birth=request.date_of_birth if request.role == "patient" else None,
        specialization=(
            request.specialization.strip() if request.role == "doctor" else None
        ),
        registration_number=registration_number,
        is_verified=request.role == "patient",
    )
    database.add(user)
    try:
        database.commit()
    except IntegrityError as exc:
        database.rollback()
        raise HTTPException(status_code=409, detail="Account details already exist.") from exc
    database.refresh(user)

    return AuthResponse(
        access_token=create_access_token(user.id),
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    database: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    email = request.email.lower().strip()
    user = database.scalar(select(User).where(User.email == email))
    if user is None or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return AuthResponse(
        access_token=create_access_token(user.id, request.remember_me),
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    return UserResponse.model_validate(current_user)
