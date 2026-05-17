export type AuthMode = "signIn" | "signUp" | "resetPassword";

export type AuthFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type AuthFormErrors = Partial<Record<keyof AuthFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
const SIGN_UP_RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
]);

export const SIGN_UP_INVALID_DATA_MESSAGE =
  "No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.";
export const SIGN_UP_RATE_LIMIT_MESSAGE =
  "Estamos experimentando mucho tráfico en este momento. Intentá nuevamente más tarde.";

export const createEmptyAuthFormValues = (): AuthFormValues => ({
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
});

export const validateAuthForm = (
  mode: AuthMode,
  values: AuthFormValues
): AuthFormErrors => {
  const errors: AuthFormErrors = {};
  const email = values.email.trim();

  if (!email) {
    errors.email = "Ingresá tu correo electrónico.";
  } else if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Ingresá un correo electrónico válido.";
  }

  if (mode === "signUp") {
    if (!values.firstName.trim()) {
      errors.firstName = "Ingresá tu nombre.";
    }

    if (!values.lastName.trim()) {
      errors.lastName = "Ingresá tu apellido.";
    }
  }

  if (mode !== "resetPassword" && !values.password) {
    errors.password = "Ingresá una contraseña.";
  }

  if (mode === "signUp") {
    if (
      values.password &&
      !STRONG_PASSWORD_PATTERN.test(values.password)
    ) {
      errors.password =
        "Usá al menos 8 caracteres, con una mayúscula, una minúscula y un número.";
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirmá tu contraseña.";
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
  }

  return errors;
};

export const getSignUpErrorMessage = (error: unknown): string => {
  const authError =
    error && typeof error === "object"
      ? (error as { code?: unknown; status?: unknown })
      : null;
  const errorCode =
    typeof authError?.code === "string" ? authError.code : null;
  const errorStatus =
    typeof authError?.status === "number" ? authError.status : null;

  if (
    errorStatus === 429 ||
    (errorCode !== null && SIGN_UP_RATE_LIMIT_CODES.has(errorCode))
  ) {
    return SIGN_UP_RATE_LIMIT_MESSAGE;
  }

  return SIGN_UP_INVALID_DATA_MESSAGE;
};
