import type { AppRole } from "../../../types/auth";

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
