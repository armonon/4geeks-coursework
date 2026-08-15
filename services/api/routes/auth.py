"""Authentication endpoints — login and whoami.

Stateless JWT only. POST /auth/login accepts either an OAuth2 form
(so Swagger UI's Authorize button works) or a JSON body.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Request, status

from models import LoginRequest, MeOut, Token, UserInDB
from security import (
    access_token_expire_minutes,
    create_access_token,
    get_current_user,
    verify_password,
)
from services_users import get_profile_by_user_id, get_user_by_email

router = APIRouter(prefix="/auth", tags=["auth"])

# One message for both "no such email" and "wrong password" — telling
# them apart lets an attacker enumerate registered accounts.
_BAD_CREDENTIALS = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Incorrect email or password",
    headers={"WWW-Authenticate": "Bearer"},
)


async def _read_credentials(request: Request) -> tuple[str, str]:
    """Pull (email, password) out of either accepted body shape.

    Swagger UI's Authorize dialog posts an OAuth2 form with `username`
    and `password`. The frontend posts JSON with `email` and
    `password`. Supporting both keeps the interactive docs usable
    without forcing the client into form encoding.
    """
    content_type = (request.headers.get("content-type") or "").lower()

    if content_type.startswith("application/json"):
        raw = await request.body()
        try:
            parsed = LoginRequest.model_validate_json(raw)
        except Exception as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid login body: {exc}",
            ) from exc
        return parsed.email, parsed.password

    form = await request.form()
    email = str(form.get("username") or "").strip().lower()
    password = str(form.get("password") or "")
    return email, password


@router.post("/login", response_model=Token, summary="Log in, get a JWT")
async def login(request: Request) -> Token:
    """Validate credentials and return a signed access token."""
    email, password = await _read_credentials(request)

    if not email or not password:
        raise _BAD_CREDENTIALS

    user = get_user_by_email(email)
    if user is None or not verify_password(password, user.hashed_password):
        raise _BAD_CREDENTIALS

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account is deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user_id=user.id, role=user.role)
    return Token(
        access_token=token,
        token_type="bearer",
        expires_in=access_token_expire_minutes() * 60,
    )


@router.get("/me", response_model=MeOut, summary="Who am I (protected)")
def read_me(caller: UserInDB = Depends(get_current_user)) -> MeOut:
    """Return the caller's credentials plus their linked profile."""
    return MeOut(
        id=caller.id,
        email=caller.email,
        role=caller.role,
        is_active=caller.is_active,
        profile=get_profile_by_user_id(caller.id),
    )
