import { createContext } from "react";
import type { Session, User } from "@supabase/supabase-js";
import type { AuthNotice, CurrentAccount } from "../../types/auth";

export type AuthContextValue = {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  account: CurrentAccount | null;
  isAccountLoading: boolean;
  accountError: string | null;
  authNotice: AuthNotice;
  signOut: () => Promise<void>;
  clearAuthNotice: () => void;
  refreshAccount: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
