import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Payroxa" }] }),
  component: Transactions,
});

const all = [
  { name: "MTN Airtime", meta: "Nov 14 · 10:24", amount: -1500, type: "debit" },
  { name: "Wallet Funding · Card", meta: "Nov 14 · 09:31", amount: 50000, type: "credit" },
  { name: "DSTV Compact", meta: "Nov 13 · 09:11", amount: -9500, type: "debit" },
  { name: "Transfer to Chika O.", meta: "Nov 12 · 12:03", amount: -12000, type: "debit" },
  { name: "Referral Bonus", meta: "Nov 11 · 15:29", amount: 500, type: "credit" },
  { name: "Cashback · DSTV", meta: "Nov 10 · 10:00", amount: 190, type: "credit" },
  { name: "Ikeja Electric", meta: "Nov 9 · 20:45", amount: -6500, type: "debit" },
  { name: "Spectranet 30 days", meta: "Nov 5 · 08:00", amount: -14500, type: "debit" },
];

function Transactions() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "credit" | "debit">("all");
  const filtered = all
    .filter((t) => (tab === "all" ? true : t.type === tab))
    .filter((t) => t.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Transactions" back="/wallet" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search transactions"
            className="h-11 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>

        <div className="mt-4 inline-flex rounded-2xl bg-secondary p-1">
          {(["all", "credit", "debit"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-xl px-4 py-1.5 text-xs font-semibold capitalize ${tab === t ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-sm font-semibold">No transactions yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Fund your wallet to start making payments.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-3xl bg-card shadow-soft">
            {filtered.map((t, i) => (
              <li key={i} className="flex items-center gap-3 p-4">
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
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.meta}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.type === "credit" ? "text-success" : "text-foreground"}`}
                >
                  {t.type === "credit" ? "+" : "−"}₦{Math.abs(t.amount).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
