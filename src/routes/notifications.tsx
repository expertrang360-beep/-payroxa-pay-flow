import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { RequireAuth } from "@/components/app/require-auth";
import { ArrowDownLeft, ArrowUpRight, Bell } from "lucide-react";
import { useLedger, formatEntryDate } from "@/hooks/use-ledger";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <Notifications />
    </RequireAuth>
  ),
});

function Notifications() {
  const { entries, loading, error } = useLedger(30);

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Notifications" back="/home" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        {loading ? (
          <p className="mt-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="mt-10 text-center text-sm text-destructive">{error}</p>
        ) : entries.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center">
            <Bell className="h-6 w-6 text-muted-foreground" />
            <p className="mt-2 text-sm font-semibold">You're all caught up</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Wallet activity alerts will show up here.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {entries.map((n) => {
              const credit = n.type === "credit";
              const Icon = credit ? ArrowDownLeft : ArrowUpRight;
              return (
                <li key={n.id} className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
                  <span
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${credit ? "bg-success/10 text-success" : "bg-primary-soft text-primary"}`}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">
                        {credit ? "Wallet credited" : "Debit alert"}
                      </p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {formatEntryDate(n.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatNaira(credit ? n.credit : n.debit)} · {n.description}. Balance:{" "}
                      {formatNaira(n.balance_after)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
