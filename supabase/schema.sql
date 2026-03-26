-- Supermarket mini project — Supabase PostgreSQL schema
-- Run in Supabase SQL Editor after creating a project.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.users — mirrors Auth users; role drives admin vs customer
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'user' check (role in ('admin', 'user')),
  created_at timestamptz not null default now()
);

-- New Auth user → row in public.users
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role)
  values (new.id, new.email, 'user')
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user ();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  price numeric(12, 2) not null check (price >= 0),
  category text not null check (
    category in ('Vegetables', 'Fruits', 'Dairy', 'Snacks')
  ),
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_products_category on public.products (category);

-- ---------------------------------------------------------------------------
-- cart (server-side cart per user)
-- ---------------------------------------------------------------------------
create table if not exists public.cart (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unique (user_id, product_id)
);

create index if not exists idx_cart_user on public.cart (user_id);

-- ---------------------------------------------------------------------------
-- addresses
-- ---------------------------------------------------------------------------
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  address_text text not null,
  label text default 'Home',
  created_at timestamptz not null default now()
);

create index if not exists idx_addresses_user on public.addresses (user_id);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  total_price numeric(12, 2) not null default 0 check (total_price >= 0),
  status text not null default 'pending' check (
    status in ('pending', 'delivered', 'cancelled')
  ),
  delivery_address_text text,
  created_at timestamptz not null default now()
);

create index if not exists idx_orders_user on public.orders (user_id);
create index if not exists idx_orders_created on public.orders (created_at);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid (),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0)
);

create index if not exists idx_order_items_order on public.order_items (order_id);

-- ---------------------------------------------------------------------------
-- RLS — optional when using only FastAPI + service role (bypasses RLS).
-- Enable if you query tables from the browser with the anon key.
-- ---------------------------------------------------------------------------
alter table public.users enable row level security;
alter table public.products enable row level security;
alter table public.cart enable row level security;
alter table public.addresses enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Deny by default from PostgREST; backend uses service_role and bypasses these.

-- ---------------------------------------------------------------------------
-- Storage bucket for product images (public read)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Authenticated users can upload product images
create policy "product-images insert authenticated"
on storage.objects for insert to authenticated
with check (bucket_id = 'product-images');

create policy "product-images public read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product-images update own"
on storage.objects for update to authenticated
using (bucket_id = 'product-images');

create policy "product-images delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'product-images');

-- ---------------------------------------------------------------------------
-- Seed sample products (optional)
-- ---------------------------------------------------------------------------
insert into public.products (name, price, category, stock, image_url)
values
  ('Tomatoes', 2.49, 'Vegetables', 40, null),
  ('Bananas', 1.99, 'Fruits', 60, null),
  ('Milk 1L', 3.29, 'Dairy', 30, null),
  ('Potato Chips', 4.49, 'Snacks', 25, null);

-- ---------------------------------------------------------------------------
-- Promote your admin account (run AFTER you sign up once in Auth)
-- replace the email below
-- ---------------------------------------------------------------------------
-- update public.users set role = 'admin' where email = 'you@example.com';
