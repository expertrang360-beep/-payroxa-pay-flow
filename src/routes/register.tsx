import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mail, Lock, User, Phone, Loader2 } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { errorMessage } from "@/lib/rpc";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Create account — Payroxa" }] }),
  component: Register,
});

function Register() {
  const nav = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const names = fullName.trim().split(/\s+/).filter(Boolean);
    if (names.length < 2) {
      toast.error("Please enter your first and last name.");
      return;
    }
    if (!/^\+?[0-9\s-]{10,16}$/.test(phone.trim())) {
      toast.error("Please enter a valid phone number.");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      // The profile and wallet are created server-side by the on_auth_user_created trigger.
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: {
            first_name: names[0],
            last_name: names.slice(1).join(" "),
            phone: phone.replace(/[\s-]/g, ""),
          },
        },
      });
      if (error) throw error;

      if (data.session) {
        toast.success("Account created successfully!");
        nav({ to: "/home" });
      } else {
        toast.success("Account created! Check your email for a verification code.");
        nav({ to: "/verify-otp", search: { email: cleanEmail } });
      }
    } catch (err) {
      console.error("Registration error:", err);
      toast.error(errorMessage(err, "Failed to create account. Please try again."));
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
          <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-muted-foreground">Takes less than a minute.</p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Full name</span>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Email</span>
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
            <span className="mb-1.5 block text-xs font-medium">Phone</span>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+234 800 000 0000"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Password</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                minLength={8}
                autoComplete="new-password"
                className="h-12 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continue"}
          </button>
        </form>

        <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
