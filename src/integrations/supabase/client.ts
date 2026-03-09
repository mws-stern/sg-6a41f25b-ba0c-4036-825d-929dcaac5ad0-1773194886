// Central Supabase client. This file is generated/managed by the system.
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

// Basic auth state logging
supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_OUT") {
    console.log("User signed out");
  }
});