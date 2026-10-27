import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { LedgerEntry } from "@/types";

export function useLedger(limit: number) {
  const { wallet } = useAuth();
  const walletId = wallet?.id;
  const walletVersion = wallet?.updated_at;
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletId) {
      setEntries([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from("ledger")
      .select("*")
      .eq("wallet_id", walletId)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) {
          console.error("Failed to fetch ledger entries:", err);
          setError("Could not load transactions.");
        } else {
          setError(null);
          setEntries(
            (data ?? []).map((e) => ({
              ...e,
              credit: Number(e.credit),
              debit: Number(e.debit),
              balance_after: Number(e.balance_after),
            })) as LedgerEntry[],
          );
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletId, walletVersion, limit]);

  return { entries, loading, error };
}

export function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
