import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDownLeft, ArrowUpRight, Plus, Send, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLedger, formatEntryDate } from "@/hooks/use-ledger";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/wallet")({
  head: () => ({
    meta: [
      { title: "Wallet — Payroxa" },
      { name: "description", content: "Your Payroxa wallet — balance, funding and transactions." },
    ],
  }),
  component: WalletPage,
});

function WalletPage() {
  const { wallet } = useAuth();
  const [hidden, setHidden] = useState(false);
  const { entries: ledgerEntries, loading, error } = useLedger(15);
  const totalBalance = wallet?.available_balance ?? 0;

  // Calculate stats from ledger
  const inflow = ledgerEntries
    .filter((e) => e.type === "credit")
    .reduce((sum, e) => sum + e.credit, 0);

  const outflow = ledgerEntries
    .filter((e) => e.type === "debit")
    .reduce((sum, e) => sum + e.debit, 0);

  const rewards = ledgerEntries
    .filter((e) => e.type === "credit" && e.description.toLowerCase().includes("bonus"))
    .reduce((sum, e) => sum + e.credit, 0);

  return (
    <div>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Wallet</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your balance and activity.</p>
      </div>

      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-white/70">
              Available balance
            </span>
            <button
              onClick={() => setHidden(!hidden)}
              className="grid h-8 w-8 place-items-center rounded-lg bg-white/10"
              aria-label="Toggle balance"
            >
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-2 text-3xl font-bold tracking-tight">
            {hidden ? "₦ ••••••" : formatNaira(totalBalance)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link
              to="/fund-wallet"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-navy"
            >
              <Plus className="h-4 w-4" /> Fund
            </Link>
            <Link
              to="/transfer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-white/15 py-3 text-sm font-semibold text-white hover:bg-white/25"
            >
              <Send className="h-4 w-4" /> Send
            </Link>
          </div>
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Inflow", value: formatNaira(inflow, 0) },
            { label: "Outflow", value: formatNaira(outflow, 0) },
            { label: "Rewards", value: formatNaira(rewards, 0) },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card p-3 text-center shadow-soft">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-1 text-sm font-semibold">{s.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 pb-8 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Transactions</h2>
          <Link
            to="/transactions"
            className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium text-foreground"
          >
            View all
          </Link>
        </div>
        <ul className="divide-y divide-border rounded-3xl bg-card shadow-soft">
          {ledgerEntries.length > 0 ? (
            ledgerEntries.map((t) => (
              <li key={t.id} className="flex items-center gap-3 p-4">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${t.type === "credit" ? "bg-success/10 text-success" : "bg-primary-soft text-primary"}`}
                >
                  {t.type === "credit" ? (
                    <ArrowDownLeft className="h-5 w-5" />
                  ) : (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.description}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatEntryDate(t.created_at)}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.type === "credit" ? "text-success" : "text-foreground"}`}
                >
                  {t.type === "credit" ? "+" : "−"}
                  {formatNaira(t.type === "credit" ? t.credit : t.debit)}
                </p>
              </li>
            ))
          ) : (
            <li className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">
                {loading ? "Loading…" : (error ?? "No transactions found")}
              </p>
              {!loading && !error && (
                <p className="text-xs mt-1">Make a transfer or fund your account to get started.</p>
              )}
            </li>
          )}
        </ul>
      </section>
    </div>
  );
}
