import {
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchCurrentAccount } from "../../data/account";
import {
  getCurrentAuthSession,
  onAuthSessionChange,
  signOutFromAuth,
  subscribeToCurrentAccountChanges,
} from "../../data/auth";
import { reportError } from "../../lib/errors/errorLogger";
import type { AuthNotice, CurrentAccount } from "../../types/auth";
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
      setAuthNotice(notice);

      const { error } = await signOutFromAuth();

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
    const unsubscribe = onAuthSessionChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);

      if (nextSession) {
        setAuthNotice(null);
      }
    });

    void getCurrentAuthSession()
      .then(({ session: currentSession, error }) => {
        if (!isMounted) return;

        if (error) {
          reportError(error, {
            scope: "AuthProvider",
            action: "get_session",
          });
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);
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

    if (!unsubscribe) {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribe?.();
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
    if (!user) {
      return;
    }

    return subscribeToCurrentAccountChanges(user.id, (isActive) => {
      if (isActive === false) {
        void performSignOut("banned");
        return;
      }

      void refreshAccount();
    }) ?? undefined;
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
