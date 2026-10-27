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
3. Apply the database migrations in [`supabase/migrations`](./supabase/migrations):
   - **Supabase GitHub integration**: migrations run automatically when changes are merged into the production branch. Make sure the integration's Supabase directory is set to `supabase` and "Deploy to production" is enabled.
   - **Supabase CLI**: `npx supabase link --project-ref <project-ref>` then `npx supabase db push`.
   - **Manually**: run each file in order in the dashboard **SQL Editor**.

   `20261027000000_legacy_prep.sql` only acts if the project already has `users`/`wallets`/`transactions` tables from a different schema design (camelCase columns or non-uuid ids). It moves them and their data into a `legacy` schema, along with clashing functions, and drops old `auth.users` triggers that wrote to them; nothing is deleted. `20261027000100_payroxa_schema.sql` creates the Payroxa schema; it is idempotent and also upgrades older Payroxa schemas (including hashing plaintext transaction PINs).

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
