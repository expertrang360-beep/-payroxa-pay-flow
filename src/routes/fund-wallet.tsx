import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { CreditCard, Banknote, Building2, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { RequireAuth } from "@/components/app/require-auth";
import { callRpc, errorMessage } from "@/lib/rpc";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/fund-wallet")({
  head: () => ({ meta: [{ title: "Fund Wallet — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <Fund />
    </RequireAuth>
  ),
});

const MIN_FUNDING = 100;
const MAX_FUNDING = 1_000_000;

const methods = [
  { key: "card", label: "Debit / Credit Card", icon: CreditCard, meta: "Instant" },
  { key: "transfer", label: "Bank Transfer", icon: Building2, meta: "Free · 2 min" },
  { key: "ussd", label: "USSD", icon: Banknote, meta: "Any bank" },
];

function Fund() {
  const nav = useNavigate();
  const { wallet, refreshWallet } = useAuth();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("card");
  const [loading, setLoading] = useState(false);

  const handleFund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      toast.error("Your wallet is not available yet. Please try again shortly.");
      return;
    }
    const fundAmount = Number(amount);
    if (!Number.isFinite(fundAmount) || fundAmount < MIN_FUNDING) {
      toast.error(`Minimum funding amount is ${formatNaira(MIN_FUNDING, 0)}.`);
      return;
    }
    if (fundAmount > MAX_FUNDING) {
      toast.error(`Maximum funding amount is ${formatNaira(MAX_FUNDING, 0)}.`);
      return;
    }

    setLoading(true);
    try {
      const result = await callRpc("fund_wallet", { p_amount: fundAmount, p_method: method });
      await refreshWallet();
      toast.success("Wallet funded successfully!", {
        description: `${formatNaira(fundAmount)} has been added to your balance. Ref: ${result.reference}`,
      });
      nav({ to: "/wallet" });
    } catch (err) {
      console.error("Funding error:", err);
      toast.error(errorMessage(err, "Failed to fund wallet. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Fund Wallet" back="/wallet" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <form onSubmit={handleFund}>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                ₦
              </span>
              <input
                required
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
                className="h-16 w-full rounded-2xl border border-input bg-background pl-10 pr-4 text-2xl font-bold outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                placeholder="0"
              />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {["1000", "5000", "10000", "25000", "50000"].map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAmount(a)}
                  className="rounded-full bg-secondary px-3 py-1 text-xs font-medium hover:bg-accent"
                >
                  ₦{Number(a).toLocaleString()}
                </button>
              ))}
            </div>
          </label>

          <div className="mt-6">
            <span className="mb-2 block text-xs font-medium">Payment method</span>
            <ul className="space-y-2">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = method === m.key;
                return (
                  <li key={m.key}>
                    <button
                      type="button"
                      onClick={() => setMethod(m.key)}
                      className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${
                        active ? "border-primary bg-primary-soft" : "border-input bg-card"
                      }`}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center rounded-xl ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{m.label}</p>
                        <p className="text-xs text-muted-foreground">{m.meta}</p>
                      </div>
                      <span
                        className={`h-5 w-5 rounded-full border-2 ${active ? "border-primary bg-primary" : "border-input"}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex mt-8 h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Fund wallet"}
          </button>
        </form>
      </main>
    </div>
  );
}
