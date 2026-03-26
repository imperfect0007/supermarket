from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

OrderStatus = Literal["pending", "delivered", "cancelled"]


class OrderItemOut(BaseModel):
    id: UUID
    product_id: UUID
    quantity: int
    unit_price: Decimal
    product_name: str | None = None


class OrderOut(BaseModel):
    id: UUID
    user_id: UUID
    total_price: Decimal
    status: str
    delivery_address_text: str | None
    created_at: datetime
    items: list[OrderItemOut] = []


class OrderCreateBody(BaseModel):
    """Place order from server cart; optional address_id resolves address_text."""

    address_id: UUID | None = None


class OrderStatusUpdate(BaseModel):
    status: OrderStatus
