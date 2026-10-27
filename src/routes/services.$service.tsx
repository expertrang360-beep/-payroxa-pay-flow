import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/page-header";
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  Globe,
  Gamepad2,
  Gift,
  Repeat,
  ChevronLeft,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useState, ComponentType } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/app/require-auth";
import { useAuth } from "@/hooks/use-auth";
import { callRpc, errorMessage, type RpcResult } from "@/lib/rpc";
import { formatNaira } from "@/lib/utils";

const META: Record<
  string,
  {
    title: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    unit: string;
    providers: string[];
    comingSoon?: boolean;
  }
> = {
  airtime: {
    title: "Buy Airtime",
    label: "Phone number",
    icon: Smartphone,
    unit: "Amount",
    providers: ["MTN", "Airtel", "Glo", "9mobile"],
  },
  data: {
    title: "Buy Data",
    label: "Phone number",
    icon: Wifi,
    unit: "Bundle",
    providers: ["MTN", "Airtel", "Glo", "9mobile"],
  },
  electricity: {
    title: "Electricity",
    label: "Meter number",
    icon: Zap,
    unit: "Amount",
    providers: ["Ikeja Electric", "EKEDC", "AEDC", "IBEDC"],
  },
  cable: {
    title: "Cable TV",
    label: "Smartcard",
    icon: Tv,
    unit: "Package",
    providers: ["DSTV", "GOtv", "StarTimes"],
  },
  internet: {
    title: "Internet",
    label: "Account ID",
    icon: Globe,
    unit: "Plan",
    providers: ["Spectranet", "Smile", "Swift"],
  },
  betting: {
    title: "Fund Betting",
    label: "User ID",
    icon: Gamepad2,
    unit: "Amount",
    providers: ["Bet9ja", "SportyBet", "1xBet", "BetKing"],
  },
  giftcards: {
    title: "Gift Cards",
    label: "Recipient email",
    icon: Gift,
    unit: "Amount",
    providers: ["Amazon", "iTunes", "Steam", "Google Play"],
  },
  "airtime-to-cash": {
    title: "Airtime → Cash",
    label: "Phone number",
    icon: Repeat,
    unit: "Amount",
    providers: ["MTN", "Airtel", "Glo", "9mobile"],
    comingSoon: true,
  },
};

const MIN_AMOUNT = 50;
const MAX_AMOUNT = 1_000_000;

export const Route = createFileRoute("/services/$service")({
  head: ({ params }) => {
    const m = META[params.service];
    return { meta: [{ title: `${m?.title ?? "Service"} — Payroxa` }] };
  },
  component: () => (
    <RequireAuth>
      <Service />
    </RequireAuth>
  ),
});

type Step = "form" | "confirm" | "pin" | "success";

