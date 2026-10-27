-- One-time prep for reusing a Supabase project that already has tables named
-- users / wallets / transactions (or ledger / user_pins / app_settings) from a
-- different schema design (camelCase columns or non-uuid user ids).
--
-- It moves those tables, with their data, into the `legacy` schema, along with
-- public functions whose names Payroxa uses, and drops auth.users triggers that
-- write to the moved tables (they would break sign-ups). Nothing is deleted.
-- Run it once in the SQL editor, then run supabase-schema.sql.
-- Re-running is a no-op once the public tables are compatible.

create schema if not exists legacy;
revoke all on schema legacy from public, anon, authenticated;

-- Regular table (not temp): the Supabase SQL editor may not keep a temp table
-- around until the final SELECT runs.
create table if not exists legacy.payroxa_prep_log (
    id bigint generated always as identity primary key,
    run_at timestamptz not null default now(),
    action text not null
);

do $$
declare
    r record;
    moved text[] := '{}';
begin
    for r in
        select c.relname
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind in ('r', 'p')
          and c.relname in ('users', 'wallets', 'transactions', 'ledger', 'user_pins', 'app_settings')
          and (
              exists (
                  select 1 from information_schema.columns col
                  where col.table_schema = 'public' and col.table_name = c.relname
                    and col.column_name ~ '[A-Z]'
              )
              or (
                  c.relname = 'users' and exists (
                      select 1 from information_schema.columns col
                      where col.table_schema = 'public' and col.table_name = 'users'
                        and col.column_name = 'id' and col.data_type <> 'uuid'
                  )
              )
          )
    loop
        if to_regclass(format('legacy.%I', r.relname)) is not null then
            raise exception 'legacy.% already exists; rename it before running this script.', r.relname;
        end if;
        execute format('alter table public.%I set schema legacy', r.relname);
        moved := moved || r.relname::text;
        insert into legacy.payroxa_prep_log (action) values (format('moved table public.%s -> legacy.%s', r.relname, r.relname));
    end loop;

    if cardinality(moved) = 0 then
        insert into legacy.payroxa_prep_log (action) values ('nothing to do: no incompatible tables in public');
        return;
    end if;

    for r in
        select t.tgname, p.proname
        from pg_trigger t
        join pg_proc p on p.oid = t.tgfoid
        where t.tgrelid = 'auth.users'::regclass
          and not t.tgisinternal
          and p.prosrc ~* ('\m(' || array_to_string(moved, '|') || ')\M')
    loop
        execute format('drop trigger %I on auth.users', r.tgname);
        insert into legacy.payroxa_prep_log (action) values (format('dropped trigger auth.users.%s (called %s)', r.tgname, r.proname));
    end loop;

    for r in
        select p.oid, p.proname, pg_get_function_identity_arguments(p.oid) as args
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname in (
              '_daily_limit', '_debit_wallet', '_provision_wallet', '_verify_pin',
              'fund_wallet', 'handle_auth_user_confirmed', 'handle_new_auth_user',
              'handle_new_profile', 'pay_bill', 'set_transaction_pin', 'transfer_funds'
          )
    loop
        execute format('alter function public.%I(%s) set schema legacy', r.proname, r.args);
        insert into legacy.payroxa_prep_log (action) values (format('moved function public.%s(%s) -> legacy', r.proname, r.args));
    end loop;
end $$;

select run_at, action
from legacy.payroxa_prep_log
where run_at = (select max(run_at) from legacy.payroxa_prep_log)
order by id;
