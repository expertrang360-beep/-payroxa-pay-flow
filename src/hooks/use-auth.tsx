import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { supabase, openedFromRecoveryLink } from "@/lib/supabase";
import { callRpc } from "@/lib/rpc";
import type { UserProfile, Wallet } from "@/types";

export type AuthenticatedUser = SupabaseUser & { uid: string };

interface AuthContextType {
  user: AuthenticatedUser | null;
  profile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  passwordRecovery: boolean;
  endPasswordRecovery: () => void;
  refreshWallet: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setPin: (pin: string, currentPin?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [passwordRecovery, setPasswordRecovery] = useState(openedFromRecoveryLink);
  const userId = user?.id;

  const fetchProfile = useCallback(async (id: string) => {
    const { data, error } = await supabase.from("users").select("*").eq("id", id).maybeSingle();
    if (error) console.error("Error fetching user profile:", error);
    setProfile((data as UserProfile | null) ?? null);
  }, []);

  const fetchWallet = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", id)
      .maybeSingle();
    if (error) console.error("Error fetching wallet:", error);
    setWallet(
      data
        ? ({
            ...data,
            available_balance: Number(data.available_balance),
            ledger_balance: Number(data.ledger_balance),
          } as Wallet)
        : null,
    );
  }, []);

  useEffect(() => {
    // Supabase emits INITIAL_SESSION on subscribe, so no separate getSession() call is needed.
    // The callback must stay synchronous: awaiting Supabase calls here can deadlock the client.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
      if (event === "SIGNED_OUT") setPasswordRecovery(false);
      const current = session?.user ?? null;
      setUser(current ? { ...current, uid: current.id } : null);
      setSessionLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) {
      setProfile(null);
      setWallet(null);
      return;
    }
    let cancelled = false;
    setDataLoading(true);
    Promise.all([fetchProfile(userId), fetchWallet(userId)])
      .catch((err) => console.error("Error loading account:", err))
      .finally(() => {
        if (!cancelled) setDataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId, fetchProfile, fetchWallet]);

  const refreshWallet = useCallback(async () => {
    if (userId) await fetchWallet(userId);
  }, [userId, fetchWallet]);

  const refreshProfile = useCallback(async () => {
    if (userId) await fetchProfile(userId);
  }, [userId, fetchProfile]);

  const setPin = useCallback(
    async (pin: string, currentPin?: string) => {
      await callRpc("set_transaction_pin", { p_pin: pin, p_current_pin: currentPin ?? null });
      await refreshProfile();
    },
    [refreshProfile],
  );

  const endPasswordRecovery = useCallback(() => setPasswordRecovery(false), []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        loading: sessionLoading || dataLoading,
        passwordRecovery,
        endPasswordRecovery,
        refreshWallet,
        refreshProfile,
        setPin,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
