-- Payroxa database schema.
--
-- Run this whole file in the Supabase SQL editor (or `psql`). It is idempotent:
-- safe to re-run, and it upgrades databases created from earlier versions of
-- this file (plaintext PINs are hashed and client-side balance writes are revoked).
--
-- Security model:
--   * Clients can only READ their own rows (RLS).
--   * Every balance change goes through SECURITY DEFINER functions below, which
--     lock the wallet row, validate input, verify the transaction PIN and write
--     the transaction + ledger rows atomically.
--   * Profiles and wallets are created by triggers, never by the client.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    first_name text not null,
    last_name text not null,
    email text unique not null,
    phone text,
    kyc_level integer not null default 0 check (kyc_level between 0 and 3),
    status text not null default 'pending_verification'
        check (status in ('active', 'suspended', 'pending_verification')),
    pin_set boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

alter table public.users add column if not exists pin_set boolean not null default false;
alter table public.users alter column kyc_level set default 0;
alter table public.users alter column status set default 'pending_verification';
update public.users set status = 'pending_verification' where status = 'pending';

create table if not exists public.user_pins (
    user_id uuid primary key references public.users(id) on delete cascade,
    pin_hash text not null,
    failed_attempts integer not null default 0,
    locked_until timestamptz,
    updated_at timestamptz not null default now()
);

-- Migrate plaintext PINs from older schema versions.
do $$
begin
    if exists (
        select 1 from information_schema.columns
        where table_schema = 'public' and table_name = 'users' and column_name = 'transaction_pin'
    ) then
        insert into public.user_pins (user_id, pin_hash)
        select id, extensions.crypt(transaction_pin, extensions.gen_salt('bf'))
        from public.users
        where transaction_pin ~ '^\d{4}$'
        on conflict (user_id) do nothing;

        update public.users set pin_set = true where transaction_pin ~ '^\d{4}$';
        alter table public.users drop column transaction_pin;
    end if;
end $$;

