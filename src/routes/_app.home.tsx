import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Send,
  Bell,
  Eye,
  EyeOff,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Globe,
  Gamepad2,
  Gift,
  Repeat,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  Landmark,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLedger, formatEntryDate } from "@/hooks/use-ledger";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — Payroxa" },
      {
        name: "description",
        content:
          "Your Payroxa dashboard: wallet balance, quick actions, insights and recent activity.",
      },
    ],
  }),
  component: HomePage,
});

const services = [
  { key: "airtime", label: "Airtime", icon: Smartphone },
  { key: "data", label: "Data", icon: Wifi },
  { key: "electricity", label: "Electricity", icon: Zap },
  { key: "cable", label: "Cable TV", icon: Tv },
  { key: "internet", label: "Internet", icon: Globe },
  { key: "betting", label: "Betting", icon: Gamepad2 },
  { key: "giftcards", label: "Gift Cards", icon: Gift },
  { key: "airtime-to-cash", label: "A2Cash", icon: Repeat },
] as const;

const BILL_SERVICES = new Set(["electricity", "cable", "internet", "betting", "giftcards"]);
const SPARK_DAYS = 12;

type SpendRow = { service: string; amount: number; fee: number; created_at: string };

function HomePage() {
  const { user, profile, wallet } = useAuth();
  const [hidden, setHidden] = useState(false);
  const { entries: ledgerEntries, loading: ledgerLoading } = useLedger(5);
  const [spend, setSpend] = useState<SpendRow[]>([]);
  const navigate = useNavigate();
  const userId = user?.id;
  const walletVersion = wallet?.updated_at;

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    supabase
      .from("transactions")
      .select("service, amount, fee, created_at")
      .eq("user_id", userId)
      .eq("status", "success")
      .not("service", "in", "(fund_wallet,bonus)")
      .gte("created_at", since)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) console.error("Failed to fetch spending:", error);
        setSpend((data ?? []).map((r) => ({ ...r, amount: Number(r.amount), fee: Number(r.fee) })));
      });
    return () => {
      cancelled = true;
    };
  }, [userId, walletVersion]);

  const insights = useMemo(() => {
    const sum = (rows: SpendRow[]) => rows.reduce((acc, r) => acc + r.amount + r.fee, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daily = Array.from({ length: SPARK_DAYS }, (_, i) => {
      const start = today.getTime() - (SPARK_DAYS - 1 - i) * 86_400_000;
      return sum(
        spend.filter((r) => {
          const t = new Date(r.created_at).getTime();
          return t >= start && t < start + 86_400_000;
        }),
      );
    });
    return {
      total: sum(spend),
      bills: sum(spend.filter((r) => BILL_SERVICES.has(r.service))),
      transfers: sum(spend.filter((r) => r.service === "transfer")),
      airtime: sum(spend.filter((r) => r.service === "airtime" || r.service === "data")),
      daily,
    };
  }, [spend]);

  const max = Math.max(...insights.daily, 1);
  const points = insights.daily
    .map((v, i) => `${(i / (SPARK_DAYS - 1)) * 100},${40 - (v / max) * 34}`)
    .join(" ");

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "";
  const displayName = profile
    ? `${profile.first_name} ${profile.last_name.charAt(0)}.`.trim()
    : (user?.email ?? "");
  const totalBalance = wallet?.available_balance ?? 0;
  const kycLevel = profile?.kyc_level ?? 0;
  const isVerifiedString = profile?.status === "active" ? "Verified" : "Pending verification";

  return (
    <div>
      <div className="px-5 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-primary-foreground font-semibold">
              {initials}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Welcome back</p>
              <p className="text-sm font-semibold">{displayName}</p>
            </div>
          </div>
          <Link
            to="/notifications"
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-secondary hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Wallet card */}
      <section className="px-5 pt-5">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/70">Wallet balance</span>
              <button
                onClick={() => setHidden(!hidden)}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20"
                aria-label="Toggle balance"
              >
                {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {hidden ? "₦ ••••••" : formatNaira(totalBalance)}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
              <span>
                Tier {kycLevel} · {isVerifiedString}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-4 gap-2">
              <button
                onClick={() => navigate({ to: "/fund-wallet" })}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 text-[11px] font-medium hover:bg-white/25"
              >
                <Plus className="h-4 w-4" /> Fund
              </button>
              <button
                onClick={() => navigate({ to: "/transfer" })}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 text-[11px] font-medium hover:bg-white/25"
              >
                <Send className="h-4 w-4" /> Send
              </button>
              <button
                onClick={() =>
                  navigate({ to: "/services/$service", params: { service: "airtime" } })
                }
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 text-[11px] font-medium hover:bg-white/25"
              >
                <Smartphone className="h-4 w-4" /> Airtime
              </button>
              <button
                onClick={() => navigate({ to: "/transactions" })}
                className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 text-[11px] font-medium hover:bg-white/25"
              >
                <ArrowUpRight className="h-4 w-4" /> History
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Insights strip */}
      <section className="px-5 pt-5">
        <div className="rounded-3xl bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Spending · last 30 days
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                {formatNaira(insights.total, 0)}
              </p>
            </div>
            <svg viewBox="0 0 100 40" className="h-14 w-32" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
              />
              <polygon fill="url(#spark)" points={`0,40 ${points} 100,40`} />
            </svg>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-4">
            {[
              { label: "Bills", value: insights.bills },
              { label: "Transfers", value: insights.transfers },
              { label: "Airtime/Data", value: insights.airtime },
            ].map((c) => (
              <div key={c.label}>
                <p className="text-[10px] text-muted-foreground">{c.label}</p>
                <p className="text-sm font-semibold">{formatNaira(c.value, 0)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Services</h2>
          <Link to="/payments" className="text-xs font-medium text-primary">
            See all
          </Link>
        </div>
        <div className="grid grid-cols-4 gap-3 rounded-3xl bg-card p-4 shadow-soft">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.key}
                to="/services/$service"
                params={{ service: s.key }}
                className="flex flex-col items-center gap-2 rounded-2xl py-2 text-center transition hover:bg-secondary"
              >
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-[11px] font-medium text-foreground">{s.label}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Business promo */}
      <section className="px-5 pt-6">
        <Link
          to="/business"
          className="flex items-center gap-4 overflow-hidden rounded-3xl bg-navy p-5 text-navy-foreground shadow-card"
        >
          <div className="flex-1">
            <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> New
            </p>
            <h3 className="mt-2 text-base font-semibold leading-tight">Payroxa for Business</h3>
            <p className="mt-1 text-xs text-white/70">
              Invoices, payment links and a shared team wallet.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-white">
              Explore <ChevronRight className="h-3 w-3" />
            </span>
          </div>
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-white/10">
            <Landmark className="h-8 w-8" />
          </div>
        </Link>
      </section>

      {/* Recent transactions */}
      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent activity</h2>
          <Link to="/transactions" className="text-xs font-medium text-primary">
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
                {ledgerLoading ? "Loading…" : "No recent activity"}
              </p>
              <p className="text-xs mt-1">Fund your wallet to make transactions.</p>
            </li>
          )}
        </ul>
      </section>

      {/* Security tip */}
      <section className="px-5 py-6">
        <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-success/10 text-success">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold">Security tip</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Never share your transaction PIN or OTP. Payroxa will never ask for them.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
