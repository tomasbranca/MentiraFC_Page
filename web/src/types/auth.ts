export type AppRole =
  | "user"
  | "team_member"
  | "editor"
  | "moderator"
  | "admin";

export type CurrentAccount = {
  id: string;
  firstName: string;
  lastName: string;
  role: AppRole;
  isActive: boolean;
};

export type AuthNotice = "banned" | null;
