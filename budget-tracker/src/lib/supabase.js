import { createClient } from '@supabase/supabase-js';

/*
-- Run this in your Supabase SQL editor before using the app

create table if not exists budget_data (
  id text primary key,
  data text not null,
  updated_at timestamptz default now()
);

alter table budget_data enable row level security;

-- No auth — anyone with the site URL shares this one budget.
create policy "anon_all" on budget_data for all using (true) with check (true);
*/

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const cloudEnabled = Boolean(supabaseUrl && supabaseAnonKey);
export const supabase = cloudEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null;
