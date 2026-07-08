import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Bell, ArrowDownLeft, ShieldCheck, Gift } from "lucide-react";

export const Route = createFileRoute("/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Payroxa" }] }),
  component: Notifications,
});

const items = [
  {
    icon: ArrowDownLeft,
    tint: "bg-success/10 text-success",
    title: "Wallet credited",
    body: "₦50,000 successfully added to your wallet.",
    time: "2m ago",
  },
  {
    icon: Gift,
    tint: "bg-primary-soft text-primary",
    title: "New reward unlocked",
    body: "You earned ₦500 from your referral to Tobi.",
    time: "1h ago",
  },
  {
    icon: ShieldCheck,
    tint: "bg-warning/10 text-warning",
    title: "New device signed in",
    body: "iPhone 14 · Lagos, NG. Was this you?",
    time: "Yesterday",
  },
  {
    icon: Bell,
    tint: "bg-secondary text-foreground",
    title: "Bill reminder",
    body: "DSTV subscription is due in 3 days.",
    time: "2d ago",
  },
];

function Notifications() {
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Notifications" back="/home" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <ul className="space-y-2">
          {items.map((n, i) => {
            const Icon = n.icon;
            return (
              <li key={i} className="flex gap-3 rounded-2xl bg-card p-4 shadow-soft">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${n.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">{n.title}</p>
                    <span className="shrink-0 text-[10px] text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{n.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
