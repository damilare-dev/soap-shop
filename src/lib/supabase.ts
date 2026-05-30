import { createClient } from '@supabase/supabase-js';

/*
-- Run this in your Supabase SQL editor before using the app

create table if not exists app_config (
  key text primary key,
  value text not null
);

create table if not exists reps (
  id text primary key,
  name text not null,
  pin_hash text not null,
  created_at timestamptz default now()
);

create table if not exists products (
  id text primary key,
  name text not null,
  schedule text,
  expected_qty integer default 0,
  cost_price numeric default 0,
  sell_price numeric default 0,
  stock integer default 0,
  created_at timestamptz default now()
);

create table if not exists deliveries (
  id text primary key,
  product_id text references products(id),
  qty integer not null,
  cost_per_box numeric not null,
  date text not null,
  supplier text,
  created_at timestamptz default now()
);

create table if not exists sales (
  id text primary key,
  product_id text references products(id),
  product_name text not null,
  rep_id text references reps(id),
  rep_name text not null,
  qty integer not null,
  price_per_box numeric not null,
  standard_price numeric not null,
  expected_cash numeric not null,
  cash_collected numeric not null,
  discrepancy numeric not null,
  note text default '',
  date text not null,
  time text not null,
  voided boolean default false,
  voided_by text,
  voided_at text,
  edited boolean default false,
  negotiated boolean default false,
  negotiated_price numeric,
  negotiation_reason text default '',
  created_at timestamptz default now()
);

create table if not exists audit_log (
  id text primary key,
  ts text not null,
  action text not null,
  detail text not null,
  actor text not null
);

-- Row Level Security: enable on all tables
alter table app_config enable row level security;
alter table reps enable row level security;
alter table products enable row level security;
alter table deliveries enable row level security;
alter table sales enable row level security;
alter table audit_log enable row level security;

-- Allow anon read/write for all tables (tighten later with auth)
create policy "anon_all" on app_config for all using (true) with check (true);
create policy "anon_all" on reps for all using (true) with check (true);
create policy "anon_all" on products for all using (true) with check (true);
create policy "anon_all" on deliveries for all using (true) with check (true);
create policy "anon_all" on sales for all using (true) with check (true);
create policy "anon_all" on audit_log for all using (true) with check (true);
*/

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = cloudEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;
