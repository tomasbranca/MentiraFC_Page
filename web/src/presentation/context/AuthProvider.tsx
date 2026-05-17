import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchCurrentAccount } from "../../data/account";
import { reportError } from "../../lib/errors/errorLogger";
import type { AuthNotice, CurrentAccount } from "../../types/auth";
import { getSupabaseClient } from "../../utils/supabase";
import { AuthContext } from "./AuthContext";

type AuthProviderProps = {
  children: ReactNode;
};

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [account, setAccount] = useState<CurrentAccount | null>(null);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [authNotice, setAuthNotice] = useState<AuthNotice>(null);

  const resetAccountState = useCallback(() => {
    setAccount(null);
    setIsAccountLoading(false);
    setAccountError(null);
  }, []);

  const performSignOut = useCallback(
    async (notice: AuthNotice = null) => {
      const supabase = getSupabaseClient();

      setAuthNotice(notice);

      if (!supabase) {
        setSession(null);
        setUser(null);
        resetAccountState();
        return;
      }

      const { error } = await supabase.auth.signOut();

      if (error) {
        reportError(error, {
          scope: "AuthProvider",
          action: "sign_out",
        });
      }

      setSession(null);
      setUser(null);
      resetAccountState();
    },
    [resetAccountState]
  );

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

      if (nextSession) {
        setAuthNotice(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshAccount = useCallback(async () => {
    if (!user) {
      resetAccountState();
      return;
    }

    setIsAccountLoading(true);
    setAccountError(null);

    try {
      const nextAccount = await fetchCurrentAccount();

      if (!nextAccount) {
        setAccount(null);
        setAccountError("No pudimos cargar los datos de tu cuenta.");
        return;
      }

      setAccount(nextAccount);

      if (!nextAccount.isActive) {
        await performSignOut("banned");
      }
    } catch (error) {
      reportError(error, {
        scope: "AuthProvider",
        action: "fetch_current_account",
      });
      setAccount(null);
      setAccountError("No pudimos cargar los datos de tu cuenta.");
    } finally {
      setIsAccountLoading(false);
    }
  }, [performSignOut, resetAccountState, user]);

  useEffect(() => {
    if (!user) {
      resetAccountState();
      return;
    }

    void refreshAccount();
  }, [refreshAccount, resetAccountState, user]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    if (!supabase || !user) {
      return;
    }

    const channel = supabase
      .channel(`user-account-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "private",
          table: "user_accounts",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const isActive = (payload.new as { is_active?: unknown }).is_active;

          if (isActive === false) {
            void performSignOut("banned");
            return;
          }

          void refreshAccount();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [performSignOut, refreshAccount, user]);

  const signOut = useCallback(async () => {
    await performSignOut();
  }, [performSignOut]);

  const clearAuthNotice = useCallback(() => {
    setAuthNotice(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        isLoading,
        account,
        isAccountLoading,
        accountError,
        authNotice,
        signOut,
        clearAuthNotice,
        refreshAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
