"""Supabase client (service role) for server-side database access."""

from supabase import Client, create_client

from .config import get_settings, validate_env

validate_env()
_settings = get_settings()
supabase: Client = create_client(_settings["supabase_url"], _settings["service_role_key"])
