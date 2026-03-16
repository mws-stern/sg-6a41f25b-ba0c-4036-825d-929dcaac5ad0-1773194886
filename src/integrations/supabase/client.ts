import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase client initialization failed: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);