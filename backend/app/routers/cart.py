"""Authenticated shopping cart (REST)."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..db import supabase
from ..deps import get_current_user
from ..schemas.cart import CartItemOut, CartPatch, CartUpsert
from ..schemas.common import UserContext

router = APIRouter(prefix="/cart", tags=["cart"])


def _row_to_cart_item(row: dict, product: dict) -> CartItemOut:
    return CartItemOut(
        id=UUID(str(row["id"])),
        product_id=UUID(str(row["product_id"])),
        quantity=int(row["quantity"]),
        name=product["name"],
        price=product["price"],
        category=product["category"],
        image_url=product.get("image_url"),
        stock=int(product["stock"]),
    )


@router.get("", response_model=list[CartItemOut])
def get_cart(user: Annotated[UserContext, Depends(get_current_user)]):
    cart_res = supabase.table("cart").select("*").eq("user_id", str(user.id)).execute()
    rows = cart_res.data or []
    if not rows:
        return []
    out: list[CartItemOut] = []
    for row in rows:
        p = (
            supabase.table("products")
            .select("*")
            .eq("id", row["product_id"])
            .single()
            .execute()
        )
        if not p.data:
            continue
        out.append(_row_to_cart_item(row, p.data))
    return out


@router.post("", response_model=list[CartItemOut])
def upsert_cart_item(
    body: CartUpsert,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    """Add or replace quantity for a product line."""
    prod = (
        supabase.table("products")
        .select("*")
        .eq("id", str(body.product_id))
        .single()
        .execute()
    )
    if not prod.data:
        raise HTTPException(status_code=404, detail="Product not found")
    if body.quantity > int(prod.data["stock"]):
        raise HTTPException(status_code=400, detail="Not enough stock")

    existing = (
        supabase.table("cart")
        .select("*")
        .eq("user_id", str(user.id))
        .eq("product_id", str(body.product_id))
        .limit(1)
        .execute()
    )

    if existing.data:
        row0 = existing.data[0]
        supabase.table("cart").update({"quantity": body.quantity}).eq("id", row0["id"]).execute()
    else:
        supabase.table("cart").insert(
            {
                "user_id": str(user.id),
                "product_id": str(body.product_id),
                "quantity": body.quantity,
            }
        ).execute()

    return get_cart(user)


@router.patch("/{cart_id}", response_model=list[CartItemOut])
def patch_cart_line(
    cart_id: UUID,
    body: CartPatch,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    row = supabase.table("cart").select("*").eq("id", str(cart_id)).single().execute()
    if not row.data or str(row.data["user_id"]) != str(user.id):
        raise HTTPException(status_code=404, detail="Cart line not found")

    prod = (
        supabase.table("products")
        .select("*")
        .eq("id", row.data["product_id"])
        .single()
        .execute()
    )
    if not prod.data:
        raise HTTPException(status_code=400, detail="Product missing")
    if body.quantity > int(prod.data["stock"]):
        raise HTTPException(status_code=400, detail="Not enough stock")

    supabase.table("cart").update({"quantity": body.quantity}).eq("id", str(cart_id)).execute()
    return get_cart(user)


@router.delete("/{cart_id}", response_model=list[CartItemOut])
def delete_cart_line(
    cart_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    row = (
        supabase.table("cart")
        .select("id, user_id")
        .eq("id", str(cart_id))
        .limit(1)
        .execute()
    )
    r0 = row.data[0] if row.data else None
    if not r0 or str(r0["user_id"]) != str(user.id):
        raise HTTPException(status_code=404, detail="Cart line not found")
    supabase.table("cart").delete().eq("id", str(cart_id)).execute()
    return get_cart(user)


@router.delete("", response_model=list[CartItemOut])
def clear_cart(user: Annotated[UserContext, Depends(get_current_user)]):
    supabase.table("cart").delete().eq("user_id", str(user.id)).execute()
    return []