create table if not exists public.wallets (
    id uuid primary key references public.users(id) on delete cascade,
    user_id uuid not null unique references public.users(id) on delete cascade,
    currency text not null default 'NGN',
    available_balance numeric(15, 2) not null default 0.00 check (available_balance >= 0),
    ledger_balance numeric(15, 2) not null default 0.00,
    status text not null default 'active' check (status in ('active', 'frozen')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.ledger (
    id uuid primary key default gen_random_uuid(),
    wallet_id uuid not null references public.wallets(id) on delete cascade,
    reference text unique not null,
    type text not null check (type in ('credit', 'debit')),
    credit numeric(15, 2) not null default 0.00,
    debit numeric(15, 2) not null default 0.00,
    balance_after numeric(15, 2) not null,
    description text not null,
    status text not null default 'completed',
    created_at timestamptz not null default now()
);

create index if not exists ledger_wallet_id_created_at_idx
    on public.ledger (wallet_id, created_at desc);

create table if not exists public.transactions (
    id uuid primary key default gen_random_uuid(),
    reference text unique not null,
    user_id uuid not null references public.users(id) on delete cascade,
    service text not null,
    provider text not null,
    amount numeric(15, 2) not null,
    fee numeric(15, 2) not null default 0.00,
    status text not null check (status in ('pending', 'success', 'failed')),
    provider_reference text,
    metadata jsonb,
    created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_created_at_idx
    on public.transactions (user_id, created_at desc);

-- Server-side feature flags. Not readable by clients.
create table if not exists public.app_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamptz not null default now()
);

-- SANDBOX: when true, users can credit their own wallet without a real payment.
-- Disabled by default; enable only in test environments until a payment gateway
-- (Paystack, Flutterwave, ...) credits wallets from a verified webhook instead.
insert into public.app_settings (key, value)
values ('sandbox_funding', 'false'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security & privileges
-- ---------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.user_pins enable row level security;
alter table public.wallets enable row level security;
alter table public.ledger enable row level security;
alter table public.transactions enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "Users can read their own profile" on public.users;
drop policy if exists "Users can update their own profile" on public.users;
drop policy if exists "Users can insert their own profile during signup" on public.users;
drop policy if exists "Users can read their own wallet" on public.wallets;
drop policy if exists "Users can update their own wallet" on public.wallets;
drop policy if exists "Users can insert their own wallet" on public.wallets;
drop policy if exists "Users can read their own ledger" on public.ledger;
drop policy if exists "Users can insert ledger entries for their wallet" on public.ledger;
drop policy if exists "Users can read their own transactions" on public.transactions;
drop policy if exists "Users can insert transactions" on public.transactions;

create policy "Users can read their own profile" on public.users
    for select to authenticated using ((select auth.uid()) = id);

create policy "Users can update their own profile" on public.users
    for update to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

create policy "Users can read their own wallet" on public.wallets
    for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users can read their own ledger" on public.ledger
    for select to authenticated using (
        exists (
            select 1 from public.wallets w
            where w.id = ledger.wallet_id and w.user_id = (select auth.uid())
        )
    );

create policy "Users can read their own transactions" on public.transactions
    for select to authenticated using ((select auth.uid()) = user_id);

-- Clients may only edit harmless profile fields; status, KYC level and money are server-only.
revoke insert, update, delete on public.users from anon, authenticated;
grant select on public.users to authenticated;
grant update (first_name, last_name, phone, updated_at) on public.users to authenticated;

revoke all on public.wallets, public.ledger, public.transactions from anon;
revoke insert, update, delete on public.wallets, public.ledger, public.transactions from authenticated;
grant select on public.wallets, public.ledger, public.transactions to authenticated;

revoke all on public.user_pins, public.app_settings from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Signup: auth.users -> public.users -> public.wallets (+ welcome bonus)
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
    full_name text := nullif(trim(coalesce(meta->>'full_name', meta->>'name', '')), '');
begin
    insert into public.users (id, first_name, last_name, email, phone, status)
    values (
        new.id,
        coalesce(nullif(trim(meta->>'first_name'), ''), split_part(full_name, ' ', 1), 'Payroxa'),
        coalesce(
            nullif(trim(meta->>'last_name'), ''),
            nullif(trim(substr(full_name, length(split_part(full_name, ' ', 1)) + 1)), ''),
            'User'
        ),
        coalesce(new.email, new.id::text || '@users.payroxa.invalid'),
        nullif(trim(meta->>'phone'), ''),
        case when new.email_confirmed_at is not null then 'active' else 'pending_verification' end
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.users
    set status = 'active', updated_at = now()
    where id = new.id and status = 'pending_verification';
    return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
    after update of email_confirmed_at on auth.users
    for each row
    when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
    execute function public.handle_auth_user_confirmed();

-- Creates a user's wallet with the welcome bonus (wallet, transaction, ledger).
-- Idempotent: does nothing if the wallet already exists.
create or replace function public._provision_wallet(p_user uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
    bonus constant numeric := 5000;
    ref text := 'PYX-BONUS-' || replace(p_user::text, '-', '');
    inserted integer;
begin
    insert into public.wallets (id, user_id, available_balance, ledger_balance)
    values (p_user, p_user, bonus, bonus)
    on conflict (id) do nothing;
    get diagnostics inserted = row_count;

    if inserted > 0 then
        insert into public.transactions (reference, user_id, service, provider, amount, fee, status)
        values (ref, p_user, 'bonus', 'payroxa', bonus, 0, 'success')
        on conflict (reference) do nothing;

        insert into public.ledger (wallet_id, reference, type, credit, debit, balance_after, description)
        values (p_user, ref, 'credit', bonus, 0, bonus, 'Sign-up welcome bonus')
        on conflict (reference) do nothing;
    end if;
end;
$$;

create or replace function public.handle_new_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    perform public._provision_wallet(new.id);
    return new;
end;
$$;

drop trigger if exists on_profile_created on public.users;
create trigger on_profile_created
    after insert on public.users
    for each row execute function public.handle_new_profile();

-- Backfill accounts created before these triggers existed.
insert into public.users (id, first_name, last_name, email, status)
select
    au.id,
    coalesce(nullif(trim(au.raw_user_meta_data->>'first_name'), ''), 'Payroxa'),
    coalesce(nullif(trim(au.raw_user_meta_data->>'last_name'), ''), 'User'),
    coalesce(au.email, au.id::text || '@users.payroxa.invalid'),
    case when au.email_confirmed_at is not null then 'active' else 'pending_verification' end
from auth.users au
where not exists (select 1 from public.users u where u.id = au.id)
on conflict do nothing;

update public.users u
set status = 'active', updated_at = now()
from auth.users au
where au.id = u.id and au.email_confirmed_at is not null and u.status = 'pending_verification';

select public._provision_wallet(u.id)
from public.users u
where not exists (select 1 from public.wallets w where w.id = u.id);

-- ---------------------------------------------------------------------------
-- Internal helpers (not callable by clients)
-- ---------------------------------------------------------------------------

-- Returns NULL when the PIN is valid, otherwise a user-facing error message.
-- Never raises, so failed-attempt counters are committed by the caller.
create or replace function public._verify_pin(p_user uuid, p_pin text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
    rec public.user_pins;
begin
    select * into rec from public.user_pins where user_id = p_user for update;
    if not found then
        return 'Set a transaction PIN in Settings before making payments.';
    end if;

    if rec.locked_until is not null and rec.locked_until > now() then
        return 'Too many incorrect PIN attempts. Try again in a few minutes.';
    end if;

    if p_pin is not null and rec.pin_hash = extensions.crypt(p_pin, rec.pin_hash) then
        update public.user_pins
        set failed_attempts = 0, locked_until = null
        where user_id = p_user;
        return null;
    end if;

    update public.user_pins
    set failed_attempts = case when rec.failed_attempts + 1 >= 5 then 0 else rec.failed_attempts + 1 end,
        locked_until = case when rec.failed_attempts + 1 >= 5 then now() + interval '15 minutes' end
    where user_id = p_user;

    if rec.failed_attempts + 1 >= 5 then
        return 'Too many incorrect PIN attempts. Try again in a few minutes.';
    end if;
    return 'Incorrect transaction PIN.';
end;
$$;

create or replace function public._daily_limit(p_kyc_level integer)
returns numeric
language sql
immutable
as $$
    select case
        when p_kyc_level >= 3 then null
        when p_kyc_level = 2 then 500000
        else 50000
    end::numeric;
$$;

create or replace function public._debit_wallet(
    p_user uuid,
    p_amount numeric,
    p_fee numeric,
    p_service text,
    p_provider text,
    p_description text,
    p_metadata jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    w public.wallets;
    total numeric := p_amount + p_fee;
    new_balance numeric;
    ref text := 'PYX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
    kyc integer;
    user_status text;
    limit_amount numeric;
    spent_today numeric;
begin
    select kyc_level, status into kyc, user_status from public.users where id = p_user;
    if user_status = 'suspended' then
        raise exception 'Your account is suspended. Contact support.';
    end if;

    select * into w from public.wallets where user_id = p_user for update;
    if not found then
        raise exception 'Wallet not found.';
    end if;
    if w.status <> 'active' then
        raise exception 'Your wallet is frozen. Contact support.';
    end if;
    if w.available_balance < total then
        raise exception 'Insufficient balance.';
    end if;

    limit_amount := public._daily_limit(coalesce(kyc, 0));
    if limit_amount is not null then
        select coalesce(sum(amount + fee), 0) into spent_today
        from public.transactions
        where user_id = p_user
          and status <> 'failed'
          and service not in ('fund_wallet', 'bonus')
          and created_at >= date_trunc('day', now());
        if spent_today + total > limit_amount then
            raise exception 'This exceeds your daily limit of NGN %. Upgrade your KYC tier to raise it.',
                to_char(limit_amount, 'FM999,999,999');
        end if;
    end if;

    new_balance := w.available_balance - total;

    update public.wallets
    set available_balance = new_balance,
        ledger_balance = ledger_balance - total,
        updated_at = now()
    where id = w.id;

    insert into public.transactions (reference, user_id, service, provider, amount, fee, status, metadata)
    values (ref, p_user, p_service, p_provider, p_amount, p_fee, 'success', p_metadata);

    insert into public.ledger (wallet_id, reference, type, credit, debit, balance_after, description)
    values (w.id, ref, 'debit', 0, total, new_balance, p_description);

    return jsonb_build_object(
        'reference', ref,
        'amount', p_amount,
        'fee', p_fee,
        'total', total,
        'balance_after', new_balance
    );
end;
$$;

-- ---------------------------------------------------------------------------
-- Client-callable RPCs
-- ---------------------------------------------------------------------------

create or replace function public.set_transaction_pin(p_pin text, p_current_pin text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    err text;
begin
    if uid is null then
        raise exception 'Not authenticated.';
    end if;
    if p_pin is null or p_pin !~ '^\d{4}$' then
        raise exception 'PIN must be exactly 4 digits.';
    end if;

    if exists (select 1 from public.user_pins where user_id = uid) then
        err := public._verify_pin(uid, p_current_pin);
        if err is not null then
            return jsonb_build_object('error', err);
        end if;
    end if;

    insert into public.user_pins (user_id, pin_hash, failed_attempts, locked_until, updated_at)
    values (uid, extensions.crypt(p_pin, extensions.gen_salt('bf')), 0, null, now())
    on conflict (user_id) do update
        set pin_hash = excluded.pin_hash,
            failed_attempts = 0,
            locked_until = null,
            updated_at = now();

    update public.users set pin_set = true, updated_at = now() where id = uid;
    return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.transfer_funds(
    p_bank text,
    p_account_number text,
    p_amount numeric,
    p_note text,
    p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    amt numeric := round(p_amount, 2);
    bank text := trim(coalesce(p_bank, ''));
    note text := nullif(trim(coalesce(p_note, '')), '');
    err text;
begin
    if uid is null then
        raise exception 'Not authenticated.';
    end if;
    if bank = '' or length(bank) > 100 then
        raise exception 'Select a valid bank.';
    end if;
    if p_account_number is null or p_account_number !~ '^\d{10}$' then
        raise exception 'Account number must be 10 digits.';
    end if;
    if amt is null or amt < 100 then
        raise exception 'Minimum transfer amount is NGN 100.';
    end if;
    if amt > 5000000 then
        raise exception 'Maximum transfer amount is NGN 5,000,000.';
    end if;
    if note is not null and length(note) > 140 then
        raise exception 'Note must be 140 characters or less.';
    end if;

    err := public._verify_pin(uid, p_pin);
    if err is not null then
        return jsonb_build_object('error', err);
    end if;

    return public._debit_wallet(
        uid, amt, 0, 'transfer', bank,
        'Transfer to ' || bank || ' (' || p_account_number || ')',
        jsonb_build_object('bank', bank, 'account_number', p_account_number, 'note', note)
    );
end;
$$;

create or replace function public.pay_bill(
    p_service text,
    p_provider text,
    p_target text,
    p_amount numeric,
    p_pin text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    amt numeric := round(p_amount, 2);
    provider text := trim(coalesce(p_provider, ''));
    target text := trim(coalesce(p_target, ''));
    fee numeric;
    label text;
    err text;
begin
    if uid is null then
        raise exception 'Not authenticated.';
    end if;

    label := case p_service
        when 'airtime' then 'Airtime'
        when 'data' then 'Data'
        when 'electricity' then 'Electricity'
        when 'cable' then 'Cable TV'
        when 'internet' then 'Internet'
        when 'betting' then 'Betting top-up'
        when 'giftcards' then 'Gift card'
    end;
    if label is null then
        raise exception 'Unsupported service.';
    end if;
    if provider = '' or length(provider) > 100 then
        raise exception 'Select a valid provider.';
    end if;
    if target = '' or length(target) > 100 then
        raise exception 'Enter valid recipient details.';
    end if;
    if amt is null or amt < 50 then
        raise exception 'Minimum amount is NGN 50.';
    end if;
    if amt > 1000000 then
        raise exception 'Maximum amount is NGN 1,000,000.';
    end if;

    err := public._verify_pin(uid, p_pin);
    if err is not null then
        return jsonb_build_object('error', err);
    end if;

    fee := greatest(20, round(amt * 0.005));

    return public._debit_wallet(
        uid, amt, fee, p_service, provider,
        provider || ' ' || label || ' bill (' || target || ')',
        jsonb_build_object('target', target)
    );
end;
$$;

create or replace function public.fund_wallet(p_amount numeric, p_method text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
    uid uuid := auth.uid();
    amt numeric := round(p_amount, 2);
    w public.wallets;
    new_balance numeric;
    ref text := 'PYX-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 16));
    sandbox boolean;
begin
    if uid is null then
        raise exception 'Not authenticated.';
    end if;

    select (value #>> '{}')::boolean into sandbox from public.app_settings where key = 'sandbox_funding';
    if not coalesce(sandbox, false) then
        raise exception 'Wallet funding is temporarily unavailable.';
    end if;

    if p_method not in ('card', 'transfer', 'ussd') then
        raise exception 'Unsupported payment method.';
    end if;
    if amt is null or amt < 100 then
        raise exception 'Minimum funding amount is NGN 100.';
    end if;
    if amt > 1000000 then
        raise exception 'Maximum funding amount is NGN 1,000,000.';
    end if;

    select * into w from public.wallets where user_id = uid for update;
    if not found then
        raise exception 'Wallet not found.';
    end if;
    if w.status <> 'active' then
        raise exception 'Your wallet is frozen. Contact support.';
    end if;

    new_balance := w.available_balance + amt;

    update public.wallets
    set available_balance = new_balance,
        ledger_balance = ledger_balance + amt,
        updated_at = now()
    where id = w.id;

    insert into public.transactions (reference, user_id, service, provider, amount, fee, status, metadata)
    values (ref, uid, 'fund_wallet', p_method, amt, 0, 'success', jsonb_build_object('method', p_method));

    insert into public.ledger (wallet_id, reference, type, credit, debit, balance_after, description)
    values (w.id, ref, 'credit', amt, 0, new_balance, 'Wallet funded via ' || upper(p_method));

    return jsonb_build_object('reference', ref, 'amount', amt, 'balance_after', new_balance);
end;
$$;

-- Functions are executable by PUBLIC by default; lock them down explicitly.
revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.handle_auth_user_confirmed() from public, anon, authenticated;
revoke execute on function public.handle_new_profile() from public, anon, authenticated;
revoke execute on function public._verify_pin(uuid, text) from public, anon, authenticated;
revoke execute on function public._daily_limit(integer) from public, anon, authenticated;
revoke execute on function public._provision_wallet(uuid) from public, anon, authenticated;
revoke execute on function public._debit_wallet(uuid, numeric, numeric, text, text, text, jsonb) from public, anon, authenticated;

revoke execute on function public.set_transaction_pin(text, text) from public, anon;
revoke execute on function public.transfer_funds(text, text, numeric, text, text) from public, anon;
revoke execute on function public.pay_bill(text, text, text, numeric, text) from public, anon;
revoke execute on function public.fund_wallet(numeric, text) from public, anon;

grant execute on function public.set_transaction_pin(text, text) to authenticated;
grant execute on function public.transfer_funds(text, text, numeric, text, text) to authenticated;
grant execute on function public.pay_bill(text, text, text, numeric, text) to authenticated;
grant execute on function public.fund_wallet(numeric, text) to authenticated;
