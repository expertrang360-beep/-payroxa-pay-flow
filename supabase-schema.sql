-- 1. Create a users table in the public schema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    kyc_level INTEGER DEFAULT 2,
    transaction_pin TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Create wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    currency TEXT DEFAULT 'NGN' NOT NULL,
    available_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    ledger_balance NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Create ledger table for tracking all wallet double-entry ledger items
CREATE TABLE IF NOT EXISTS public.ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
    reference TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    credit NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    debit NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    balance_after NUMERIC(15, 2) NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'completed' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create an index on ledger wallet_id and created_at for fast transaction history queries
CREATE INDEX IF NOT EXISTS ledger_wallet_id_created_at_idx ON public.ledger (wallet_id, created_at DESC);

-- 4. Create transactions table for tracking all high-level transaction attempts
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference TEXT UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    service TEXT NOT NULL,
    provider TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    fee NUMERIC(15, 2) DEFAULT 0.00 NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    provider_reference TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Row Level Security (RLS) on all tables for security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create Security Policies so users can only view or modify their own data
CREATE POLICY "Users can read their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile during signup" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read their own wallet" ON public.wallets
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own wallet" ON public.wallets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wallet" ON public.wallets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read their own ledger" ON public.ledger
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE public.wallets.id = public.ledger.wallet_id AND public.wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert ledger entries for their wallet" ON public.ledger
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.wallets
            WHERE public.wallets.id = public.ledger.wallet_id AND public.wallets.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can read their own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
