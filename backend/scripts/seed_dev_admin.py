"""
Create the local/dev admin account in Supabase Auth + public.users.

Default credentials:
  Email:    admin@admin.com
  Password: admin@12

You can override with env vars before running:
  ADMIN_EMAIL=you@example.com
  ADMIN_PASSWORD=strong_password

Requires backend/.env with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
Safe to run multiple times: updates password + role if the user already exists.

Do not use these credentials in production.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

EMAIL = os.getenv("ADMIN_EMAIL", "admin@admin.com").strip()
PASSWORD = os.getenv("ADMIN_PASSWORD", "admin@12").strip()

_backend_root = Path(__file__).resolve().parent.parent
load_dotenv(_backend_root / ".env", override=True)


def _find_auth_user_id(sb, email: str) -> str | None:
    page = 1
    per_page = 200
    while True:
        users = sb.auth.admin.list_users(page=page, per_page=per_page)
        if not users:
            return None
        for u in users:
            if (u.email or "").lower() == email.lower():
                return u.id
        if len(users) < per_page:
            return None
        page += 1


def main() -> None:
    url = os.getenv("SUPABASE_URL", "").strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    if not url or not key:
        print("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in backend/.env", file=sys.stderr)
        sys.exit(1)
    if not EMAIL or not PASSWORD:
        print("ADMIN_EMAIL and ADMIN_PASSWORD must be non-empty.", file=sys.stderr)
        sys.exit(1)

    sb = create_client(url, key)
    uid: str | None = None

    try:
        created = sb.auth.admin.create_user(
            {
                "email": EMAIL,
                "password": PASSWORD,
                "email_confirm": True,
            }
        )
        uid = created.user.id
        print(f"Created Auth user {EMAIL}")
    except Exception as e:  # noqa: BLE001
        uid = _find_auth_user_id(sb, EMAIL)
        if not uid:
            print(f"Could not create user and no existing Auth user matched {EMAIL}.", file=sys.stderr)
            print(e, file=sys.stderr)
            sys.exit(1)
        sb.auth.admin.update_user_by_id(
            uid,
            {"password": PASSWORD, "email_confirm": True},
        )
        print(f"Auth user {EMAIL} already existed; password updated and email confirmed.")

    sb.table("users").update({"role": "admin"}).eq("email", EMAIL).execute()
    print(f"public.users.role set to admin for {EMAIL}")
    print("You can sign in on the frontend with the email and password above.")


if __name__ == "__main__":
    main()
