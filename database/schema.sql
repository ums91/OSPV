-- OMER commerce schema
-- PostgreSQL
create table if not exists products (
  id text primary key,
  title text not null,
  type text not null check (type in ('Fine Art Print','Postcard')),
  price_inr integer not null check (price_inr >= 0),
  edition text,
  size text,
  image_url text,
  description text,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'created',
  currency text not null default 'INR',
  subtotal_inr integer not null,
  shipping_inr integer not null default 0,
  total_inr integer not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  shipping_address jsonb,
  payment_provider text,
  provider_order_id text,
  provider_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create table if not exists order_items (
  id bigserial primary key,
  order_id uuid not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  title_snapshot text not null,
  price_inr integer not null,
  quantity integer not null check (quantity > 0)
);

create table if not exists newsletter_subscribers (
  email text primary key,
  created_at timestamptz not null default now()
);

create index if not exists orders_status_idx on orders(status);
create index if not exists orders_created_at_idx on orders(created_at);
create index if not exists order_items_order_idx on order_items(order_id);
