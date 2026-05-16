import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";

import { reportError } from "../../../lib/errors/errorLogger";
import { getSupabaseClient } from "../../../utils/supabase";
import Button from "../../components/Button/Button";
import { SITE_LOGO_ASSETS } from "../../constants/assets.constants";
import { ROUTES } from "../../constants/routes.constants";
import { useAuth } from "../../context/useAuth";
import {
  type AuthFormErrors,
  type AuthFormValues,
  type AuthMode,
  createEmptyAuthFormValues,
  validateAuthForm,
} from "./login.utils";
import "./Login.css";

type FormStatus = {
  tone: "success" | "error" | "info";
  message: string;
};

const PANEL_CONTENT: Record<
  AuthMode,
  {
    title: string;
    description: string;
  }
> = {
  signIn: {
    title: "Bienvenido de nuevo",
    description: "Ingresá para acceder a tu cuenta del club.",
  },
  signUp: {
    title: "Sumate al club",
    description: "Creá tu cuenta para participar de la comunidad de Mentira FC.",
  },
  resetPassword: {
    title: "Recuperá tu acceso",
    description: "La recuperación de contraseña se conectará en una próxima etapa.",
  },
};

const FORM_CONTENT: Record<
  AuthMode,
  {
    eyebrow: string;
    title: string;
    description: string;
    submitLabel: string;
  }
> = {
  signIn: {
    eyebrow: "Acceso institucional",
    title: "Ingresar",
    description: "Entrá a tu cuenta de Mentira FC.",
    submitLabel: "Ingresar",
  },
  signUp: {
    eyebrow: "Nueva cuenta",
    title: "Crear cuenta",
    description: "Registrate para acceder a tu espacio dentro del club.",
    submitLabel: "Crear cuenta",
  },
  resetPassword: {
    eyebrow: "Recuperar acceso",
    title: "Restablecer contraseña",
    description: "Este flujo quedará disponible en una próxima etapa.",
    submitLabel: "Continuar",
  },
};

const SIGN_IN_ERROR_MESSAGE =
  "No pudimos iniciar sesión. Revisá tu correo y contraseña e intentá de nuevo.";
const SIGN_UP_ERROR_MESSAGE =
  "No pudimos crear tu cuenta. Revisá los datos e intentá de nuevo.";
const SIGN_UP_CONFIRMATION_MESSAGE =
  "Te enviamos un mail para confirmar tu cuenta. Revisá tu bandeja de entrada antes de ingresar.";

type LoginProps = {
  initialMode?: AuthMode;
};

