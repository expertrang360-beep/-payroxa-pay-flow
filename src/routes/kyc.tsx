import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { RequireAuth } from "@/components/app/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { BadgeCheck, Check, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/kyc")({
  head: () => ({ meta: [{ title: "KYC Verification — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <KYC />
    </RequireAuth>
  ),
});

const tiers = [
  { level: 1, name: "Tier 1", limit: "₦50,000 / day", items: ["Email verified", "Phone number"] },
  { level: 2, name: "Tier 2", limit: "₦500,000 / day", items: ["BVN verified", "ID uploaded"] },
  {
    level: 3,
    name: "Tier 3",
    limit: "Unlimited",
    items: ["Proof of address", "Selfie verification"],
  },
];

const LIMITS: Record<number, string> = {
  0: "₦50,000",
  1: "₦50,000",
  2: "₦500,000",
  3: "Unlimited",
};

function KYC() {
  const { profile } = useAuth();
  const level = profile?.kyc_level ?? 0;
  const verified = profile?.status === "active";

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="KYC Verification" back="/profile" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <div className="rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" />
            <p className="text-xs uppercase tracking-wider text-white/80">Current tier</p>
          </div>
          <p className="mt-2 text-2xl font-bold">
            Tier {level} · {verified ? "Verified" : "Pending verification"}
          </p>
          <p className="text-xs text-white/80">
            Daily limit {LIMITS[level] ?? LIMITS[0]}.
            {level < 3 ? " Upgrade to raise your limits." : ""}
          </p>
        </div>

        <ul className="mt-6 space-y-3">
          {tiers.map((t) => {
            const done = level >= t.level;
            const next = t.level === level + 1;
            return (
              <li key={t.name} className="rounded-2xl bg-card p-4 shadow-soft">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs text-muted-foreground">Limit: {t.limit}</p>
                  </div>
                  {done ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                      <Check className="h-3 w-3" /> Completed
                    </span>
                  ) : next ? (
                    <Link
                      to="/support"
                      className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[11px] font-semibold text-primary-foreground"
                    >
                      Upgrade <ChevronRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                </div>
                <ul className="mt-3 space-y-1.5">
                  {t.items.map((i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check
                        className={`h-3.5 w-3.5 ${done ? "text-success" : "text-muted-foreground/50"}`}
                      />{" "}
                      {i}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
        {level < 3 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tier upgrades are reviewed by our compliance team. Contact support to begin.
          </p>
        )}
      </main>
    </div>
  );
}
