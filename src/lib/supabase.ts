import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://vfdrgtlefhuqjcqibowd.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmZHJndGxlZmh1cWpjcWlib3dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM0ODE5NDgsImV4cCI6MjA5OTA1Nzk0OH0.ioYuNt-wuFr114eDiFzE2kU82jT0IvFqOZh9MJeKy4E";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
