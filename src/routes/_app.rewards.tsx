import { createFileRoute } from "@tanstack/react-router";
import { Copy, Gift, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/rewards")({
  head: () => ({
    meta: [
      { title: "Rewards — Payroxa" },
      { name: "description", content: "Cashback, loyalty tiers, and referral rewards on Payroxa." },
    ],
  }),
  component: Rewards,
});

function Rewards() {
  const code = "PAYROXA-ADAEZE";
  return (
    <div>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Rewards</h1>
        <p className="mt-1 text-sm text-muted-foreground">Earn more every time you pay.</p>
      </div>

      <section className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-navy p-5 text-navy-foreground shadow-glow">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/40 blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div>
              <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                <Trophy className="h-3 w-3" /> Silver tier
              </p>
              <p className="mt-3 text-xs text-white/70">Rewards balance</p>
              <p className="text-3xl font-bold tracking-tight">₦ 3,240</p>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
              <Gift className="h-7 w-7" />
            </span>
          </div>
          <div className="relative mt-5">
            <div className="flex items-center justify-between text-[11px] text-white/60">
              <span>Silver</span>
              <span>Gold · ₦10,000</span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pt-6">
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-sm font-semibold">Refer & Earn</h2>
              <p className="text-xs text-muted-foreground">Earn ₦500 for every friend who joins.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary p-3">
            <p className="font-mono text-sm">{code}</p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(code);
                toast.success("Referral code copied");
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 py-3 text-sm font-semibold text-primary">
            <Share2 className="h-4 w-4" /> Share invite
          </button>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              { label: "Invited", value: "12" },
              { label: "Joined", value: "7" },
              { label: "Earned", value: "₦3.5k" },
            ].map((s) => (
              <div key={s.label} className="rounded-xl bg-secondary py-2">
                <p className="text-sm font-semibold">{s.value}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-8 pt-6">
        <h2 className="mb-3 text-sm font-semibold">Cashback offers</h2>
        <ul className="space-y-3">
          {[
            { title: "2% back on electricity", meta: "Until Dec 31" },
            { title: "₦100 off DSTV bundles", meta: "Weekly offer" },
            { title: "5% back on data", meta: "New users" },
          ].map((o) => (
            <li
              key={o.title}
              className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
                <Sparkles className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{o.title}</p>
                <p className="truncate text-xs text-muted-foreground">{o.meta}</p>
              </div>
              <button className="rounded-lg bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">
                Claim
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
