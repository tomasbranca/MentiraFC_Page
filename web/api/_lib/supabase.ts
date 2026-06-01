import process from "node:process";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const getOptionalEnv = (key: string): string | undefined => {
  const value = process.env[key]?.trim();

  return value || undefined;
};

export const getSupabasePublicServerConfig = () => {
  const supabaseUrl =
    getOptionalEnv("SUPABASE_URL") ?? getOptionalEnv("VITE_SUPABASE_URL");
  const publishableKey =
    getOptionalEnv("SUPABASE_PUBLISHABLE_KEY") ??
    getOptionalEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

  if (!supabaseUrl || !publishableKey) {
    throw new Error(
      "Supabase public server environment variables are not configured."
    );
  }

  return { supabaseUrl, publishableKey };
};

export const createPublicSupabaseClient = (): SupabaseClient => {
  const { supabaseUrl, publishableKey } = getSupabasePublicServerConfig();

  return createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createUserSupabaseClient = (token: string): SupabaseClient => {
  const accessToken = token.trim();

  if (!accessToken) {
    throw new Error("Missing auth token.");
  }

  const { supabaseUrl, publishableKey } = getSupabasePublicServerConfig();

  return createClient(supabaseUrl, publishableKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

export const createAdminSupabaseClient = (): SupabaseClient => {
  const supabaseUrl =
    getOptionalEnv("SUPABASE_URL") ?? getOptionalEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin environment variables are not configured."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
