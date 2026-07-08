import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronRight,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  BadgeCheck,
  Fingerprint,
  Smartphone,
  Moon,
  FileText,
  CreditCard,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Payroxa" },
      { name: "description", content: "Manage your Payroxa account, security and preferences." },
    ],
  }),
  component: Profile,
});

const groups = [
  {
    title: "Account",
    items: [
      { label: "Personal information", icon: BadgeCheck, to: "/settings" },
      { label: "KYC verification", icon: Shield, to: "/kyc", meta: "Tier 2" },
      { label: "Linked cards & banks", icon: CreditCard, to: "/settings" },
    ],
  },
  {
    title: "Security",
    items: [
      { label: "Transaction PIN", icon: Shield, to: "/settings" },
      { label: "Biometric login", icon: Fingerprint, to: "/settings" },
      { label: "Device management", icon: Smartphone, to: "/settings" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { label: "Notifications", icon: Bell, to: "/notifications" },
      { label: "Appearance", icon: Moon, to: "/settings" },
      { label: "Statements", icon: FileText, to: "/transactions" },
    ],
  },
  {
    title: "Support",
    items: [{ label: "Help center", icon: HelpCircle, to: "/support" }],
  },
] as const;

function Profile() {
  const { profile } = useAuth();
  const nav = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Successfully signed out.");
      nav({ to: "/login" });
    } catch (err) {
      console.error("Sign out error:", err);
      toast.error("Failed to sign out. Please try again.");
    }
  };

  const initials = profile
    ? `${profile.first_name.charAt(0)}${profile.last_name.charAt(0)}`.toUpperCase()
    : "AK";

  const fullName = profile ? `${profile.first_name} ${profile.last_name}` : "Adaeze Kanu";

  const emailAndPhone = profile
    ? `${profile.email} · ${profile.phone}`
    : "adaeze@payroxa.co · +234 803 000 0000";

  const kycLevel = profile ? `Tier ${profile.kyc_level}` : "Tier 2";
  const statusString = profile
    ? profile.status === "active"
      ? "Verified"
      : "Pending"
    : "Verified";

  return (
    <div>
      <div className="px-5 pt-6">
        <div className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-soft">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground text-lg font-semibold">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold">{fullName}</p>
            <p className="truncate text-xs text-muted-foreground">{emailAndPhone}</p>
            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
              <BadgeCheck className="h-3 w-3" /> {statusString}
            </span>
          </div>
        </div>
      </div>

      {groups.map((g) => (
        <section key={g.title} className="px-5 pt-6">
          <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {g.title}
          </h2>
          <ul className="divide-y divide-border rounded-2xl bg-card shadow-soft">
            {g.items.map((it) => {
              const Icon = it.icon;
              const metaVal =
                it.label === "KYC verification" ? kycLevel : "meta" in it ? it.meta : undefined;
              return (
                <li key={it.label}>
                  <Link to={it.to} className="flex items-center gap-3 p-4 hover:bg-secondary/60">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium">{it.label}</span>
                    {metaVal && (
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                        {metaVal}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      <div className="px-5 py-8">
        <button
          onClick={handleSignOut}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3 text-sm font-semibold text-destructive hover:bg-destructive/5 transition"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
        <p className="mt-4 text-center text-[11px] text-muted-foreground">
          Payroxa v1.0 · Powering Every Payment.
        </p>
      </div>
    </div>
  );
}
