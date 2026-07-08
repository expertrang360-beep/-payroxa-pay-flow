import { createFileRoute, Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Reset password — Payroxa" }] }),
  component: Forgot,
});

function Forgot() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pb-10 pt-12">
        <Link to="/login" className="text-xs font-semibold text-primary">
          ← Back to sign in
        </Link>
        <div className="mt-10">
          <h1 className="text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            We'll send a reset link to your email.
          </p>
        </div>
        <form className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Email</span>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="you@payroxa.co"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>
          <button
            type="submit"
            className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow"
          >
            Send reset link
          </button>
        </form>
      </div>
    </div>
  );
}
