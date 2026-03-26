"""
Authentication: verify Supabase JWT (HS256) and load role from public.users.
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
    except PyJWTError as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token") from e


async def get_optional_user(
    creds: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
) -> UserContext | None:
    """Returns UserContext if a valid Bearer token is present, else None."""
    if creds is None or creds.scheme.lower() != "bearer":
        return None
    payload = _decode_token(creds.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    res = supabase.table("users").select("id, email, role").eq("id", user_id).single().execute()
    row = res.data
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
