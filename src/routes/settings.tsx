import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { Bell, Moon, Fingerprint, Shield, Smartphone, ChevronRight } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Payroxa" }] }),
  component: Settings,
});

function Toggle({ v, on }: { v: boolean; on: () => void }) {
  return (
    <button
      onClick={on}
      className={`relative h-6 w-11 rounded-full transition ${v ? "bg-primary" : "bg-secondary"}`}
      aria-pressed={v}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition ${v ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

function Settings() {
  const [notif, setNotif] = useState(true);
  const [bio, setBio] = useState(true);
  const [dark, setDark] = useState(false);

  const toggleDark = () => {
    setDark(!dark);
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark");
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Settings" back="/profile" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <ul className="divide-y divide-border rounded-2xl bg-card shadow-soft">
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Bell className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium">Push notifications</span>
            <Toggle v={notif} on={() => setNotif(!notif)} />
          </li>
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Fingerprint className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium">Biometric login</span>
            <Toggle v={bio} on={() => setBio(!bio)} />
          </li>
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Moon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium">Dark mode</span>
            <Toggle v={dark} on={toggleDark} />
          </li>
        </ul>

        <ul className="mt-4 divide-y divide-border rounded-2xl bg-card shadow-soft">
          {[
            { icon: Shield, label: "Change transaction PIN" },
            { icon: Smartphone, label: "Device management" },
          ].map((it) => {
            const Icon = it.icon;
            return (
              <li key={it.label} className="flex items-center gap-3 p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium">{it.label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
