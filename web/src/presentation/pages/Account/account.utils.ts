import type { AppRole } from "../../../types/auth";
import { canAccessDashboard } from "../../../domain/auth/permissions";

export type AccountProfileValues = {
  firstName: string;
  lastName: string;
};

export type AccountProfileErrors = Partial<
  Record<keyof AccountProfileValues, string>
>;

export const validateAccountProfile = (
  values: AccountProfileValues
): AccountProfileErrors => {
  const errors: AccountProfileErrors = {};

  if (!values.firstName.trim()) {
    errors.firstName = "Ingresá tu nombre.";
  }

  if (!values.lastName.trim()) {
    errors.lastName = "Ingresá tu apellido.";
  }

  return errors;
};

export const ROLE_LABELS: Record<AppRole, string> = {
  user: "Usuario",
  team_member: "Integrante del equipo",
  editor: "Editor",
  moderator: "Moderador",
  admin: "Administrador",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  user: "Cuenta registrada con acceso a las funciones públicas del club.",
  team_member: "Cuenta vinculada al equipo con acceso a espacios internos.",
  editor: "Cuenta habilitada para gestionar contenido del sitio.",
  moderator: "Cuenta habilitada para gestionar contenido y moderación.",
  admin: "Cuenta con permisos completos de administración.",
};

export const ACCOUNT_STATUS_LABELS = {
  active: "Activa",
  inactive: "Suspendida",
} as const;

export const getAccountStatusLabel = (isActive: boolean): string =>
  isActive ? ACCOUNT_STATUS_LABELS.active : ACCOUNT_STATUS_LABELS.inactive;

export type AccountActionId =
  | "open_dashboard"
  | "sign_out";

export const getAvailableAccountActionIds = (
  role: AppRole
): AccountActionId[] => [
  ...(canAccessDashboard(role) ? (["open_dashboard"] as const) : []),
  "sign_out",
];
