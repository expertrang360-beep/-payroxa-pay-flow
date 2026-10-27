import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { RequireAuth } from "@/components/app/require-auth";
import { Moon, Shield, LogOut, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/rpc";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <Settings />
    </RequireAuth>
  ),
});

const THEME_KEY = "payroxa-theme";

function Toggle({ v, on, label }: { v: boolean; on: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={on}
      className={`relative h-6 w-11 rounded-full transition ${v ? "bg-primary" : "bg-secondary"}`}
      aria-pressed={v}
      aria-label={label}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-soft transition ${v ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}

const pinInputClass =
  "h-12 w-full rounded-2xl border border-input bg-background px-4 text-center text-lg tracking-[0.5em] outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

function PinForm() {
  const { profile, setPin } = useAuth();
  const hasPin = !!profile?.pin_set;
  const [current, setCurrent] = useState("");
  const [pin, setNewPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 4);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) return toast.error("PIN must be exactly 4 digits.");
    if (pin !== confirm) return toast.error("PINs do not match.");
    if (hasPin && !/^\d{4}$/.test(current)) return toast.error("Enter your current PIN.");
    setSaving(true);
    try {
      await setPin(pin, hasPin ? current : undefined);
      toast.success(hasPin ? "Transaction PIN changed." : "Transaction PIN set.");
      setCurrent("");
      setNewPin("");
      setConfirm("");
    } catch (err) {
      toast.error(errorMessage(err, "Could not update PIN."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
          <Shield className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium">
            {hasPin ? "Change transaction PIN" : "Set transaction PIN"}
          </p>
          <p className="text-xs text-muted-foreground">
            Required to authorize transfers and payments.
          </p>
        </div>
      </div>
      {hasPin && (
        <input
          type="password"
          inputMode="numeric"
          autoComplete="off"
          aria-label="Current PIN"
          placeholder="Current PIN"
          value={current}
          onChange={(e) => setCurrent(onlyDigits(e.target.value))}
          className={pinInputClass}
        />
      )}
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label="New PIN"
        placeholder="New PIN"
        value={pin}
        onChange={(e) => setNewPin(onlyDigits(e.target.value))}
        className={pinInputClass}
      />
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        aria-label="Confirm new PIN"
        placeholder="Confirm PIN"
        value={confirm}
        onChange={(e) => setConfirm(onlyDigits(e.target.value))}
        className={pinInputClass}
      />
      <button
        type="submit"
        disabled={saving}
        className="flex h-11 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save PIN"}
      </button>
    </form>
  );
}

function Settings() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem(THEME_KEY, next ? "dark" : "light");
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      nav({ to: "/login" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not sign out."));
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Settings" back="/profile" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <ul className="divide-y divide-border rounded-2xl bg-card shadow-soft">
          <li className="flex items-center gap-3 p-4">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary">
              <Moon className="h-4 w-4" />
            </span>
            <span className="flex-1 text-sm font-medium">Dark mode</span>
            <Toggle v={dark} on={toggleDark} label="Toggle dark mode" />
          </li>
        </ul>

        <div className="mt-4 rounded-2xl bg-card shadow-soft">
          <PinForm />
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-card p-4 text-sm font-semibold text-destructive shadow-soft"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </main>
    </div>
  );
}
