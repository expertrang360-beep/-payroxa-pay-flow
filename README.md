# Payroxa

Payroxa is a mobile-first wallet and bill-payment web app built with TanStack Start, React 19, Tailwind CSS 4 and Supabase.

## Prerequisites

- Node.js 20+
- A Supabase project

## Setup

1. Install dependencies:
   ```bash
   npm ci
   ```
2. Copy `.env.example` to `.env` and set your Supabase project values:
   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_ANON_KEY=<anon-key>
   ```
3. Apply the database schema: open the Supabase dashboard → **SQL Editor**, paste the contents of [`supabase-schema.sql`](./supabase-schema.sql) and run it. The script is idempotent and safe to re-run; it also migrates older Payroxa schemas (including hashing any plaintext transaction PINs).
   If the script stops with "Payroxa schema not applied: ... incompatible layout", the project already has `users`/`wallets`/`transactions` tables from a different schema design (camelCase columns). Use a new, empty Supabase project. If you would rather reuse this one and nothing else depends on those tables, move them out of `public` (data is kept in the `legacy` schema), remove old auth triggers, then run the script again:
   ```sql
   create schema if not exists legacy;
   alter table public.users set schema legacy;
   alter table public.wallets set schema legacy;
   alter table public.transactions set schema legacy;
   -- List any old triggers on auth.users and drop ones that write to the moved tables:
   select tgname from pg_trigger where tgrelid = 'auth.users'::regclass and not tgisinternal;
   ```
4. Configure Supabase Auth (dashboard → **Authentication**):
   - **URL Configuration**: set the Site URL to your deployed origin and add `<origin>/home` and `<origin>/reset-password` to the redirect allow-list (plus `http://localhost:8080/*` for local development).
   - **Email Templates → Confirm signup**: include `{{ .Token }}` so users receive the 6-digit code used on the verification screen (the confirmation link also works).
5. Start the dev server:
   ```bash
   npm run dev
   ```

## Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Start the dev server         |
| `npm run build`   | Production build             |
| `npm run preview` | Preview the production build |
| `npm run lint`    | ESLint + Prettier checks     |
| `npm run format`  | Format the codebase          |

## Architecture notes

- **Accounts**: a trigger on `auth.users` creates the `public.users` profile, the wallet and the sign-up bonus server-side. The browser never inserts profiles or wallets.
- **Money movement**: balances, transactions and ledger entries can only be changed through the `SECURITY DEFINER` RPCs `transfer_funds`, `pay_bill` and `fund_wallet`. They lock the wallet row, enforce limits (including KYC-tier daily limits) and write the transaction and ledger rows atomically. Row Level Security gives clients read-only access to their own data.
- **Transaction PINs**: stored as bcrypt hashes in `public.user_pins` (not readable by clients), set via `set_transaction_pin` and verified server-side, with a 15-minute lockout after 5 wrong attempts.

## Before going live

Wallet funding is disabled by default. `fund_wallet` credits the wallet without a real payment only while the `sandbox_funding` flag is on, so enable it only in test environments:

```sql
update public.app_settings set value = 'true'::jsonb where key = 'sandbox_funding';
```

Before accepting real money, integrate a payment provider (e.g. Paystack/Flutterwave) that credits wallets from a verified server-side webhook, and keep sandbox funding off.

Bill payments and bank transfers are recorded in the ledger but are not yet dispatched to a real biller/bank provider; connect a provider before launch.
