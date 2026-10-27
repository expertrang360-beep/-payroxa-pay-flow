import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { RequireAuth } from "@/components/app/require-auth";
import { ArrowUpRight, ArrowDownLeft, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useLedger, formatEntryDate } from "@/hooks/use-ledger";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/transactions")({
  head: () => ({ meta: [{ title: "Transactions — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <Transactions />
    </RequireAuth>
  ),
});

const PAGE_SIZE = 30;

function Transactions() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"all" | "credit" | "debit">("all");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 300);
    return () => clearTimeout(t);
  }, [q]);
  const {
    entries: filtered,
    loading,
    error,
    hasMore,
    loadMore,
    loadingMore,
  } = useLedger(PAGE_SIZE, { type: tab === "all" ? undefined : tab, search });
  const filtering = tab !== "all" || search.trim() !== "";

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
            aria-label="Search transactions"
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

        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="mt-10 text-center text-sm text-destructive">{error}</p>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
            <p className="text-sm font-semibold">
              {filtering ? "No matching transactions" : "No transactions yet"}
            </p>
            {!filtering && (
              <p className="mt-1 text-xs text-muted-foreground">
                Fund your wallet to start making payments.
              </p>
            )}
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-3xl bg-card shadow-soft">
            {filtered.map((t) => (
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
                    {formatEntryDate(t.created_at)} · {t.reference}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.type === "credit" ? "text-success" : "text-foreground"}`}
                >
                  {t.type === "credit" ? "+" : "−"}
                  {formatNaira(t.type === "credit" ? t.credit : t.debit)}
                </p>
              </li>
            ))}
          </ul>
        )}
        {!loading && hasMore && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-4 h-11 w-full rounded-2xl border border-input bg-card text-sm font-semibold disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </main>
    </div>
  );
}
