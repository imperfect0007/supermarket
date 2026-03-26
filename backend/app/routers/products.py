"""Public product catalog with pagination, search, and category filter."""

from typing import Annotated

from fastapi import APIRouter, Query

from ..db import supabase
from ..schemas.product import ProductOut, ProductPage

router = APIRouter(prefix="/products", tags=["products"])

VALID_CATEGORIES = {"Vegetables", "Fruits", "Dairy", "Snacks"}


@router.get("", response_model=ProductPage)
def list_products(
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=50)] = 12,
    search: Annotated[str | None, Query()] = None,
    category: Annotated[str | None, Query()] = None,
):
    if category and category not in VALID_CATEGORIES:
        from fastapi import HTTPException

        raise HTTPException(status_code=400, detail="Invalid category")

    start = (page - 1) * page_size
    end = start + page_size - 1

    q = supabase.table("products").select("*", count="exact")
    if category:
        q = q.eq("category", category)
    if search:
        q = q.ilike("name", f"%{search}%")
    q = q.order("created_at", desc=True)
    res = q.range(start, end).execute()

    items = [ProductOut.model_validate(r) for r in (res.data or [])]
    total = res.count or 0
    return ProductPage(items=items, total=total, page=page, page_size=page_size)
