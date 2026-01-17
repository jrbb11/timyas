create table public.permissions (
  id uuid not null default gen_random_uuid (),
  resource text not null,
  action text not null,
  description text null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_unique unique (resource, action),
  constraint permissions_action_check check (
    (
      action = any (
        array[
          'create'::text,
          'read'::text,
          'update'::text,
          'delete'::text,
          'approve'::text,
          'export'::text,
          'manage'::text,
          'adjust'::text,
          'audit'::text,
          'resolve'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists permissions_resource_idx on public.permissions using btree (resource) TABLESPACE pg_default;

create index IF not exists permissions_action_idx on public.permissions using btree (action) TABLESPACE pg_default;

create trigger permissions_updated_at_trigger BEFORE
update on permissions for EACH row
execute FUNCTION updated_at_timestamp ();