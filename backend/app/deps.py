"""
Authentication helpers for Supabase-backed JWT and role resolution.
"""

from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError

from .config import get_settings
from .db import supabase
from .schemas.common import UserContext

bearer_scheme = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict:
    secret = get_settings()["jwt_secret"]
    try:
        return jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
    except PyJWTError:
        return {}


def _resolve_identity(token: str) -> tuple[str, str | None]:
    """Resolve user id/email from token via JWT or Supabase Auth fallback."""
    payload = _decode_token(token)
    user_id = payload.get("sub")
    email = payload.get("email")
    if user_id:
        return str(user_id), str(email) if email else None
    try:
        auth_res = supabase.auth.get_user(token)
        user = getattr(auth_res, "user", None)
        if user and getattr(user, "id", None):
            return str(user.id), getattr(user, "email", None)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e
    raise HTTPException(status_code=401, detail="Invalid token payload")


async def get_optional_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> UserContext | None:
    """Returns UserContext if a valid Bearer token is present, else None."""
    if creds is None or creds.scheme.lower() != "bearer":
        return None
    user_id, token_email = _resolve_identity(creds.credentials)
    res = supabase.table("users").select("id, email, role").eq("id", user_id).execute()
    row = (res.data or [None])[0]
    if not row and token_email:
        # First-login provisioning for users missing a profile row in public.users.
        supabase.table("users").insert({"id": user_id, "email": token_email, "role": "user"}).execute()
        res = supabase.table("users").select("id, email, role").eq("id", user_id).execute()
        row = (res.data or [None])[0]
    if not row:
        raise HTTPException(status_code=401, detail="User not registered")
    return UserContext(
        id=UUID(str(row["id"])),
        email=str(row["email"]),
        role=str(row["role"]),
    )


async def get_current_user(user: Annotated[UserContext | None, Depends(get_optional_user)]) -> UserContext:
    if user is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user


async def require_admin(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
