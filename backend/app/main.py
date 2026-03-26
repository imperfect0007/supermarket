"""FastAPI entrypoint: modular routers, CORS, Supabase JWT auth.

AuthZ model:
- Public routes (e.g. GET /products) have no Bearer token.
- User routes depend on ``get_current_user`` (valid JWT + row in public.users).
- Admin routes depend on ``require_admin`` (JWT + role == "admin").
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import admin, addresses, auth, cart, orders, products

settings = get_settings()

app = FastAPI(title="Supermarket API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings["frontend_origins"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(cart.router)
app.include_router(orders.router)
app.include_router(addresses.router)
app.include_router(admin.router)


@app.get("/health")
def health():
    return {"status": "ok"}
