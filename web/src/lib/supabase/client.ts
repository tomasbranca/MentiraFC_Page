import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  supabaseClient ??= createClient(supabaseUrl, supabaseKey);

  return supabaseClient;
};
