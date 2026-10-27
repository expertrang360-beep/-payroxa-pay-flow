import { createFileRoute } from "@tanstack/react-router";
import { Copy, Gift, Share2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/utils";

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
  const { profile, user, wallet } = useAuth();
  const [earned, setEarned] = useState(0);
  const walletId = wallet?.id;

  useEffect(() => {
    if (!walletId) return;
    let cancelled = false;
    supabase
      .from("ledger")
      .select("credit")
      .eq("wallet_id", walletId)
      .eq("type", "credit")
      .like("reference", "PYX-BONUS-%")
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to fetch rewards:", error);
        setEarned((data ?? []).reduce((sum, r) => sum + Number(r.credit), 0));
      });
    return () => {
      cancelled = true;
    };
  }, [walletId]);
  const code = user
    ? `PAYROXA-${(profile?.first_name || "USER").toUpperCase().replace(/[^A-Z0-9]/g, "")}-${user.id.slice(0, 4).toUpperCase()}`
    : "";

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success("Referral code copied");
    } catch {
      toast.error("Could not copy code");
    }
  };

  const shareInvite = async () => {
    const text = `Join me on Payroxa! Use my referral code ${code} when you sign up.`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Payroxa", text, url: window.location.origin });
      } catch {
        // user cancelled the share sheet
      }
    } else {
      await navigator.clipboard?.writeText(`${text} ${window.location.origin}`);
      toast.success("Invite message copied");
    }
  };
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
                <Trophy className="h-3 w-3" /> Member
              </p>
              <p className="mt-3 text-xs text-white/70">Rewards earned</p>
              <p className="text-3xl font-bold tracking-tight">{formatNaira(earned, 0)}</p>
            </div>
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
              <Gift className="h-7 w-7" />
            </span>
          </div>
          <p className="relative mt-5 text-[11px] text-white/60">
            Includes your sign-up bonus. Loyalty tiers are coming soon.
          </p>
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
              <p className="text-xs text-muted-foreground">Invite friends to join Payroxa.</p>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-secondary p-3">
            <p className="font-mono text-sm">{code}</p>
            <button
              onClick={copyCode}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copy
            </button>
          </div>
          <button
            onClick={shareInvite}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary/30 py-3 text-sm font-semibold text-primary"
          >
            <Share2 className="h-4 w-4" /> Share invite
          </button>
          <p className="mt-3 text-center text-[11px] text-muted-foreground">
            Referral tracking is coming soon.
          </p>
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
              <span className="rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                Soon
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
