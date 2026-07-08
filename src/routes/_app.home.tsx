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
  TrendingUp,
  TrendingDown,
  Calendar,
  Landmark,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { LedgerEntry } from "@/types";

export const Route = createFileRoute("/_app/home")({
  head: () => ({
    meta: [
      { title: "Home — Payroxa" },
      {
        name: "description",
        content:
          "Your Payroxa dashboard: wallet balance, quick actions, insights and upcoming bills.",
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

const upcoming = [
  { name: "Ikeja Electric", due: "Due in 2 days", amount: 12500, icon: Zap },
  { name: "DSTV Compact", due: "Due in 5 days", amount: 9500, icon: Tv },
];

// Sparkline points for the spending chart
const spark = [22, 30, 18, 42, 28, 46, 34, 52, 40, 58, 48, 62];

function HomePage() {
  const { user, profile, wallet } = useAuth();
  const [hidden, setHidden] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([]);
  const navigate = useNavigate();
  const max = Math.max(...spark);
  const points = spark
    .map((v, i) => `${(i / (spark.length - 1)) * 100},${40 - (v / max) * 34}`)
    .join(" ");

  useEffect(() => {
    if (!user || !wallet) return;

    const fetchLedger = async () => {
      try {
        const { data, error } = await supabase
          .from("ledger")
          .select("*")
          .eq("wallet_id", wallet.id)
          .order("created_at", { ascending: false })
          .limit(5);

        if (error) throw error;
        setLedgerEntries((data || []) as LedgerEntry[]);
      } catch (err) {
        console.error("Failed to fetch ledger entries:", err);
      }
    };

    fetchLedger();
  }, [user, wallet]);

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "AK";

  const displayName = profile
    ? `${profile.first_name} ${profile.last_name.charAt(0)}.`
    : "Adaeze K.";

  const totalBalance = wallet ? wallet.available_balance : 128450.75;
  const kycLevel = profile ? profile.kyc_level : 2;
  const isVerifiedString = profile
    ? profile.status === "active"
      ? "Verified"
      : "Pending Verify"
    : "Verified";

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
            className="relative grid h-10 w-10 place-items-center rounded-xl bg-secondary hover:bg-accent"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
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
              {hidden
                ? "₦ ••••••"
                : `₦ ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            </p>
            <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
              <span>
                Tier {kycLevel} · {isVerifiedString}
              </span>
              <span className="h-1 w-1 rounded-full bg-white/40" />
              <span className="inline-flex items-center gap-1 text-success-foreground/90">
                <TrendingUp className="h-3 w-3" /> +8.2% this week
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
                Spending · Jul
              </p>
              <p className="mt-1 text-xl font-bold tracking-tight">
                ₦{" "}
                {ledgerEntries
                  .filter((t) => t.type === "debit")
                  .reduce((sum, t) => sum + t.debit, 0)
                  .toLocaleString()}
              </p>
              <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-destructive">
                <TrendingDown className="h-3 w-3" /> 12% less than last month
              </div>
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
            <div>
              <p className="text-[10px] text-muted-foreground">Bills</p>
              <p className="text-sm font-semibold">
                ₦{" "}
                {ledgerEntries
                  .filter((t) => t.type === "debit" && t.description.toLowerCase().includes("bill"))
                  .reduce((sum, t) => sum + t.debit, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Transfers</p>
              <p className="text-sm font-semibold">
                ₦{" "}
                {ledgerEntries
                  .filter(
                    (t) => t.type === "debit" && t.description.toLowerCase().includes("transfer"),
                  )
                  .reduce((sum, t) => sum + t.debit, 0)
                  .toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Airtime/Data</p>
              <p className="text-sm font-semibold">
                ₦{" "}
                {ledgerEntries
                  .filter(
                    (t) =>
                      t.type === "debit" &&
                      (t.description.toLowerCase().includes("airtime") ||
                        t.description.toLowerCase().includes("data")),
                  )
                  .reduce((sum, t) => sum + t.debit, 0)
                  .toLocaleString()}
              </p>
            </div>
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

      {/* Upcoming bills */}
      <section className="px-5 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Upcoming bills</h2>
          <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning-foreground">
            2 due
          </span>
        </div>
        <ul className="space-y-2">
          {upcoming.map((u) => {
            const Icon = u.icon;
            return (
              <li
                key={u.name}
                className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning/15 text-warning-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{u.name}</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Calendar className="h-3 w-3" /> {u.due}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">₦{u.amount.toLocaleString()}</p>
                  <button className="mt-0.5 text-[11px] font-semibold text-primary">Pay now</button>
                </div>
              </li>
            );
          })}
        </ul>
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
                    {new Date(t.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.type === "credit" ? "text-success" : "text-foreground"}`}
                >
                  {t.type === "credit" ? "+" : "−"}₦
                  {Math.abs(t.type === "credit" ? t.credit : t.debit).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </p>
              </li>
            ))
          ) : (
            <li className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
              <p className="text-sm font-medium">No recent activity</p>
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
