import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import {
  Landmark,
  FileText,
  Link2,
  Users,
  QrCode,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/business")({
  head: () => ({
    meta: [
      { title: "Payroxa for Business — Merchant tools" },
      {
        name: "description",
        content:
          "Invoices, payment links, team wallets and merchant analytics — built for African businesses.",
      },
      { property: "og:title", content: "Payroxa for Business" },
      {
        property: "og:description",
        content: "Invoices, payment links, team wallets and merchant analytics.",
      },
    ],
  }),
  component: Business,
});

const tools = [
  {
    icon: FileText,
    label: "Invoices",
    meta: "12 pending",
    to: "/coming-soon/$feature",
    param: "invoices",
  },
  {
    icon: Link2,
    label: "Payment links",
    meta: "3 active",
    to: "/coming-soon/$feature",
    param: "payment-links",
  },
  {
    icon: QrCode,
    label: "In-store QR",
    meta: "Enable",
    to: "/coming-soon/$feature",
    param: "qr-payments",
  },
  {
    icon: Users,
    label: "Team access",
    meta: "2 members",
    to: "/coming-soon/$feature",
    param: "team-access",
  },
];

const activity = [
  {
    name: "Jane Odum · Invoice #218",
    meta: "Paid · 12:04",
    amount: 45000,
    type: "credit" as const,
  },
  { name: "Payout to GTB ••2201", meta: "Yesterday", amount: -120000, type: "debit" as const },
  {
    name: "Link · Website checkout",
    meta: "Yesterday · 08:32",
    amount: 18500,
    type: "credit" as const,
  },
];

function Business() {
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Payroxa Business" back="/payments" />

      <main className="mx-auto max-w-md pb-16">
        {/* Business wallet card */}
        <section className="px-5 pt-4">
          <div className="relative overflow-hidden rounded-3xl bg-navy p-5 text-navy-foreground shadow-card">
            <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/25 blur-2xl" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium">
                  <Landmark className="h-3 w-3" /> Merchant wallet
                </div>
                <span className="rounded-full bg-success/20 px-2 py-0.5 text-[10px] font-medium text-success">
                  Live
                </span>
              </div>
              <p className="mt-3 text-xs text-white/70">Payroxa Coffee Co.</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">₦ 842,300.00</p>
              <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-white/70">
                <TrendingUp className="h-3 w-3 text-success" /> +₦ 128k this week
              </p>

              <div className="mt-5 grid grid-cols-3 gap-2">
                <button className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3 text-[11px] font-medium hover:bg-white/20">
                  <Plus className="h-4 w-4" /> Request
                </button>
                <button className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3 text-[11px] font-medium hover:bg-white/20">
                  <ArrowUpRight className="h-4 w-4" /> Payout
                </button>
                <button className="flex flex-col items-center gap-1 rounded-2xl bg-white/10 py-3 text-[11px] font-medium hover:bg-white/20">
                  <FileText className="h-4 w-4" /> Invoice
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-3 gap-3 px-5 pt-5">
          {[
            { label: "Today", value: "₦ 82.4k", sub: "24 orders" },
            { label: "Week", value: "₦ 512k", sub: "+18%" },
            { label: "Customers", value: "1,240", sub: "+32 new" },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl bg-card p-3 shadow-soft">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {k.label}
              </p>
              <p className="mt-1 text-sm font-bold">{k.value}</p>
              <p className="text-[10px] text-muted-foreground">{k.sub}</p>
            </div>
          ))}
        </section>

        {/* Tools */}
        <section className="px-5 pt-6">
          <h2 className="mb-3 text-sm font-semibold">Business tools</h2>
          <div className="grid grid-cols-2 gap-3">
            {tools.map((t) => {
              const Icon = t.icon;
              return (
                <Link
                  key={t.label}
                  to={t.to}
                  params={{ feature: t.param }}
                  className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{t.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{t.meta}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Recent business activity */}
        <section className="px-5 pt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent</h2>
            <button className="inline-flex items-center gap-0.5 text-xs font-medium text-primary">
              View all <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <ul className="divide-y divide-border rounded-3xl bg-card shadow-soft">
            {activity.map((t) => (
              <li key={t.name} className="flex items-center gap-3 p-4">
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
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.meta}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${t.type === "credit" ? "text-success" : "text-foreground"}`}
                >
                  {t.type === "credit" ? "+" : "−"}₦{Math.abs(t.amount).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Upgrade banner */}
        <section className="px-5 pt-6">
          <div className="flex items-center gap-4 rounded-3xl bg-gradient-brand p-5 text-white shadow-glow">
            <div className="flex-1">
              <p className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                <Sparkles className="h-3 w-3" /> Pro
              </p>
              <h3 className="mt-2 text-base font-semibold leading-tight">Unlock analytics & API</h3>
              <p className="mt-1 text-xs text-white/80">
                Deeper reports, webhooks and the Payroxa API.
              </p>
            </div>
            <Link
              to="/coming-soon/$feature"
              params={{ feature: "business-pro" }}
              className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-primary"
            >
              Upgrade
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
