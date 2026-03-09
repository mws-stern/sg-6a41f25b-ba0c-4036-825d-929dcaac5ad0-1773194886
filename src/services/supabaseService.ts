import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

// A thin, typed wrapper around the shared Supabase client.
// This gives the rest of the app a stable place to import from.
export const supabaseService: {
  client: SupabaseClient<Database>;
} = {
  client: supabase,
};

export type SupabaseService = typeof supabaseService;