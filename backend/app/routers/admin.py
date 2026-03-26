"""Admin-only routes: dashboard, inventory, all orders."""

from collections import defaultdict
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..db import supabase
from ..deps import require_admin
from ..schemas.admin import DashboardOut, OrderDayPoint
from ..schemas.common import UserContext
from ..schemas.order import OrderOut, OrderStatusUpdate
from ..schemas.product import ProductCreate, ProductOut, ProductUpdate
from ..routers.orders import _load_order_with_items

router = APIRouter(prefix="/admin", tags=["admin"])

LOW_STOCK_THRESHOLD = 10


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(_admin: Annotated[UserContext, Depends(require_admin)]):
    u = supabase.table("users").select("id", count="exact").execute()
    o = supabase.table("orders").select("id", count="exact").execute()

    delivered = (
        supabase.table("orders")
        .select("total_price")
        .eq("status", "delivered")
        .execute()
    )
    revenue = sum(float(r["total_price"]) for r in (delivered.data or []))

    low = (
        supabase.table("products")
        .select("id", count="exact")
        .lt("stock", LOW_STOCK_THRESHOLD)
        .execute()
    )

    return DashboardOut(
        total_users=u.count or 0,
        total_orders=o.count or 0,
        revenue_delivered=revenue,
        low_stock_count=low.count or 0,
    )


@router.get("/analytics/orders-per-day", response_model=list[OrderDayPoint])
def orders_per_day(_admin: Annotated[UserContext, Depends(require_admin)]):
    since = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    res = (
        supabase.table("orders")
        .select("created_at, status")
        .gte("created_at", since)
        .execute()
    )
    counts: dict[str, int] = defaultdict(int)
    for r in res.data or []:
        if r.get("status") == "cancelled":
            continue
        d = str(r["created_at"])[:10]
        counts[d] += 1
    return [OrderDayPoint(date=k, orders=v) for k, v in sorted(counts.items())]


@router.get("/products", response_model=list[ProductOut])
def admin_list_products(_admin: Annotated[UserContext, Depends(require_admin)]):
    res = supabase.table("products").select("*").order("created_at", desc=True).execute()
    return [ProductOut.model_validate(r) for r in (res.data or [])]


@router.get("/products/low-stock", response_model=list[ProductOut])
def low_stock(_admin: Annotated[UserContext, Depends(require_admin)]):
    res = (
        supabase.table("products")
        .select("*")
        .lt("stock", LOW_STOCK_THRESHOLD)
        .order("stock")
        .execute()
    )
    return [ProductOut.model_validate(r) for r in (res.data or [])]


@router.post("/products", response_model=ProductOut)
def admin_create_product(
    body: ProductCreate,
    _admin: Annotated[UserContext, Depends(require_admin)],
):
    ins = supabase.table("products").insert(body.model_dump(mode="json")).execute()
    return ProductOut.model_validate(ins.data[0])


@router.patch("/products/{product_id}", response_model=ProductOut)
def admin_update_product(
    product_id: UUID,
    body: ProductUpdate,
    _admin: Annotated[UserContext, Depends(require_admin)],
):
    patch = {k: v for k, v in body.model_dump(mode="json").items() if v is not None}
    if not patch:
        existing = (
            supabase.table("products").select("*").eq("id", str(product_id)).single().execute()
        )
        if not existing.data:
            raise HTTPException(status_code=404, detail="Product not found")
        return ProductOut.model_validate(existing.data)

    res = supabase.table("products").update(patch).eq("id", str(product_id)).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductOut.model_validate(res.data[0])


@router.delete("/products/{product_id}")
def admin_delete_product(
    product_id: UUID,
    _admin: Annotated[UserContext, Depends(require_admin)],
):
    used = (
        supabase.table("order_items")
        .select("id")
        .eq("product_id", str(product_id))
        .limit(1)
        .execute()
    )
    if used.data:
        raise HTTPException(status_code=409, detail="Product appears in past orders; keep history")

    supabase.table("cart").delete().eq("product_id", str(product_id)).execute()
    supabase.table("products").delete().eq("id", str(product_id)).execute()
    return {"ok": True}


@router.get("/orders", response_model=list[OrderOut])
def admin_list_orders(_admin: Annotated[UserContext, Depends(require_admin)]):
    res = supabase.table("orders").select("*").order("created_at", desc=True).execute()
    return [_load_order_with_items(r) for r in (res.data or [])]


@router.patch("/orders/{order_id}/status", response_model=OrderOut)
def admin_update_status(
    order_id: UUID,
    body: OrderStatusUpdate,
    _admin: Annotated[UserContext, Depends(require_admin)],
):
    existing = supabase.table("orders").select("*").eq("id", str(order_id)).single().execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Order not found")
    res = (
        supabase.table("orders")
        .update({"status": body.status})
        .eq("id", str(order_id))
        .execute()
    )
    return _load_order_with_items(res.data[0])
