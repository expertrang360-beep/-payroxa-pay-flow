import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { UserProfile, Wallet } from "@/types";
import { User as SupabaseUser } from "@supabase/supabase-js";

export type AuthenticatedUser = SupabaseUser & { uid: string };

interface AuthContextType {
  user: AuthenticatedUser | null;
  profile: UserProfile | null;
  wallet: Wallet | null;
  loading: boolean;
  refreshWallet: () => Promise<void>;
  updateKyc: (level: 0 | 1 | 2 | 3) => Promise<void>;
  updatePin: (pin: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);

  const createInitialWallet = useCallback(async (uid: string) => {
    try {
      const now = new Date().toISOString();
      const walletId = uid;

      const initialWallet: Wallet = {
        id: walletId,
        user_id: uid,
        currency: "NGN",
        available_balance: 5000, // Sign up bonus of 5,000 NGN
        ledger_balance: 5000,
        status: "active",
        created_at: now,
        updated_at: now,
      };

      const firstLedger = {
        wallet_id: walletId,
        reference: `REF-SIGNUP-${Date.now()}`,
        type: "credit",
        credit: 5000,
        debit: 0,
        balance_after: 5000,
        description: "Sign-up welcome bonus",
        status: "completed",
        created_at: now,
      };

      // In Supabase, we can perform these inserts
      const { error: walletErr } = await supabase.from("wallets").insert(initialWallet);
      if (walletErr) throw walletErr;

      const { error: ledgerErr } = await supabase.from("ledger").insert(firstLedger);
      if (ledgerErr) throw ledgerErr;

      // Refetch wallet
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", walletId)
        .single();

      if (walletData) {
        setWallet(walletData as Wallet);
      }
    } catch (err) {
      console.error("Failed to create initial wallet:", err);
    }
  }, []);

  const fetchProfileAndWallet = useCallback(
    async (currentUser: SupabaseUser) => {
      try {
        // Get profile
        const { data: profileData, error: profileErr } = await supabase
          .from("users")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profileErr) {
          console.error("Error fetching user profile:", profileErr);
        }

        if (profileData) {
          setProfile(profileData as UserProfile);

          // Get wallet - wallets document id matches the user id for simple direct lookup
          const { data: walletData, error: walletErr } = await supabase
            .from("wallets")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (walletErr) {
            console.error("Error fetching wallet:", walletErr);
          }

          if (walletData) {
            setWallet(walletData as Wallet);
          } else {
            // Auto create wallet if it doesn't exist yet
            await createInitialWallet(currentUser.id);
          }
        }
      } catch (err) {
        console.error("Error fetching profile & wallet:", err);
      }
    },
    [createInitialWallet],
  );

  const refreshWallet = useCallback(async () => {
    if (!user) return;
    try {
      const { data: walletData } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", user.id)
        .single();

      if (walletData) {
        setWallet(walletData as Wallet);
      }
    } catch (err) {
      console.error("Failed to refresh wallet:", err);
    }
  }, [user]);

  const updateKyc = async (level: 0 | 1 | 2 | 3) => {
    if (!user || !profile) return;
    try {
      const now = new Date().toISOString();
      const updated = {
        ...profile,
        kyc_level: level,
        updated_at: now,
      };

      const { error } = await supabase
        .from("users")
        .update({ kyc_level: level, updated_at: now })
        .eq("id", user.id);

      if (error) throw error;
      setProfile(updated);
    } catch (err) {
      console.error("Failed to update KYC:", err);
      throw err;
    }
  };

  const updatePin = async (pin: string) => {
    if (!user || !profile) return;
    try {
      const now = new Date().toISOString();
      const updated = {
        ...profile,
        transaction_pin: pin,
        updated_at: now,
      };

      const { error } = await supabase
        .from("users")
        .update({ transaction_pin: pin, updated_at: now })
        .eq("id", user.id);

      if (error) throw error;
      setProfile(updated);
    } catch (err) {
      console.error("Failed to update PIN:", err);
      throw err;
    }
  };

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        // Normalize user so both id and uid properties are present for compatibility
        const normalized = { ...currentUser, uid: currentUser.id };
        setUser(normalized);
        fetchProfileAndWallet(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUser = session?.user ?? null;
      if (currentUser) {
        const normalized = { ...currentUser, uid: currentUser.id };
        setUser(normalized);
        await fetchProfileAndWallet(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setWallet(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfileAndWallet]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        loading,
        refreshWallet,
        updateKyc,
        updatePin,
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
