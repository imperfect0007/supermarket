"""Customer orders: place from cart and view history."""

from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..db import supabase
from ..deps import get_current_user
from ..schemas.common import UserContext
from ..schemas.order import OrderCreateBody, OrderItemOut, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


def _load_order_with_items(order_row: dict) -> OrderOut:
    items_res = supabase.table("order_items").select("*").eq("order_id", order_row["id"]).execute()
    items: list[OrderItemOut] = []
    for it in items_res.data or []:
        pname = None
        pn = (
            supabase.table("products")
            .select("name")
            .eq("id", it["product_id"])
            .limit(1)
            .execute()
        )
        if pn.data:
            pname = pn.data[0].get("name")
        items.append(
            OrderItemOut(
                id=UUID(str(it["id"])),
                product_id=UUID(str(it["product_id"])),
                quantity=int(it["quantity"]),
                unit_price=Decimal(str(it["unit_price"])),
                product_name=pname,
            )
        )
    return OrderOut(
        id=UUID(str(order_row["id"])),
        user_id=UUID(str(order_row["user_id"])),
        total_price=Decimal(str(order_row["total_price"])),
        status=str(order_row["status"]),
        delivery_address_text=order_row.get("delivery_address_text"),
        created_at=order_row["created_at"],
        items=items,
    )


@router.get("", response_model=list[OrderOut])
def my_orders(user: Annotated[UserContext, Depends(get_current_user)]):
    res = (
        supabase.table("orders")
        .select("*")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return [_load_order_with_items(r) for r in (res.data or [])]


@router.get("/{order_id}", response_model=OrderOut)
def get_order(
    order_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    res = supabase.table("orders").select("*").eq("id", str(order_id)).single().execute()
    if not res.data or str(res.data["user_id"]) != str(user.id):
        raise HTTPException(status_code=404, detail="Order not found")
    return _load_order_with_items(res.data)


@router.post("", response_model=OrderOut)
def place_order(
    body: OrderCreateBody,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """
    Converts the current server cart into an order, decrements stock, clears cart.
    """
    cart_res = supabase.table("cart").select("*").eq("user_id", str(user.id)).execute()
    lines = cart_res.data or []
    if not lines:
        raise HTTPException(status_code=400, detail="Cart is empty")

    delivery_text: str | None = None
    if body.address_id:
        addr = (
            supabase.table("addresses")
            .select("*")
            .eq("id", str(body.address_id))
            .single()
            .execute()
        )
        if not addr.data or str(addr.data["user_id"]) != str(user.id):
            raise HTTPException(status_code=404, detail="Address not found")
        delivery_text = addr.data["address_text"]

    # Load products and validate stock; compute total
    total = Decimal("0")
    prepared: list[dict] = []
    for line in lines:
        pid = line["product_id"]
        qty = int(line["quantity"])
        p = supabase.table("products").select("*").eq("id", pid).single().execute()
        if not p.data:
            raise HTTPException(status_code=400, detail="Cart references missing product")
        stock = int(p.data["stock"])
        if qty > stock:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {p.data['name']}",
            )
        price = Decimal(str(p.data["price"]))
        total += price * qty
        prepared.append({"line": line, "product": p.data, "qty": qty, "price": price})

    # Create order
    order_ins = (
        supabase.table("orders")
        .insert(
            {
                "user_id": str(user.id),
                "total_price": float(total),
                "status": "pending",
                "delivery_address_text": delivery_text,
            }
        )
        .execute()
    )
    order_row = order_ins.data[0]
    order_id = order_row["id"]

    try:
        for row in prepared:
            supabase.table("order_items").insert(
                {
                    "order_id": order_id,
                    "product_id": row["product"]["id"],
                    "quantity": row["qty"],
                    "unit_price": float(row["price"]),
                }
            ).execute()
            new_stock = int(row["product"]["stock"]) - row["qty"]
            supabase.table("products").update({"stock": new_stock}).eq(
                "id", row["product"]["id"]
            ).execute()

        supabase.table("cart").delete().eq("user_id", str(user.id)).execute()
    except Exception:
        # Mini-project: manual cleanup is expensive; surface error
        raise HTTPException(
            status_code=500,
            detail="Order failed mid-flight; please verify cart and retry",
        ) from None

    fresh = supabase.table("orders").select("*").eq("id", order_id).single().execute()
    return _load_order_with_items(fresh.data)


@router.get("/analytics/mine/daily")
def my_orders_daily(user: Annotated[UserContext, Depends(get_current_user)]):
    """Simple chart data for the signed-in user (bonus)."""
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    res = (
        supabase.table("orders")
        .select("created_at")
        .eq("user_id", str(user.id))
        .gte("created_at", since)
        .execute()
    )
    buckets: dict[str, int] = {}
    for r in res.data or []:
        d = str(r["created_at"])[:10]
        buckets[d] = buckets.get(d, 0) + 1
    return [{"date": k, "orders": v} for k, v in sorted(buckets.items())]
