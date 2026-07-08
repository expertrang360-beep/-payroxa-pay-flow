import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff, Fingerprint, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Payroxa" }] }),
  component: Login,
});

function Login() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      toast.success("Welcome back to Payroxa!");
      nav({ to: "/home" });
    } catch (err) {
      console.error("Login error:", err);
      const error = err as Error;
      toast.error(error.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/" className="mb-8 inline-flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
            P
          </span>
          <span className="text-base font-semibold">Payroxa</span>
        </Link>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to your account.</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleLogin}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">Email or phone</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@payroxa.co"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-foreground">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                aria-label="Toggle password"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary"
              />{" "}
              Keep me signed in
            </label>
            <Link to="/forgot-password" className="text-xs font-semibold text-primary">
              Forgot?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow transition hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Sign in"}
          </button>

          <button
            type="button"
            onClick={() => {
              toast.info("Biometrics registration is configured in Account Settings.");
            }}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-input bg-background text-sm font-semibold"
          >
            <Fingerprint className="h-4 w-4 text-primary" /> Use biometrics
          </button>
        </form>

        <p className="mt-auto pt-10 text-center text-xs text-muted-foreground">
          New to Payroxa?{" "}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
