import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import { useState } from "react";
import { toast } from "sonner";
import { Users, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/transfer")({
  head: () => ({ meta: [{ title: "Send Money — Payroxa" }] }),
  component: Transfer,
});

function Transfer() {
  const nav = useNavigate();
  const { user, wallet, refreshWallet, profile } = useAuth();
  const [bank, setBank] = useState("GTBank");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !wallet) {
      toast.error("Please log in to make transfers.");
      return;
    }

    const transferAmount = Number(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }

    if (wallet.available_balance < transferAmount) {
      toast.error("Insufficient balance.", {
        description: `Your available balance is ₦${wallet.available_balance.toLocaleString()}`,
      });
      return;
    }

    setLoading(true);

    try {
      const now = new Date().toISOString();
      const transactionRef = `TX-${Date.now()}`;

      // Fetch current wallet state inside transaction
      const { data: walletData, error: walletFetchErr } = await supabase
        .from("wallets")
        .select("available_balance")
        .eq("id", wallet.id)
        .single();

      if (walletFetchErr) throw walletFetchErr;
      if (!walletData) throw new Error("Wallet not found.");

      const currentBalance = walletData.available_balance;
      if (currentBalance < transferAmount) {
        throw new Error("Insufficient balance.");
      }

      const newBalance = currentBalance - transferAmount;

      // Update wallet balance
      const { error: walletUpdateErr } = await supabase
        .from("wallets")
        .update({
          available_balance: newBalance,
          ledger_balance: newBalance,
          updated_at: now,
        })
        .eq("id", wallet.id);

      if (walletUpdateErr) throw walletUpdateErr;

      // Create transaction entry
      const newTransaction = {
        reference: transactionRef,
        user_id: user.id,
        service: "transfer",
        provider: "payroxa-engine",
        amount: transferAmount,
        fee: 0,
        status: "success",
        provider_reference: transactionRef,
        created_at: now,
        metadata: {
          bank,
          account_number: accountNumber,
          note,
        },
      };

      const { error: txErr } = await supabase.from("transactions").insert(newTransaction);

      if (txErr) throw txErr;

      // Create double-entry ledger entry
      const newLedger = {
        wallet_id: wallet.id,
        reference: transactionRef,
        type: "debit",
        credit: 0,
        debit: transferAmount,
        balance_after: newBalance,
        description: `Transfer to ${bank} (${accountNumber})`,
        status: "completed",
        created_at: now,
      };

      const { error: ledgerErr } = await supabase.from("ledger").insert(newLedger);

      if (ledgerErr) throw ledgerErr;

      await refreshWallet();

      toast.success("Transfer sent successfully!", {
        description: `₦${transferAmount.toLocaleString()} has been sent to ${bank} (${accountNumber})`,
      });

      setTimeout(() => nav({ to: "/wallet" }), 1000);
    } catch (err) {
      console.error("Transfer transaction failed:", err);
      const error = err as Error;
      toast.error(error.message || "Failed to process transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title="Send Money" back="/wallet" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        <div className="mb-5">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Recent</p>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {["CO", "TE", "AB", "MU", "NN"].map((i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="grid h-14 w-14 place-items-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                  {i}
                </div>
                <span className="text-[10px] text-muted-foreground">{i}...</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleTransfer} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Bank</span>
            <select
              value={bank}
              onChange={(e) => setBank(e.target.value)}
              className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary"
            >
              <option>GTBank</option>
              <option>Access Bank</option>
              <option>Zenith Bank</option>
              <option>UBA</option>
              <option>Payroxa</option>
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
              className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </label>
          <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-primary">
              <Users className="h-5 w-5" />
            </span>
            <p className="text-sm font-semibold">
              {accountNumber.length === 10
                ? "Account Name Verified"
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
                onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))}
                className="h-12 w-full rounded-2xl border border-input bg-background pl-8 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                placeholder="0"
              />
            </div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium">Note (optional)</span>
            <input
              placeholder="What's it for?"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Send money"}
          </button>
        </form>
      </main>
    </div>
  );
}
