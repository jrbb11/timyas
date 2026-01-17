create table public.payment_methods (
  id serial not null,
  name text not null,
  constraint payment_methods_pkey primary key (id),
  constraint payment_methods_name_key unique (name)
) TABLESPACE pg_default;