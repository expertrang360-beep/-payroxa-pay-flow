import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { BadgeCheck, Check, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/kyc")({
  head: () => ({ meta: [{ title: "KYC Verification — Payroxa" }] }),
  component: KYC,
});

const tiers = [
  {
    name: "Tier 1",
    limit: "₦50,000 / day",
    done: true,
    items: ["Phone verified", "Email verified"],
  },
  { name: "Tier 2", limit: "₦500,000 / day", done: true, items: ["BVN verified", "ID uploaded"] },
  {
    name: "Tier 3",
    limit: "Unlimited",
    done: false,
    items: ["Proof of address", "Selfie verification"],
  },
];

function KYC() {
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="KYC Verification" back="/profile" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <div className="rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            <p className="text-xs uppercase tracking-wider text-white/80">Current tier</p>
          </div>
          <p className="mt-2 text-2xl font-bold">Tier 2 · Verified</p>
          <p className="text-xs text-white/80">Daily limit ₦500,000. Upgrade to remove limits.</p>
        </div>

        <ul className="mt-6 space-y-3">
          {tiers.map((t) => (
            <li key={t.name} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">Limit: {t.limit}</p>
                </div>
                {t.done ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                    <Check className="h-3 w-3" /> Completed
                  </span>
                ) : (
                  <button className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground">
                    Upgrade <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
              <ul className="mt-3 space-y-1.5">
                {t.items.map((i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check
                      className={`h-3.5 w-3.5 ${t.done ? "text-success" : "text-muted-foreground/50"}`}
                    />{" "}
                    {i}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
