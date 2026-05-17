import type {
  AuthChangeEvent,
  AuthError,
  RealtimeChannel,
  Session,
} from "@supabase/supabase-js";

import { getSupabaseClient } from "../lib/supabase";

type AuthServiceResult = {
  error: AuthError | Error | null;
};

type SignUpInput = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

export const getCurrentAuthSession = async (): Promise<{
  session: Session | null;
  error: AuthError | Error | null;
}> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { session: null, error: null };
  }

  const { data, error } = await supabase.auth.getSession();

  return {
    session: data.session,
    error,
  };
};

export const getCurrentAccessToken = async (): Promise<string> => {
  const { session, error } = await getCurrentAuthSession();

  if (error) {
    throw error;
  }

  if (!session?.access_token) {
    throw new Error("Missing auth session.");
  }

  return session.access_token;
};

export const signInWithEmailPassword = async (
  email: string,
  password: string
): Promise<AuthServiceResult> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { error: new Error("Supabase is not configured.") };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  return { error };
};

export const signUpWithEmailPassword = async ({
  email,
  password,
  firstName,
  lastName,
}: SignUpInput): Promise<{
  session: Session | null;
  error: AuthError | Error | null;
}> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return {
      session: null,
      error: new Error("Supabase is not configured."),
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  });

  return {
    session: data.session,
    error,
  };
};

export const signOutFromAuth = async (): Promise<AuthServiceResult> => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return { error: null };
  }

  const { error } = await supabase.auth.signOut();

  return { error };
};

export const onAuthSessionChange = (
  callback: (event: AuthChangeEvent, session: Session | null) => void
): (() => void) | null => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
};

export const subscribeToCurrentAccountChanges = (
  userId: string,
  onChange: (isActive: boolean | null) => void
): (() => void) | null => {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const channel: RealtimeChannel = supabase
    .channel(`user-account-${userId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "private",
        table: "user_accounts",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const isActive = (payload.new as { is_active?: unknown }).is_active;
        onChange(typeof isActive === "boolean" ? isActive : null);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
};
