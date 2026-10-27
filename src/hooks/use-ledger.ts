import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import type { LedgerEntry } from "@/types";

type LedgerFilter = { type?: "credit" | "debit"; search?: string };

// Characters that would break a PostgREST `or=(...)` filter or act as wildcards.
const sanitizeSearch = (q: string) => q.replace(/[,()%*\\]/g, " ").trim();

export function useLedger(pageSize: number, filter: LedgerFilter = {}) {
  const { wallet } = useAuth();
  const walletId = wallet?.id;
  const walletVersion = wallet?.updated_at;
  const type = filter.type;
  const search = sanitizeSearch(filter.search ?? "");
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (offset: number) => {
      let query = supabase.from("ledger").select("*").eq("wallet_id", walletId!);
      if (type) query = query.eq("type", type);
      if (search) query = query.or(`description.ilike.*${search}*,reference.ilike.*${search}*`);
      const { data, error: err } = await query
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize);
      if (err) throw err;
      const rows = (data ?? []).map((e) => ({
        ...e,
        credit: Number(e.credit),
        debit: Number(e.debit),
        balance_after: Number(e.balance_after),
      })) as LedgerEntry[];
      // One extra row is requested to detect whether another page exists.
      return { rows: rows.slice(0, pageSize), more: rows.length > pageSize };
    },
    [walletId, type, search, pageSize],
  );

  useEffect(() => {
    if (!walletId) {
      setEntries([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPage(0)
      .then(({ rows, more }) => {
        if (cancelled) return;
        setEntries(rows);
        setHasMore(more);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to fetch ledger entries:", err);
        setError("Could not load transactions.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [walletId, walletVersion, fetchPage]);

  const loadMore = useCallback(async () => {
    if (!walletId || loadingMore) return;
    setLoadingMore(true);
    try {
      const { rows, more } = await fetchPage(entries.length);
      setEntries((prev) => [...prev, ...rows.filter((r) => !prev.some((p) => p.id === r.id))]);
      setHasMore(more);
    } catch (err) {
      console.error("Failed to fetch more ledger entries:", err);
      setError("Could not load more transactions.");
    } finally {
      setLoadingMore(false);
    }
  }, [walletId, loadingMore, fetchPage, entries.length]);

  return { entries, loading, error, hasMore, loadMore, loadingMore };
}

export function formatEntryDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
