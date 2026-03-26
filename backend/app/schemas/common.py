from uuid import UUID

from pydantic import BaseModel


class UserContext(BaseModel):
    """Authenticated user derived from JWT + public.users."""

    id: UUID
    email: str
    role: str
