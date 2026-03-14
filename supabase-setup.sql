-- ===== Supabase Database Setup for Prakash Machinery Store =====
-- Run this SQL in the Supabase SQL Editor (supabase.com/dashboard → SQL Editor)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ===== PRODUCTS TABLE =====
create table products (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  category text,
  brand text,
  price numeric,
  mrp numeric,
  images text[] default '{}',
  in_stock boolean default true,
  specifications jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table products enable row level security;

-- Everyone can read products
create policy "Products are viewable by everyone"
  on products for select using (true);

-- Only authenticated users can insert/update/delete (we check owner in app)
create policy "Authenticated users can manage products"
  on products for all using (auth.role() = 'authenticated');

-- ===== ORDERS TABLE =====
create table orders (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  customer_name text,
  customer_email text,
  items jsonb default '[]',
  total numeric,
  status text default 'new',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table orders enable row level security;

-- Users can view their own orders, owner can view all
create policy "Users can view own orders"
  on orders for select using (auth.uid() = user_id);

create policy "Authenticated users can insert orders"
  on orders for insert with check (auth.role() = 'authenticated');

create policy "Authenticated users can update orders"
  on orders for update using (auth.role() = 'authenticated');

-- ===== WISHLISTS TABLE =====
create table wishlists (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null,
  product_id uuid not null references products(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

alter table wishlists enable row level security;

create policy "Users can manage own wishlists"
  on wishlists for all using (auth.uid() = user_id);

-- ===== CATEGORIES TABLE =====
create table categories (
  id uuid default uuid_generate_v4() primary key,
  name text not null unique,
  icon text default '',
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table categories enable row level security;

create policy "Categories are viewable by everyone"
  on categories for select using (true);

create policy "Authenticated users can manage categories"
  on categories for all using (auth.role() = 'authenticated');

-- Seed default categories
insert into categories (name, sort_order) values
  ('INGCO Tools', 1),
  ('Welding Machines', 2),
  ('Cutting Wheels', 3),
  ('Angle Grinders', 4),
  ('Power Tools', 5),
  ('Machinery Equipment', 6);
-- ===== STORAGE BUCKET =====
-- Do this in the Supabase Dashboard (not in SQL Editor):
-- 1. Go to Storage → New Bucket
-- 2. Name: product-images
-- 3. Check "Public bucket" → Create
-- 4. Click on the bucket → Policies → New Policy → Allow all for select (public read)
-- 5. Add another policy → Allow authenticated users for insert

-- ===== LEADS TABLE =====
create table leads (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid,
  name text,
  firm_name text,
  phone text,
  address text,
  country text,
  item_enquired text,
  created_at timestamptz default now()
);

alter table leads enable row level security;

-- Authenticated users (admin) can view all leads
create policy "Authenticated users can view leads"
  on leads for select using (auth.role() = 'authenticated');

-- Anyone can insert leads (public capture)
create policy "Anyone can insert leads"
  on leads for insert with check (true);
-- ===== UPDATES =====
-- Add new columns to products table (Safe for existing data)
ALTER TABLE products ADD COLUMN IF NOT EXISTS return_policy_days int DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS terms_conditions text DEFAULT '';
