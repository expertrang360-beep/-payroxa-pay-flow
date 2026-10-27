import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Mail, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { errorMessage } from "@/lib/rpc";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Payroxa" }] }),
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      toast.error(errorMessage(err, "Could not send reset link. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/login" className="text-xs font-semibold text-primary">
          ← Back to sign in
        </Link>
        {sent ? (
          <div className="mt-10">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <MailCheck className="h-6 w-6" />
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight">Check your email</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              If an account exists for <span className="font-semibold">{email}</span>, you'll
              receive a link to reset your password.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-10">
              <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                We'll send a reset link to your email.
              </p>
            </div>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">Email</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@payroxa.co"
                    className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  />
                </div>
              </label>
              <button
                type="submit"
                disabled={loading}
                className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send reset link"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
