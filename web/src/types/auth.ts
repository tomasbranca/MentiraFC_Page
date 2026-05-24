import type { AppRole } from "../../shared/auth/permissions";

export type { AppRole } from "../../shared/auth/permissions";

export type CurrentAccount = {
  id: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  isActive: boolean;
};

export type AuthNotice = "banned" | null;
