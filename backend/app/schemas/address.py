from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class AddressOut(BaseModel):
    id: UUID
    user_id: UUID
    address_text: str
    label: str | None
    created_at: datetime


class AddressCreate(BaseModel):
    address_text: str = Field(min_length=3, max_length=2000)
    label: str | None = Field(default="Home", max_length=100)


class AddressUpdate(BaseModel):
    address_text: str | None = Field(default=None, min_length=3, max_length=2000)
    label: str | None = Field(default=None, max_length=100)
