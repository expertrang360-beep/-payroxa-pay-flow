export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  kyc_level: 0 | 1 | 2 | 3;
  status: "active" | "suspended" | "pending_verification";
  transaction_pin?: string;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  currency: string;
  available_balance: number;
  ledger_balance: number;
  status: "active" | "frozen";
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  wallet_id: string;
  reference: string;
  type: "credit" | "debit";
  credit: number;
  debit: number;
  balance_after: number;
  description: string;
  status: "completed" | "reversed";
  created_at: string;
}

export interface Transaction {
  id: string;
  reference: string;
  user_id: string;
  service: "airtime" | "data" | "electricity" | "cable" | "transfer" | "fund_wallet";
  provider: string;
  amount: number;
  fee: number;
  status: "pending" | "success" | "failed";
  provider_reference?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Beneficiary {
  id: string;
  user_id: string;
  bank: string;
  account_number: string;
  account_name: string;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer: string;
  referred_user: string;
  reward: number;
  status: "pending" | "completed";
  created_at: string;
}
