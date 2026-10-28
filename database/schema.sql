-- Campus Club Directory database schema
-- Run this script in Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name varchar(100) not null,
  category varchar(40) not null check (category in ('Technology','Arts & Culture','Social Impact','Sports','Academic','Entrepreneurship','Other')),
  description varchar(700) not null check (char_length(trim(description)) between 10 and 700),
  meeting_details varchar(120),
  contact_email varchar(254),
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clubs_name_unique unique (name),
  constraint clubs_email_format check (contact_email is null or contact_email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  constraint clubs_tags_limit check (cardinality(tags) <= 12)
);

create index if not exists clubs_category_idx on public.clubs(category);
create index if not exists clubs_name_idx on public.clubs using btree(name);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
drop trigger if exists clubs_set_updated_at on public.clubs;
create trigger clubs_set_updated_at before update on public.clubs
for each row execute function public.set_updated_at();

-- The backend uses the server-only service role key and performs admin-token checks
-- before write operations. Enable RLS as defense in depth; no browser client is used.
alter table public.clubs enable row level security;
-- Intentionally create no anon/authenticated policies. Browser clients cannot query
-- this table directly; requests go through the Express API. Never expose service key.

-- Optional demo records (uncomment to insert). Use your own campus details in production.
-- insert into public.clubs (name, category, description, meeting_details, contact_email, tags) values
-- ('Coding Club', 'Technology', 'A community for students to learn programming, build projects, and practice problem solving.', 'Friday, 3:00 PM', 'coding@example.edu', array['coding','projects','workshops']),
-- ('Creative Arts Society', 'Arts & Culture', 'A welcoming group for students interested in visual arts, design, music, and creative collaboration.', 'Wednesday, 2:00 PM', 'arts@example.edu', array['art','design','music']),
-- ('Green Campus Initiative', 'Social Impact', 'Students work together on campus sustainability, awareness drives, and community volunteering.', 'Twice a month', 'green@example.edu', array['environment','volunteering']);
