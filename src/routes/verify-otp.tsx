import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { errorMessage } from "@/lib/rpc";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify email — Payroxa" }] }),
  validateSearch: (search: Record<string, unknown>): { email?: string } => ({
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  component: OTP,
});

function OTP() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email ?? "");
  const [values, setValues] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user?.email_confirmed_at) nav({ to: "/home", replace: true });
  }, [authLoading, user, nav]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handle = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    const next = [...values];
    if (digits.length > 1) {
      digits
        .slice(0, CODE_LENGTH - i)
        .split("")
        .forEach((d, k) => (next[i + k] = d));
      setValues(next);
      refs.current[Math.min(i + digits.length, CODE_LENGTH - 1)]?.focus();
      return;
    }
    next[i] = digits;
    setValues(next);
    if (digits && i < CODE_LENGTH - 1) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !values[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = values.join("");
    if (!email.trim()) {
      toast.error("Enter the email address you signed up with.");
      return;
    }
    if (token.length < CODE_LENGTH) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (error) throw error;
      toast.success("Email verified successfully!");
      nav({ to: "/home" });
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(errorMessage(err, "Invalid or expired code. Please try again."));
      setValues(Array(CODE_LENGTH).fill(""));
      refs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error("Enter the email address you signed up with.");
      return;
    }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/home` },
      });
      if (error) throw error;
      toast.success("A new verification code has been sent to your email.");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(errorMessage(err, "Could not resend the code. Please try again."));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/login" className="text-xs font-semibold text-primary">
          ← Back to sign in
        </Link>
        <div className="mt-10">
          <h1 className="text-3xl font-bold tracking-tight">Verify your email</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {search.email ? (
              <>
                We sent a 6-digit code to <span className="font-semibold">{search.email}</span>.
              </>
            ) : (
              "Enter your email and the 6-digit code we sent you."
            )}
          </p>
        </div>

        <form onSubmit={handleVerify}>
          {!search.email && (
            <label className="mt-8 block">
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
          )}

          <div className="mt-8 grid grid-cols-6 gap-2">
            {values.map((v, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                value={v}
                onChange={(e) => handle(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                className="h-14 rounded-2xl border border-input bg-background text-center text-xl font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & continue"}
          </button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Didn't get it?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="font-semibold text-primary disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? "Sending…" : "Resend"}
          </button>
        </p>
      </div>
    </div>
  );
}
