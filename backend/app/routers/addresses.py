"""User delivery addresses."""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..db import supabase
from ..deps import get_current_user
from ..schemas.address import AddressCreate, AddressOut, AddressUpdate
from ..schemas.common import UserContext

router = APIRouter(prefix="/addresses", tags=["addresses"])


@router.get("", response_model=list[AddressOut])
def list_addresses(user: Annotated[UserContext, Depends(get_current_user)]):
    res = (
        supabase.table("addresses")
        .select("*")
        .eq("user_id", str(user.id))
        .order("created_at", desc=True)
        .execute()
    )
    return [AddressOut.model_validate(r) for r in (res.data or [])]


@router.post("", response_model=AddressOut)
def create_address(
    body: AddressCreate,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    ins = (
        supabase.table("addresses")
        .insert(
            {
                "user_id": str(user.id),
                "address_text": body.address_text,
                "label": body.label or "Home",
            }
        )
        .execute()
    )
    row = ins.data[0]
    return AddressOut.model_validate(row)


@router.patch("/{address_id}", response_model=AddressOut)
def update_address(
    address_id: UUID,
    body: AddressUpdate,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    existing = (
        supabase.table("addresses")
        .select("*")
        .eq("id", str(address_id))
        .single()
        .execute()
    )
    if not existing.data or str(existing.data["user_id"]) != str(user.id):
        raise HTTPException(status_code=404, detail="Address not found")

    patch = {k: v for k, v in body.model_dump().items() if v is not None}
    if not patch:
        return AddressOut.model_validate(existing.data)

    res = supabase.table("addresses").update(patch).eq("id", str(address_id)).execute()
    return AddressOut.model_validate(res.data[0])


@router.delete("/{address_id}")
def delete_address(
    address_id: UUID,
    user: Annotated[UserContext, Depends(get_current_user)],
):
    existing = (
        supabase.table("addresses")
        .select("id, user_id")
        .eq("id", str(address_id))
        .limit(1)
        .execute()
    )
    row = existing.data[0] if existing.data else None
    if not row or str(row["user_id"]) != str(user.id):
        raise HTTPException(status_code=404, detail="Address not found")
    supabase.table("addresses").delete().eq("id", str(address_id)).execute()
    return {"ok": True}
