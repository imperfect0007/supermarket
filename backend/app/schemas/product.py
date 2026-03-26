from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

Category = Literal["Vegetables", "Fruits", "Dairy", "Snacks"]


class ProductOut(BaseModel):
    id: UUID
    name: str
    price: Decimal
    category: str
    stock: int
    image_url: str | None = None
    created_at: datetime | None = None


class ProductCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    price: Decimal = Field(ge=0)
    category: Category
    stock: int = Field(ge=0, default=0)
    image_url: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    price: Decimal | None = Field(default=None, ge=0)
    category: Category | None = None
    stock: int | None = Field(default=None, ge=0)
    image_url: str | None = None


class ProductPage(BaseModel):
    items: list[ProductOut]
    total: int
    page: int
    page_size: int
