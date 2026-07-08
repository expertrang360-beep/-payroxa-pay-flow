import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Globe,
  Gamepad2,
  Gift,
  Repeat,
  CreditCard,
  QrCode,
  Link2,
  Banknote,
  PiggyBank,
  TrendingUp,
  Landmark,
  Shield,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_app/payments")({
  head: () => ({
    meta: [
      { title: "Payments — Payroxa" },
      {
        name: "description",
        content: "Airtime, data, bills, gift cards and more — all in one place.",
      },
    ],
  }),
  component: Payments,
});

const bills = [
  { key: "airtime", label: "Airtime", icon: Smartphone, tint: "text-primary bg-primary-soft" },
  { key: "data", label: "Data", icon: Wifi, tint: "text-primary bg-primary-soft" },
  { key: "electricity", label: "Electricity", icon: Zap, tint: "text-warning bg-warning/10" },
  { key: "cable", label: "Cable TV", icon: Tv, tint: "text-primary bg-primary-soft" },
  { key: "internet", label: "Internet", icon: Globe, tint: "text-primary bg-primary-soft" },
  { key: "betting", label: "Betting", icon: Gamepad2, tint: "text-success bg-success/10" },
  { key: "giftcards", label: "Gift Cards", icon: Gift, tint: "text-primary bg-primary-soft" },
  {
    key: "airtime-to-cash",
    label: "Airtime → Cash",
    icon: Repeat,
    tint: "text-primary bg-primary-soft",
  },
];

const future = [
  { label: "Virtual Cards", icon: CreditCard },
  { label: "Payment Links", icon: Link2 },
  { label: "QR Payments", icon: QrCode },
  { label: "Business Account", icon: Landmark },
  { label: "Savings", icon: PiggyBank },
  { label: "Investments", icon: TrendingUp },
  { label: "Loans", icon: Banknote },
  { label: "Insurance", icon: Shield },
];

function Payments() {
  return (
    <div>
      <div className="px-5 pt-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">Everyday bills and money movement.</p>
      </div>

      {/* Business entry */}
      <section className="px-5 pt-5">
        <Link
          to="/business"
          className="group flex items-center gap-4 overflow-hidden rounded-3xl bg-navy p-5 text-navy-foreground shadow-card"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/10">
            <Landmark className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Business
            </p>
            <p className="mt-1.5 text-sm font-semibold">Payroxa for Business</p>
            <p className="truncate text-[11px] text-white/70">Invoices, links, team wallet</p>
          </div>
          <ChevronRight className="h-5 w-5 text-white/70 transition group-hover:translate-x-0.5" />
        </Link>
      </section>

      <section className="px-5 pt-5">
        <h2 className="mb-3 text-sm font-semibold">Bills & recharges</h2>
        <div className="grid grid-cols-2 gap-3">
          {bills.map((b) => {
            const Icon = b.icon;
            return (
              <Link
                key={b.key}
                to="/services/$service"
                params={{ service: b.key }}
                className="group flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${b.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{b.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">Pay in seconds</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-5 pb-6 pt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Coming soon</h2>
          <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
            Preview
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {future.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.label}
                to="/coming-soon/$feature"
                params={{ feature: f.label.toLowerCase().replace(/\s+/g, "-") }}
                className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-4 transition hover:bg-card"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-muted-foreground">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{f.label}</p>
                  <p className="truncate text-[11px] text-muted-foreground">Coming soon</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
