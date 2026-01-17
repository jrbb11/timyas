create table public.app_users (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  email text not null,
  first_name text null,
  last_name text null,
  contact_number text null,
  created_at timestamp with time zone not null default now(),
  approved boolean null default false,
  constraint app_users_pkey primary key (id),
  constraint app_users_user_id_unique unique (user_id),
  constraint app_users_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;