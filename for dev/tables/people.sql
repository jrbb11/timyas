create table public.people (
  id uuid not null default gen_random_uuid (),
  type text not null,
  name text not null,
  company text null,
  email text null,
  phone text null,
  address text null,
  city text null,
  country text null,
  is_active boolean null default true,
  note text null,
  created_at timestamp without time zone null default now(),
  user_id uuid null,
  constraint people_pkey primary key (id),
  constraint people_user_id_fkey foreign KEY (user_id) references auth.users (id) on delete set null,
  constraint people_type_check check (
    (
      type = any (
        array['customer'::text, 'supplier'::text, 'user'::text]
      )
    )
  )
) TABLESPACE pg_default;

create trigger people_audit_trigger
after INSERT
or DELETE
or
update on people for EACH row
execute FUNCTION audit_trigger_function ();