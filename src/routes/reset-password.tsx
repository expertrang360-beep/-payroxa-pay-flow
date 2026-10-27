import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/rpc";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Payroxa" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { user, loading: authLoading, passwordRecovery, endPasswordRecovery } = useAuth();
  const nav = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      endPasswordRecovery();
      toast.success("Password updated successfully.");
      nav({ to: "/home" });
    } catch (err) {
      toast.error(errorMessage(err, "Could not update password. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/login" className="text-xs font-semibold text-primary">
          ← Back to sign in
        </Link>
        <div className="mt-10">
          <h1 className="text-3xl font-bold tracking-tight">Set a new password</h1>
        </div>
        {authLoading ? (
          <Loader2 className="mt-8 h-6 w-6 animate-spin text-primary" />
        ) : !user || !passwordRecovery ? (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              This reset link is invalid or has expired. Request a new one to continue.
            </p>
            <Link
              to="/forgot-password"
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Request new link
            </Link>
          </div>
        ) : (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {[
              { label: "New password", value: password, set: setPassword },
              { label: "Confirm password", value: confirm, set: setConfirm },
            ].map((f) => (
              <label key={f.label} className="block">
                <span className="mb-1.5 block text-xs font-medium">{f.label}</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </div>
              </label>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
