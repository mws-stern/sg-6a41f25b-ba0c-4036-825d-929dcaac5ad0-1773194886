import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { supabase as supabaseClient } from "@/integrations/supabase/client";

// Re-export a structured service API so existing imports keep working.
export const supabaseService: {
  client: SupabaseClient<Database>;
} = {
  client: supabaseClient,
};

export type SupabaseService = typeof supabaseService;