const Login = ({ initialMode = "signIn" }: LoginProps) => {
  const navigate = useNavigate();
  const { user, isLoading: isAuthLoading } = useAuth();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [values, setValues] = useState<AuthFormValues>(
    createEmptyAuthFormValues
  );
  const [errors, setErrors] = useState<AuthFormErrors>({});
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const panelContent = PANEL_CONTENT[mode];
  const formContent = FORM_CONTENT[mode];
  const isFormDisabled = isSubmitting || isAuthLoading;

  useEffect(() => {
    if (!isAuthLoading && user) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthLoading, navigate, user]);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fieldName = event.target.name as keyof AuthFormValues;
    const { value } = event.target;

    setValues((currentValues) => ({
      ...currentValues,
      [fieldName]: value,
    }));
    setErrors((currentErrors) => ({
      ...currentErrors,
      [fieldName]: undefined,
    }));
    setStatus(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validateAuthForm(mode, values);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (mode === "resetPassword") {
      setStatus({
        tone: "info",
        message:
          "La recuperación de contraseña se conectará en una próxima etapa.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseClient();

      if (!supabase) {
        setStatus({
          tone: "error",
          message:
            mode === "signIn" ? SIGN_IN_ERROR_MESSAGE : SIGN_UP_ERROR_MESSAGE,
        });
        return;
      }

      if (mode === "signIn") {
        const { error } = await supabase.auth.signInWithPassword({
          email: values.email.trim(),
          password: values.password,
        });

        if (error) {
          setStatus({
            tone: "error",
            message: SIGN_IN_ERROR_MESSAGE,
          });
          return;
        }

        navigate(ROUTES.HOME, { replace: true });
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: values.email.trim(),
        password: values.password,
        options: {
          data: {
            first_name: values.firstName.trim(),
            last_name: values.lastName.trim(),
          },
        },
      });

      if (error) {
        setStatus({
          tone: "error",
          message: SIGN_UP_ERROR_MESSAGE,
        });
        return;
      }

      if (data.session) {
        navigate(ROUTES.HOME, { replace: true });
        return;
      }

      setValues((currentValues) => ({
        ...currentValues,
        password: "",
        confirmPassword: "",
      }));
      setStatus({
        tone: "success",
        message: SIGN_UP_CONFIRMATION_MESSAGE,
      });
    } catch (error) {
      reportError(error, {
        scope: "Login",
        action: mode === "signIn" ? "sign_in" : "sign_up",
      });
      setStatus({
        tone: "error",
        message:
          mode === "signIn" ? SIGN_IN_ERROR_MESSAGE : SIGN_UP_ERROR_MESSAGE,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setShowPassword(false);
    setErrors({});
    setStatus(null);
    setIsSubmitting(false);
    setValues((currentValues) => ({
      ...createEmptyAuthFormValues(),
      email: currentValues.email,
    }));
  };

  return (
    <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-4 sm:px-6 sm:py-8 lg:px-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-br from-violet-950 via-neutral-950 to-neutral-900"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(76,29,149,0.3),transparent_38%)]"
      />

      <div className="relative w-full max-w-5xl">
        <Link
          to={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-violet-100 transition hover:text-white"
        >
          <span aria-hidden="true">←</span>
          Volver al sitio
        </Link>

        <div className="overflow-hidden border border-violet-200 bg-white shadow-2xl shadow-black/35">
          <div className="grid lg:min-h-148 lg:grid-cols-[minmax(0,0.96fr)_minmax(24rem,1.04fr)]">
            <div className="relative overflow-hidden bg-violet-900 p-5 text-violet-50 sm:p-8 lg:flex lg:flex-col lg:justify-between lg:p-10">
              <div
                aria-hidden="true"
                className="absolute -left-12 top-10 h-52 w-52 rounded-full bg-violet-400/20 blur-3xl"
              />
              <div
                aria-hidden="true"
                className="absolute -bottom-12 right-0 h-56 w-56 rounded-full bg-violet-950/40 blur-2xl"
              />

              <div
                key={`panel-${mode}`}
                className="relative login-mode-panel flex items-center gap-5 lg:block"
              >
                <Link to={ROUTES.HOME} aria-label="Volver al inicio">
                  <img
                    src={SITE_LOGO_ASSETS.large}
                    alt="Logo de Mentira FC"
                    width={160}
                    height={160}
                    className="h-17 w-17 shrink-0 object-contain sm:h-20 sm:w-20 lg:h-24 lg:w-24"
                  />
                </Link>

                <div>
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-violet-200 sm:text-xs lg:mt-8">
                    Mentira FC
                  </p>

                  <h1 className="mt-2 max-w-sm text-xl font-black leading-tight text-white sm:text-3xl lg:mt-4 lg:text-4xl">
                    Tu acceso al club, con la identidad de siempre
                  </h1>

                  <p className="mt-2 hidden text-sm font-semibold text-violet-100 sm:mt-4 sm:block sm:text-base">
                    {panelContent.title}
                  </p>

                  <p className="mt-1 hidden max-w-xs text-sm leading-relaxed text-violet-100/80 sm:mt-2 sm:block sm:text-base">
                    {panelContent.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center bg-white p-5 text-neutral-900 sm:p-8 lg:p-10">
              <div
                key={`form-${mode}`}
                className="login-mode-form mx-auto w-full max-w-md"
              >
                <div className="mb-6 text-center sm:mb-8 lg:text-left">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-600">
                    {formContent.eyebrow}
                  </p>
                  <h2 className="mt-3 text-3xl font-black text-neutral-900">
                    {formContent.title}
                  </h2>
                  <p className="mt-3 text-sm text-neutral-500 sm:text-base">
                    {formContent.description}
                  </p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                  {mode === "signUp" && (
                    <div className="grid gap-5 sm:grid-cols-2">
                      <AuthField
                        id="first-name"
                        name="firstName"
                        label="Nombre"
                        type="text"
                        placeholder="Nombre"
                        autoComplete="given-name"
                        value={values.firstName}
                        error={errors.firstName}
                        disabled={isFormDisabled}
                        onChange={handleFieldChange}
                      />
                      <AuthField
                        id="last-name"
                        name="lastName"
                        label="Apellido"
                        type="text"
                        placeholder="Apellido"
                        autoComplete="family-name"
                        value={values.lastName}
                        error={errors.lastName}
                        disabled={isFormDisabled}
                        onChange={handleFieldChange}
                      />
                    </div>
                  )}

                  <AuthField
                    id="email"
                    name="email"
                    label="Correo electrónico"
                    type="email"
                    placeholder="ejemplo@correo.com"
                    autoComplete="email"
                    value={values.email}
                    error={errors.email}
                    disabled={isFormDisabled}
                    onChange={handleFieldChange}
                  />

                  {mode !== "resetPassword" && (
                    <PasswordField
                      showPassword={showPassword}
                      onToggleVisibility={() =>
                        setShowPassword((currentValue) => !currentValue)
                      }
                      autoComplete={
                        mode === "signIn" ? "current-password" : "new-password"
                      }
                      value={values.password}
                      error={errors.password}
                      disabled={isFormDisabled}
                      onChange={handleFieldChange}
                    />
                  )}

                  {mode === "signUp" && (
                    <AuthField
                      id="confirm-password"
                      name="confirmPassword"
                      label="Confirmar contraseña"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      value={values.confirmPassword}
                      error={errors.confirmPassword}
                      disabled={isFormDisabled}
                      onChange={handleFieldChange}
                    />
                  )}

                  {mode === "signIn" && (
                    <div className="flex flex-col gap-3 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          disabled
                          className="h-4 w-4 border-neutral-300 text-violet-700 focus:ring-violet-500"
                        />
                        <span>Recordarme</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => changeMode("resetPassword")}
                        className="w-fit font-medium text-violet-700 transition hover:text-violet-900"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="cta"
                    disabled={isFormDisabled}
                    className="mt-2 w-full py-3 text-sm font-semibold"
                  >
                    {isSubmitting ? "Procesando..." : formContent.submitLabel}
                  </Button>
                </form>

                <div
                  className={`mt-5 min-h-6 text-sm ${
                    status?.tone === "error"
                      ? "text-red-700"
                      : status?.tone === "success"
                        ? "text-emerald-700"
                        : "text-violet-700"
                  }`}
                  aria-live="polite"
                  role={status?.tone === "error" ? "alert" : "status"}
                >
                  {status?.message}
                </div>

                <div className="mt-8 text-center text-sm text-neutral-500">
                  {mode === "signIn" && (
                    <p>
                      ¿Sos nuevo?{" "}
                      <button
                        type="button"
                        onClick={() => changeMode("signUp")}
                        className="font-semibold text-violet-700 transition hover:text-violet-900"
                      >
                        Crear cuenta
                      </button>
                    </p>
                  )}

                  {mode === "signUp" && (
                    <p>
                      ¿Ya tenés cuenta?{" "}
                      <button
                        type="button"
                        onClick={() => changeMode("signIn")}
                        className="font-semibold text-violet-700 transition hover:text-violet-900"
                      >
                        Ingresá
                      </button>
                    </p>
                  )}

                  {mode === "resetPassword" && (
                    <p>
                      ¿Recordaste la contraseña?{" "}
                      <button
                        type="button"
                        onClick={() => changeMode("signIn")}
                        className="font-semibold text-violet-700 transition hover:text-violet-900"
                      >
                        Volvé a ingresar
                      </button>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

type AuthFieldProps = {
  id: string;
  name: keyof AuthFormValues;
  label: string;
  type: "email" | "password" | "text";
  placeholder: string;
  autoComplete: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const AuthField = ({
  id,
  name,
  label,
  type,
  placeholder,
  autoComplete,
  value,
  error,
  disabled = false,
  onChange,
}: AuthFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  );
};

type PasswordFieldProps = {
  showPassword: boolean;
  onToggleVisibility: () => void;
  autoComplete: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const PasswordField = ({
  showPassword,
  onToggleVisibility,
  autoComplete,
  value,
  error,
  disabled = false,
  onChange,
}: PasswordFieldProps) => {
  const errorId = error ? "password-error" : undefined;

  return (
    <label className="block" htmlFor="password">
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        Contraseña
      </span>
      <span className="relative block">
        <input
          id="password"
          name="password"
          type={showPassword ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          disabled={disabled}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className="w-full border border-neutral-300 bg-white px-4 py-3 pr-20 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={disabled}
          className="absolute inset-y-0 right-4 my-auto h-fit text-sm font-medium text-violet-700 transition hover:text-violet-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {showPassword ? "Ocultar" : "Mostrar"}
        </button>
      </span>
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  );
};

export default Login;
