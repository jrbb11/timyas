create table public.role_permissions (
  id uuid not null default gen_random_uuid (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_unique unique (role_id, permission_id),
  constraint role_permissions_permission_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists role_permissions_role_idx on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists role_permissions_permission_idx on public.role_permissions using btree (permission_id) TABLESPACE pg_default;