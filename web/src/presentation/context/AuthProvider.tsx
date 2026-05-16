import { type ReactNode, useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { reportError } from "../../lib/errors/errorLogger";
import { getSupabaseClient } from "../../utils/supabase";
import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    if (!supabase) {
      setIsLoading(false);
      return;
    }

    void supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (error) {
          reportError(error, {
            scope: "AuthProvider",
            action: "get_session",
          });
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
        setIsLoading(false);
      })
      .catch((error: unknown) => {
        if (!isMounted) return;

        reportError(error, {
          scope: "AuthProvider",
          action: "get_session_unexpected",
        });
        setSession(null);
        setUser(null);
        setIsLoading(false);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const supabase = getSupabaseClient();

    if (!supabase) {
      setSession(null);
      setUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      reportError(error, {
        scope: "AuthProvider",
        action: "sign_out",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
