import { supabase } from "@/lib/supabase";

export type RpcResult = {
  reference: string;
  amount: number;
  fee?: number;
  total?: number;
  balance_after: number;
};

// Calls a Postgres function and turns both thrown errors and `{ error }` payloads into exceptions.
export async function callRpc<T = RpcResult>(
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(error.message);
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(String(data.error));
  }
  return data as T;
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}
