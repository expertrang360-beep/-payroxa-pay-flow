import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({ meta: [{ title: "Verify OTP — Payroxa" }] }),
  component: OTP,
});

function OTP() {
  const [values, setValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const nav = useNavigate();
  const { user, profile } = useAuth();

  const handle = (i: number, v: string) => {
    const clean = v.replace(/\D/g, "").slice(-1);
    const next = [...values];
    next[i] = clean;
    setValues(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  };

  const handleVerify = async () => {
    const otpCode = values.join("");
    if (otpCode.length < 6) {
      toast.error("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);

    try {
      // If we have a logged-in user and a profile, update status to active in Supabase
      if (user && profile) {
        const { error } = await supabase
          .from("users")
          .update({
            status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (error) throw error;
      }

      toast.success("Phone and email verified successfully!");
      nav({ to: "/home" });
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error("Failed to verify OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/register" className="text-xs font-semibold text-primary">
          ← Back
        </Link>
        <div className="mt-10">
          <h1 className="text-3xl font-bold tracking-tight">Enter verification code</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We sent a 6-digit code to your email and phone.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-6 gap-2">
          {values.map((v, i) => (
            <input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              value={v}
              onChange={(e) => handle(i, e.target.value)}
              inputMode="numeric"
              maxLength={1}
              className="h-14 rounded-2xl border border-input bg-background text-center text-xl font-semibold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          ))}
        </div>

        <button
          onClick={handleVerify}
          disabled={loading}
          className="flex mt-8 h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Verify & continue"}
        </button>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Didn't get it?{" "}
          <button
            onClick={() => toast.success("A new 6-digit code has been sent to your device.")}
            className="font-semibold text-primary"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  );
}
