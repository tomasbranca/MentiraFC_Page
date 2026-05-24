export type AuthMode =
  | "signIn"
  | "signUp"
  | "resetPassword"
  | "updatePassword";

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
const AUTH_RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
]);
const PASSWORD_RESET_MASKED_ERROR_CODES = new Set([
  "email_not_found",
  "user_not_found",
  "user_not_found_or_invalid_password",
]);
const SUPABASE_NOT_CONFIGURED_MESSAGE = "Supabase is not configured.";

export const SIGN_UP_INVALID_DATA_MESSAGE =
  "No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.";
export const SIGN_UP_RATE_LIMIT_MESSAGE =
  "Estamos experimentando mucho tráfico en este momento. Intentá nuevamente más tarde.";
export const STRONG_PASSWORD_MESSAGE =
  "Usá al menos 8 caracteres, con una mayúscula, una minúscula y un número.";
export const PASSWORD_RESET_REQUEST_SUCCESS_MESSAGE =
  "Si el correo corresponde a una cuenta, te enviamos un enlace para restablecer la contraseña.";
export const PASSWORD_RESET_REQUEST_ERROR_MESSAGE =
  "No pudimos procesar la solicitud. Intentá nuevamente en unos minutos.";
export const PASSWORD_RESET_UNAVAILABLE_MESSAGE =
  "La recuperación de contraseña no está disponible en este entorno.";
export const PASSWORD_RESET_UPDATE_SUCCESS_MESSAGE =
  "Contraseña actualizada. Ya podés continuar con tu cuenta de Mentira FC.";
export const PASSWORD_RESET_UPDATE_SESSION_MESSAGE =
  "El enlace de recuperación no es válido o expiró. Solicitá uno nuevo.";
export const PASSWORD_RESET_UPDATE_ERROR_MESSAGE =
  "No pudimos actualizar la contraseña. Solicitá un nuevo enlace o intentá nuevamente.";

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

  if (mode !== "updatePassword" && !email) {
    errors.email = "Ingresá tu correo electrónico.";
  } else if (mode !== "updatePassword" && !EMAIL_PATTERN.test(email)) {
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

  if (mode === "signUp" || mode === "updatePassword") {
    if (
      values.password &&
      !STRONG_PASSWORD_PATTERN.test(values.password)
    ) {
      errors.password = STRONG_PASSWORD_MESSAGE;
    }

    if (!values.confirmPassword) {
      errors.confirmPassword = "Confirmá tu contraseña.";
    } else if (values.confirmPassword !== values.password) {
      errors.confirmPassword = "Las contraseñas no coinciden.";
    }
  }

  return errors;
};

const getAuthErrorDetails = (
  error: unknown
): { code: string | null; status: number | null; message: string | null } => {
  const authError =
    error && typeof error === "object"
      ? (error as { code?: unknown; status?: unknown; message?: unknown })
      : null;

  return {
    code: typeof authError?.code === "string" ? authError.code : null,
    status: typeof authError?.status === "number" ? authError.status : null,
    message:
      typeof authError?.message === "string" ? authError.message : null,
  };
};

const isRateLimitError = (error: unknown): boolean => {
  const { code, status } = getAuthErrorDetails(error);

  return (
    status === 429 ||
    (code !== null && AUTH_RATE_LIMIT_CODES.has(code))
  );
};

const isSupabaseUnavailableError = (error: unknown): boolean =>
  getAuthErrorDetails(error).message === SUPABASE_NOT_CONFIGURED_MESSAGE;

export const shouldMaskPasswordResetRequestError = (
  error: unknown
): boolean => {
  const { code, status } = getAuthErrorDetails(error);

  return (
    status === 404 ||
    (code !== null && PASSWORD_RESET_MASKED_ERROR_CODES.has(code))
  );
};

export const getPasswordResetRequestErrorMessage = (
  error: unknown
): string => {
  if (isRateLimitError(error)) {
    return SIGN_UP_RATE_LIMIT_MESSAGE;
  }

  if (isSupabaseUnavailableError(error)) {
    return PASSWORD_RESET_UNAVAILABLE_MESSAGE;
  }

  return PASSWORD_RESET_REQUEST_ERROR_MESSAGE;
};

export const getPasswordResetUpdateErrorMessage = (
  error: unknown
): string => {
  if (isRateLimitError(error)) {
    return SIGN_UP_RATE_LIMIT_MESSAGE;
  }

  if (isSupabaseUnavailableError(error)) {
    return PASSWORD_RESET_UNAVAILABLE_MESSAGE;
  }

  return PASSWORD_RESET_UPDATE_ERROR_MESSAGE;
};

const getCurrentLocationPart = (part: "hash" | "search"): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location[part];
};

const collectAuthRedirectParams = (...sources: string[]): URLSearchParams => {
  const params = new URLSearchParams();

  sources.forEach((source) => {
    const normalizedSource = source.replace(/^[?#]/, "");

    if (!normalizedSource) {
      return;
    }

    new URLSearchParams(normalizedSource).forEach((value, key) => {
      params.set(key, value);
    });
  });

  return params;
};

export const getPasswordRecoveryRedirectErrorMessage = (
  search = getCurrentLocationPart("search"),
  hash = getCurrentLocationPart("hash")
): string | null => {
  const params = collectAuthRedirectParams(search, hash);

  if (params.has("error") || params.has("error_code")) {
    return PASSWORD_RESET_UPDATE_SESSION_MESSAGE;
  }

  return null;
};

export const getSignUpErrorMessage = (error: unknown): string => {
  const { code, status } = getAuthErrorDetails(error);

  if (
    status === 429 ||
    (code !== null && AUTH_RATE_LIMIT_CODES.has(code))
  ) {
    return SIGN_UP_RATE_LIMIT_MESSAGE;
  }

  return SIGN_UP_INVALID_DATA_MESSAGE;
};
