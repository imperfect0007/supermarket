from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field


class CartItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    name: str
    price: Decimal
    category: str
    image_url: str | None
    stock: int


class CartUpsert(BaseModel):
    product_id: UUID
    quantity: int = Field(gt=0)


class CartPatch(BaseModel):
    quantity: int = Field(gt=0)
