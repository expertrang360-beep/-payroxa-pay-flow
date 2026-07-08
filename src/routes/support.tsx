import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { MessageCircle, Mail, Phone, ChevronRight, Search } from "lucide-react";

export const Route = createFileRoute("/support")({
  head: () => ({ meta: [{ title: "Help & Support — Payroxa" }] }),
  component: Support,
});

const faqs = [
  "How do I fund my wallet?",
  "Why did my transaction fail?",
  "How does the referral program work?",
  "How do I complete KYC verification?",
  "Is Payroxa safe to use?",
];

function Support() {
  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Help & Support" back="/profile" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search help articles"
            className="h-11 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
          />
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { icon: MessageCircle, label: "Live chat" },
            { icon: Mail, label: "Email us" },
            { icon: Phone, label: "Call us" },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 shadow-soft"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold">{c.label}</span>
              </button>
            );
          })}
        </div>

        <h2 className="mb-2 mt-6 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Popular questions
        </h2>
        <ul className="divide-y divide-border rounded-2xl bg-card shadow-soft">
          {faqs.map((f) => (
            <li key={f} className="flex items-center gap-3 p-4">
              <span className="flex-1 text-sm">{f}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
