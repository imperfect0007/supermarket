"""Auth helper: resolve current profile (role) from JWT."""

from typing import Annotated

from fastapi import APIRouter, Depends

from ..deps import get_current_user
from ..schemas.common import UserContext

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", response_model=UserContext)
def me(user: Annotated[UserContext, Depends(get_current_user)]):
    """Returns id, email, and role after Supabase JWT validation."""
    return user
