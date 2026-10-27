import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { RequireAuth } from "@/components/app/require-auth";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { callRpc, errorMessage } from "@/lib/rpc";
import { formatNaira } from "@/lib/utils";

export const Route = createFileRoute("/transfer")({
  head: () => ({ meta: [{ title: "Send Money — Payroxa" }] }),
  component: () => (
    <RequireAuth>
      <Transfer />
    </RequireAuth>
  ),
});

const BANKS = ["GTBank", "Access Bank", "Zenith Bank", "UBA", "First Bank", "Payroxa"];
const MIN_TRANSFER = 100;

const inputClass =
  "h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15";

function Transfer() {
  const nav = useNavigate();
  const { wallet, refreshWallet, profile } = useAuth();
  const [bank, setBank] = useState(BANKS[0]);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const balance = wallet?.available_balance ?? 0;

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) {
      toast.error("Your wallet is not available yet. Please try again shortly.");
      return;
    }
    const transferAmount = Number(amount);
    if (!/^\d{10}$/.test(accountNumber)) {
      toast.error("Account number must be 10 digits.");
      return;
    }
    if (!Number.isFinite(transferAmount) || transferAmount < MIN_TRANSFER) {
      toast.error(`Minimum transfer amount is ${formatNaira(MIN_TRANSFER, 0)}.`);
      return;
    }
    if (transferAmount > balance) {
      toast.error("Insufficient balance.", {
        description: `Your available balance is ${formatNaira(balance)}`,
      });
      return;
    }
    if (!/^\d{4}$/.test(pin)) {
      toast.error("Enter your 4-digit transaction PIN.");
      return;
    }

    setLoading(true);
    try {
      const result = await callRpc("transfer_funds", {
        p_bank: bank,
        p_account_number: accountNumber,
        p_amount: transferAmount,
        p_note: note.trim(),
        p_pin: pin,
      });
      await refreshWallet();
      toast.success("Transfer sent successfully!", {
        description: `${formatNaira(transferAmount)} sent to ${bank} (${accountNumber}). Ref: ${result.reference}`,
      });
      nav({ to: "/wallet" });
    } catch (err) {
      console.error("Transfer failed:", err);
      toast.error(errorMessage(err, "Failed to process transfer. Please try again."));
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Send Money" back="/wallet" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <p className="mb-4 text-xs text-muted-foreground">
          Available balance: <span className="font-semibold">{formatNaira(balance)}</span>
        </p>

        {profile && !profile.pin_set && (
          <Link
            to="/settings"
            className="mb-4 flex items-center gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-3 text-xs"
          >
            <ShieldAlert className="h-4 w-4 shrink-0 text-warning" />
            <span>Set a transaction PIN in Settings before sending money.</span>
          </Link>
        )}

        <form onSubmit={handleTransfer} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Bank</span>
            <select value={bank} onChange={(e) => setBank(e.target.value)} className={inputClass}>
              {BANKS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Account number</span>
            <input
              required
              inputMode="numeric"
              placeholder="0000000000"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              className={inputClass}
            />
          </label>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">
              {accountNumber.length === 10
                ? `${bank} · ${accountNumber}`
                : "Enter a 10-digit account number"}
            </p>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Amount</span>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                ₦
              </span>
              <input
                required
                inputMode="numeric"
                value={amount}
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))}
                className={`${inputClass} pl-8`}
                placeholder="0"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Note (optional)</span>
            <input
              placeholder="What's it for?"
              maxLength={140}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Transaction PIN</span>
            <input
              required
              type="password"
              inputMode="numeric"
              autoComplete="off"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className={`${inputClass} tracking-[0.5em]`}
            />
          </label>
          <button
            type="submit"
            disabled={loading || !wallet}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send money"}
          </button>
        </form>
      </main>
    </div>
  );
}
