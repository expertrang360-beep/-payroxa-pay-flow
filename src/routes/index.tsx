import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  ArrowRight,
  Send,
  Wallet,
  Gift,
  Landmark,
  TrendingUp,
  Star,
  Check,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Payroxa — Powering Every Payment" },
      {
        name: "description",
        content:
          "The elegant financial app for wallets, bills, rewards and the ecosystem powering Africa's future.",
      },
      { property: "og:title", content: "Payroxa — Powering Every Payment" },
      {
        property: "og:description",
        content:
          "Wallets, bills, rewards, and the financial services building Africa's future — in one premium app.",
      },
    ],
  }),
  component: Landing,
});

const highlights = [
  { icon: Send, title: "Instant transfers", copy: "Money moves the moment you tap send." },
  {
    icon: Wallet,
    title: "One wallet, everything",
    copy: "Bills, airtime, data, cable — paid in seconds.",
  },
  {
    icon: Gift,
    title: "Rewards that stack",
    copy: "Cashback, tiers and referrals on every action.",
  },
  {
    icon: ShieldCheck,
    title: "Bank-grade security",
    copy: "Biometrics, PIN and device trust by default.",
  },
];

const ecosystem = [
  { icon: Landmark, label: "Business accounts" },
  { icon: TrendingUp, label: "Savings & investments" },
  { icon: Sparkles, label: "Virtual cards" },
  { icon: Zap, label: "Blockchain-ready" },
];

function Landing() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && user) navigate({ to: "/home", replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-navy text-navy-foreground">
      <div className="absolute inset-0 bg-gradient-navy" />
      <div className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-primary/40 blur-3xl" />
      <div className="absolute top-[45%] -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-14">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10 backdrop-blur">
              <span className="text-lg font-bold">P</span>
            </div>
            <span className="text-lg font-semibold tracking-tight">Payroxa</span>
          </div>
          <Link to="/login" className="text-xs font-semibold text-white/80 hover:text-white">
            Sign in
          </Link>
        </header>

        <main className="flex flex-1 flex-col pt-12">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80">
            <Sparkles className="h-3.5 w-3.5" /> New — Payroxa v1
          </div>
          <h1 className="mt-6 text-5xl font-bold leading-[1.05] tracking-tight">
            Powering
            <br />
            every payment.
          </h1>
          <p className="mt-4 text-base text-white/70">
            One elegant app for wallets, bills, rewards and the financial services building Africa's
            future.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {highlights.map((h) => {
              const Icon = h.icon;
              return (
                <div
                  key={h.title}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10">
                    <Icon className="h-4 w-4" />
                  </span>
                  <p className="mt-3 text-sm font-semibold">{h.title}</p>
                  <p className="mt-1 text-[11px] leading-snug text-white/60">{h.copy}</p>
                </div>
              );
            })}
          </div>

          {/* Trust bar */}
          <div className="mt-8 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex -space-x-2">
              {["AK", "TO", "SI"].map((i, idx) => (
                <div
                  key={i}
                  className={`grid h-7 w-7 place-items-center rounded-full text-[10px] font-semibold ring-2 ring-navy ${
                    idx === 0
                      ? "bg-primary text-primary-foreground"
                      : idx === 1
                        ? "bg-white/20"
                        : "bg-success/70"
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-white/90">
                4.9 <Star className="h-3 w-3 fill-warning text-warning" />
              </div>
              <p className="truncate text-[11px] text-white/60">
                Loved by 120,000+ users across Africa
              </p>
            </div>
          </div>

          {/* Testimonial */}
          <figure className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-sm leading-relaxed text-white/85">
              "Payroxa feels like the first African fintech built to be a real financial home — not
              just a bill app."
            </p>
            <figcaption className="mt-3 flex items-center gap-2 text-[11px] text-white/60">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-white/15 text-[10px] font-semibold text-white">
                TO
              </span>
              Tunde O. · Product designer, Lagos
            </figcaption>
          </figure>

          {/* Ecosystem strip */}
          <div className="mt-6">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-wider text-white/50">
              Built for what's next
            </p>
            <div className="grid grid-cols-2 gap-2">
              {ecosystem.map((e) => {
                const Icon = e.icon;
                return (
                  <div
                    key={e.label}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-xs text-white/80"
                  >
                    <Icon className="h-4 w-4 text-white/70" />
                    <span className="truncate">{e.label}</span>
                    <Check className="ml-auto h-3.5 w-3.5 text-success" />
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        <footer className="mt-10 space-y-3">
          <Link
            to="/register"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-4 text-sm font-semibold text-navy shadow-glow transition hover:opacity-95"
          >
            Create your account <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded-2xl border border-white/15 bg-white/5 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            I already have an account
          </Link>
          <p className="pt-2 text-center text-xs text-white/50">
            By continuing you agree to our Terms & Privacy Policy.
          </p>
        </footer>
      </div>
    </div>
  );
}
