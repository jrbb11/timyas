create table public.audit_logs (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  user_email text null,
  user_role text null,
  action text not null,
  resource text not null,
  resource_id uuid null,
  resource_name text null,
  old_values jsonb null,
  new_values jsonb null,
  ip_address inet null,
  user_agent text null,
  session_id text null,
  timestamp timestamp with time zone null default now(),
  severity text null default 'INFO'::text,
  category text not null,
  description text null,
  metadata jsonb null,
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_user_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint audit_logs_action_check check (
    (
      action = any (
        array[
          'CREATE'::text,
          'UPDATE'::text,
          'DELETE'::text,
          'LOGIN'::text,
          'LOGOUT'::text,
          'VIEW'::text,
          'EXPORT'::text,
          'IMPORT'::text,
          'APPROVE'::text,
          'REJECT'::text
        ]
      )
    )
  ),
  constraint audit_logs_category_check check (
    (
      category = any (
        array[
          'DATA_CHANGE'::text,
          'AUTHENTICATION'::text,
          'AUTHORIZATION'::text,
          'SYSTEM'::text,
          'SECURITY'::text,
          'COMPLIANCE'::text
        ]
      )
    )
  ),
  constraint audit_logs_severity_check check (
    (
      severity = any (
        array[
          'INFO'::text,
          'WARNING'::text,
          'ERROR'::text,
          'CRITICAL'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user_id on public.audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_resource on public.audit_logs using btree (resource) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_resource_id on public.audit_logs using btree (resource_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_action on public.audit_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_timestamp on public.audit_logs using btree ("timestamp") TABLESPACE pg_default;

create index IF not exists idx_audit_logs_severity on public.audit_logs using btree (severity) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_category on public.audit_logs using btree (category) TABLESPACE pg_default;