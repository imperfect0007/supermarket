"""Application configuration loaded from environment variables."""

import os
from functools import lru_cache
from pathlib import Path

from dotenv import load_dotenv

# Load backend/.env and override pre-set OS vars (avoids stale SUPABASE_URL=http://localhost etc.).
_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env", override=True)


@lru_cache
def get_settings():
    """Cached settings singleton for dependency injection."""
    origins_raw = os.getenv(
        "FRONTEND_ORIGINS",
        "http://localhost:5173,http://localhost:5174",
    )
    origins = [o.strip() for o in origins_raw.split(",") if o.strip()]
    return {
        "supabase_url": os.getenv("SUPABASE_URL", ""),
        "service_role_key": os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        "jwt_secret": os.getenv("SUPABASE_JWT_SECRET", ""),
        "frontend_origins": origins or ["http://localhost:5173"],
        "port": int(os.getenv("PORT", "8000")),
    }


def validate_env():
    """Fail fast if required secrets are missing."""
    s = get_settings()
    missing = []
    if not s["supabase_url"]:
        missing.append("SUPABASE_URL")
    if not s["service_role_key"]:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if not s["jwt_secret"]:
        missing.append("SUPABASE_JWT_SECRET")
    if missing:
        raise RuntimeError(f"Missing environment variables: {', '.join(missing)}")