function Service() {
  const { service } = Route.useParams();
  const meta = META[service];
  const nav = useNavigate();
  const [step, setStep] = useState<Step>("form");
  const [provider, setProvider] = useState(meta?.providers[0] ?? "");
  const [amount, setAmount] = useState("");
  const [target, setTarget] = useState("");
  const [pin, setPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState<RpcResult | null>(null);
  const { wallet, profile, refreshWallet } = useAuth();
  const balance = wallet?.available_balance ?? 0;

  if (!meta) {
    return (
      <div className="min-h-screen bg-surface">
        <PageHeader title="Service" back="/payments" />
        <div className="mx-auto max-w-md p-6 text-center text-sm text-muted-foreground">
          Service not found.
        </div>
      </div>
    );
  }
  if (meta.comingSoon) {
    return (
      <div className="min-h-screen bg-surface">
        <PageHeader title={meta.title} back="/payments" />
        <div className="mx-auto max-w-md p-6 text-center text-sm text-muted-foreground">
          {meta.title} is coming soon.
        </div>
      </div>
    );
  }
  const Icon = meta.icon;
  const amountNum = Number(amount || 0);
  const fee = amountNum > 0 ? Math.max(20, Math.round(amountNum * 0.005)) : 0;
  const total = amountNum + fee;

  const reset = () => {
    setStep("form");
    setAmount("");
    setTarget("");
    setPin("");
    setReceipt(null);
  };

  const submitPayment = async (enteredPin: string) => {
    setSubmitting(true);
    try {
      const result = await callRpc("pay_bill", {
        p_service: service,
        p_provider: provider,
        p_target: target.trim(),
        p_amount: amountNum,
        p_pin: enteredPin,
      });
      setReceipt(result);
      setStep("success");
      await refreshWallet();
    } catch (err) {
      toast.error(errorMessage(err, "Payment failed. Please try again."));
      setPin("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <PageHeader title={meta.title} back="/payments" />
      <main className="mx-auto max-w-md px-5 pb-10 pt-4">
        {/* Progress */}
        <div className="mb-5 flex items-center gap-2">
          {(["form", "confirm", "pin", "success"] as Step[]).map((s, i) => {
            const done = (["form", "confirm", "pin", "success"] as Step[]).indexOf(step) >= i;
            return (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full ${done ? "bg-primary" : "bg-secondary"}`}
              />
            );
          })}
        </div>

        {step === "form" && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{meta.title}</p>
                <p className="text-xs text-muted-foreground">
                  Wallet balance: {formatNaira(balance)}
                </p>
              </div>
            </div>

            <form
              className="mt-5 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (!target.trim()) {
                  toast.error(`Enter a valid ${meta.label.toLowerCase()}.`);
                  return;
                }
                if (amountNum < MIN_AMOUNT || amountNum > MAX_AMOUNT) {
                  toast.error(
                    `Amount must be between ${formatNaira(MIN_AMOUNT, 0)} and ${formatNaira(MAX_AMOUNT, 0)}.`,
                  );
                  return;
                }
                if (total > balance) {
                  toast.error("Insufficient balance.", {
                    description: `You need ${formatNaira(total)} including fees.`,
                  });
                  return;
                }
                setStep("confirm");
              }}
            >
              <div>
                <span className="mb-2 block text-xs font-medium">Provider</span>
                <div className="grid grid-cols-4 gap-2">
                  {meta.providers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setProvider(p)}
                      className={`rounded-xl border px-2 py-2.5 text-xs font-semibold transition ${
                        provider === p
                          ? "border-primary bg-primary-soft text-primary"
                          : "border-input bg-card text-muted-foreground"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">{meta.label}</span>
                <input
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  maxLength={100}
                  className="h-12 w-full rounded-2xl border border-input bg-background px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                  placeholder="Enter details"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-medium">{meta.unit}</span>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ₦
                  </span>
                  <input
                    required
                    inputMode="numeric"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))}
                    className="h-12 w-full rounded-2xl border border-input bg-background pl-8 pr-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/15"
                    placeholder="0"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {["500", "1000", "2000", "5000"].map((a) => (
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

              <button
                type="submit"
                className="h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Review payment
              </button>
            </form>
          </>
        )}

        {step === "confirm" && (
          <div>
            <button
              onClick={() => setStep("form")}
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground"
            >
              <ChevronLeft className="h-3 w-3" /> Edit
            </button>
            <div className="rounded-3xl bg-card p-5 shadow-soft">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                You're paying
              </p>
              <p className="mt-1 text-3xl font-bold tracking-tight">₦{total.toLocaleString()}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {provider} · {meta.title}
              </p>

              <dl className="mt-5 space-y-3 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{meta.label}</dt>
                  <dd className="font-medium">{target || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{meta.unit}</dt>
                  <dd className="font-medium">₦{amountNum.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Fee</dt>
                  <dd className="font-medium">₦{fee.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">From</dt>
                  <dd className="font-medium">Payroxa wallet</dd>
                </div>
              </dl>
            </div>
            <p className="mt-4 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-success" /> Protected by Payroxa Secure
            </p>
            {profile && !profile.pin_set && (
              <p className="mt-4 rounded-2xl bg-warning/10 p-3 text-xs">
                You need to set a transaction PIN in Settings before paying.
              </p>
            )}
            <button
              onClick={() => {
                if (profile && !profile.pin_set) {
                  nav({ to: "/settings" });
                  return;
                }
                setStep("pin");
              }}
              className="mt-4 h-12 w-full rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow"
            >
              Confirm & pay
            </button>
          </div>
        )}

        {step === "pin" && (
          <div>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold">Enter your PIN</h2>
            <p className="mt-1 text-center text-xs text-muted-foreground">
              Authorize ₦{total.toLocaleString()} to {provider}
            </p>
            {submitting && (
              <Loader2
                className="mx-auto mt-3 h-5 w-5 animate-spin text-primary"
                aria-label="Processing"
              />
            )}

            <div className="mt-6 flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-12 w-12 rounded-xl border-2 ${pin.length > i ? "border-primary bg-primary-soft" : "border-input bg-card"} grid place-items-center text-lg font-bold`}
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>

            <div className="mx-auto mt-6 grid max-w-xs grid-cols-3 gap-2">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k, index) => (
                <button
                  key={`${k}-${index}`}
                  disabled={!k || submitting}
                  onClick={() => {
                    if (k === "⌫") setPin((p) => p.slice(0, -1));
                    else if (k && pin.length < 4) {
                      const next = pin + k;
                      setPin(next);
                      if (next.length === 4) submitPayment(next);
                    }
                  }}
                  className={`h-14 rounded-2xl bg-card text-xl font-semibold shadow-soft transition active:scale-95 disabled:opacity-40 ${k ? "" : "invisible"}`}
                >
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="pt-6 text-center">
            <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="mt-5 text-xl font-bold">Payment successful</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ₦{total.toLocaleString()} to {provider}
            </p>

            <div className="mx-auto mt-6 rounded-2xl bg-card p-5 text-left shadow-soft">
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Reference</dt>
                  <dd className="font-mono text-xs">{receipt?.reference}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">{meta.label}</dt>
                  <dd className="font-medium">{target || "—"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Total</dt>
                  <dd className="font-semibold">₦{total.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={reset}
                className="h-12 rounded-2xl border border-input bg-card text-sm font-semibold"
              >
                Repeat
              </button>
              <button
                onClick={() => nav({ to: "/home" })}
                className="h-12 rounded-2xl bg-primary text-sm font-semibold text-primary-foreground shadow-glow"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
