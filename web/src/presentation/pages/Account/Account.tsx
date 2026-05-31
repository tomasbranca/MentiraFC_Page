import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useState,
} from "react";
import { Link, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiGrid,
  FiLogOut,
  FiRefreshCw,
  FiSave,
  FiShield,
} from "react-icons/fi";

import { updateCurrentProfile } from "../../../data/account";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import Button from "../../components/Button/Button";
import { SkeletonBlock } from "../../components/Skeletons/SkeletonBlock";
import { useAuth } from "../../context/useAuth";
import { getProfileInitials } from "../../utils/profile.utils";
import {
  type AccountActionId,
  ROLE_LABELS,
  type AccountProfileErrors,
  type AccountProfileValues,
  getAccountStatusLabel,
  getAvailableAccountActionIds,
  validateAccountProfile,
} from "./account.utils";

type FormStatus = {
  tone: "success" | "error" | "info";
  message: string;
};

type AccountActionMeta = {
  label: string;
  description: string;
  icon: IconType;
};

const ACTION_META: Record<AccountActionId, AccountActionMeta> = {
  open_dashboard: {
    label: "Entrar al dashboard",
    description: "Gestionar contenido interno según los permisos de tu rol.",
    icon: FiGrid,
  },
  sign_out: {
    label: "Cerrar sesión",
    description: "Salir de esta cuenta en este dispositivo.",
    icon: FiLogOut,
  },
};

const Account = () => {
  const navigate = useNavigate();
  const {
    account,
    user,
    isAccountLoading,
    accountError,
    refreshAccount,
    signOut,
  } = useAuth();
  const [values, setValues] = useState<AccountProfileValues>(() => ({
    firstName: account?.firstName ?? "",
    lastName: account?.lastName ?? "",
  }));
  const [errors, setErrors] = useState<AccountProfileErrors>({});
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!account) {
      return;
    }

    setValues({
      firstName: account.firstName,
      lastName: account.lastName,
    });
  }, [account]);

  if (!account && (isAccountLoading || (user && !accountError))) {
    return <AccountLoadingState />;
  }

  if (accountError) {
    return (
      <AccountErrorState
        message={accountError}
        isRetrying={isAccountLoading}
        onRetry={refreshAccount}
      />
    );
  }

  if (!account) {
    return (
      <AccountErrorState
        title="No encontramos tu cuenta"
        message="Intentá nuevamente en unos minutos."
        isRetrying={isAccountLoading}
        onRetry={refreshAccount}
      />
    );
  }

  const hasProfileChanges =
    values.firstName.trim() !== account.firstName ||
    values.lastName.trim() !== account.lastName;
  const isFormDisabled = isSubmitting || isSigningOut || !account.isActive;
  const isSaveDisabled = isFormDisabled || !hasProfileChanges;
  const availableActionIds = getAvailableAccountActionIds(account.role);
  const accountStatusLabel = getAccountStatusLabel(account.isActive);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fieldName = event.target.name as keyof AccountProfileValues;
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

    const nextErrors = validateAccountProfile(values);
    setErrors(nextErrors);
    setStatus(null);

    if (Object.keys(nextErrors).length > 0) {
      setStatus({
        tone: "error",
        message: "Revisá los campos marcados antes de guardar.",
      });
      return;
    }

    if (!hasProfileChanges) {
      setStatus({
        tone: "info",
        message: "No hay cambios pendientes para guardar.",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({
      tone: "info",
      message: "Guardando tus cambios...",
    });

    try {
      await updateCurrentProfile({
        userId: account.id,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
      });
      await refreshAccount();
      setStatus({
        tone: "success",
        message: "Tus datos se actualizaron correctamente.",
      });
    } catch (error) {
      reportError(error, {
        scope: "Account",
        action: "update_profile",
      });
      setStatus({
        tone: "error",
        message: "No pudimos actualizar tus datos. Intentá de nuevo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    navigate(ROUTES.HOME);
  };

  return (
    <AccountShell description="Consultá tu perfil, el estado de la cuenta y las acciones habilitadas para tu rol.">
      <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(14rem,0.74fr)_minmax(0,1fr)] md:items-start xl:grid-cols-[minmax(17rem,0.78fr)_minmax(0,0.94fr)_minmax(17rem,0.78fr)]">
        <section className="order-1 border border-violet-100/10 bg-white/5 p-5 text-white sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-200">
              Perfil
            </p>
            <span
              className={`shrink-0 border px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ${
                account.isActive
                  ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-200"
                  : "border-red-300/30 bg-red-400/10 text-red-200"
              }`}
            >
              {accountStatusLabel}
            </span>
          </div>

          <div className="mt-5 flex items-center gap-4 border-y border-violet-100/10 py-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center border border-violet-200/25 bg-violet-500/15 text-lg font-black text-violet-50">
              {getProfileInitials(account.firstName, account.lastName, "MC")}
            </div>
            <div className="min-w-0">
              <h2 className="wrap-break-word text-xl font-black leading-tight text-white">
                {account.firstName} {account.lastName}
              </h2>
              <p className="mt-1 break-all text-sm leading-relaxed text-violet-100/75">
                {user?.email ?? "Sin correo disponible"}
              </p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 md:grid-cols-1 lg:grid-cols-2">
            <AccountProfileMetric
              icon={FiShield}
              label="Rol"
              value={ROLE_LABELS[account.role]}
            />
            <AccountProfileMetric
              icon={account.isActive ? FiCheckCircle : FiAlertCircle}
              label="Estado"
              value={accountStatusLabel}
              valueClassName={
                account.isActive ? "text-emerald-300" : "text-red-300"
              }
            />
          </dl>

          {isAccountLoading && (
            <p
              className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-violet-200"
              role="status"
            >
              Sincronizando cuenta...
            </p>
          )}
        </section>

        <section className="order-3 border border-violet-100/10 bg-white p-5 text-neutral-900 sm:p-6 md:order-2 md:row-span-2 xl:row-span-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">
                Datos personales
              </p>
              <h2 className="mt-2 text-2xl font-black text-neutral-950">
                Información del perfil
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-500">
                Estos datos se usan para identificar tu cuenta dentro del club.
                El correo electrónico se mantiene desde tu acceso de Supabase.
              </p>
            </div>

            <span
              className={`w-fit border px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] ${
                hasProfileChanges
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              {hasProfileChanges ? "Cambios sin guardar" : "Sin cambios"}
            </span>
          </div>

          <form
            id="account-profile-form"
            className="mt-7 space-y-5"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <AccountField
                id="account-first-name"
                name="firstName"
                label="Nombre"
                value={values.firstName}
                error={errors.firstName}
                disabled={isFormDisabled}
                onChange={handleFieldChange}
              />

              <AccountField
                id="account-last-name"
                name="lastName"
                label="Apellido"
                value={values.lastName}
                error={errors.lastName}
                disabled={isFormDisabled}
                onChange={handleFieldChange}
              />
            </div>

            <label className="block" htmlFor="account-email">
              <span className="mb-2 block text-sm font-medium text-neutral-700">
                Correo electrónico
              </span>
              <input
                id="account-email"
                type="email"
                autoComplete="email"
                value={user?.email ?? ""}
                disabled
                className="w-full border border-neutral-200 bg-neutral-100 px-4 py-3 text-sm text-neutral-500 outline-none"
              />
            </label>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                type="submit"
                variant="cta"
                disabled={isSaveDisabled}
                className="w-full py-3 text-sm font-semibold sm:w-auto"
              >
                <FiSave aria-hidden="true" />
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>

              {!account.isActive && (
                <p className="text-sm font-medium text-red-700">
                  La cuenta debe estar activa para editar datos.
                </p>
              )}
            </div>
          </form>

          <div
            className={`mt-5 min-h-6 text-sm font-medium ${
              status?.tone === "success"
                ? "text-emerald-700"
                : status?.tone === "info"
                  ? "text-violet-700"
                  : "text-red-700"
            }`}
            aria-live="polite"
            role={status?.tone === "error" ? "alert" : "status"}
          >
            {status?.message}
          </div>
        </section>

        <section className="order-2 border border-violet-100/10 bg-neutral-950 p-5 text-white sm:p-6 md:order-3">
          <h2 className="text-lg font-black uppercase tracking-wide text-white">
            Acciones disponibles
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-violet-100/70">
            Estas son las acciones que podés ejecutar con tu rol actual.
          </p>

          <div className="mt-5 space-y-3">
            {availableActionIds.map((actionId) => (
              <AccountAction
                key={actionId}
                actionId={actionId}
                disabled={isSubmitting || isSigningOut}
                onSignOut={handleSignOut}
              />
            ))}
          </div>
        </section>
      </div>
    </AccountShell>
  );
};

type AccountShellProps = {
  children: ReactNode;
  description: string;
};

const AccountShell = ({ children, description }: AccountShellProps) => (
  <section className="min-h-screen bg-neutral-900 px-4 py-8 text-white sm:px-6 md:px-8 md:py-12">
    <div className="mx-auto w-full max-w-6xl overflow-hidden border border-violet-200/20 bg-neutral-950 shadow-2xl shadow-black/30">
      <header className="border-b border-violet-200/15 bg-violet-900 px-5 py-6 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">
          Cuenta
        </p>
        <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
          Mi cuenta
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100/85 sm:text-base">
          {description}
        </p>
      </header>

      {children}
    </div>
  </section>
);

const AccountLoadingState = () => (
  <AccountShell description="Estamos cargando tus datos de acceso y permisos.">
    <div className="grid gap-6 p-5 sm:p-8 md:grid-cols-[minmax(14rem,0.74fr)_minmax(0,1fr)] md:items-start xl:grid-cols-[minmax(17rem,0.78fr)_minmax(0,0.94fr)_minmax(17rem,0.78fr)]">
      <section className="order-1 border border-violet-100/10 bg-white/5 p-5 sm:p-6">
        <div className="flex items-center gap-4">
          <SkeletonBlock className="h-16 w-16 rounded-none" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-7 w-48" />
            <SkeletonBlock className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <SkeletonBlock className="h-16 w-full" />
          <SkeletonBlock className="h-16 w-full" />
        </div>
      </section>

      <section className="order-3 border border-violet-100/10 bg-white p-5 sm:p-6 md:order-2 md:row-span-2 xl:row-span-1">
        <SkeletonBlock className="h-4 w-36 bg-neutral-200" />
        <SkeletonBlock className="mt-3 h-8 w-56 bg-neutral-200" />
        <SkeletonBlock className="mt-4 h-4 w-full bg-neutral-200" />
        <SkeletonBlock className="mt-8 h-12 w-full bg-neutral-200" />
        <SkeletonBlock className="mt-5 h-12 w-full bg-neutral-200" />
        <SkeletonBlock className="mt-6 h-11 w-40 bg-neutral-200" />
      </section>

      <section className="order-2 border border-violet-100/10 bg-neutral-950 p-5 sm:p-6 md:order-3">
        <SkeletonBlock className="h-5 w-44" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <div className="mt-6 space-y-3">
          <SkeletonBlock className="h-18 w-full" />
          <SkeletonBlock className="h-18 w-full" />
        </div>
      </section>
    </div>
    <p className="sr-only" role="status">
      Cargando datos de tu cuenta.
    </p>
  </AccountShell>
);

type AccountErrorStateProps = {
  title?: string;
  message: string;
  isRetrying: boolean;
  onRetry: () => Promise<void>;
};

const AccountErrorState = ({
  title = "No pudimos cargar tu cuenta",
  message,
  isRetrying,
  onRetry,
}: AccountErrorStateProps) => (
  <AccountShell description="La sección necesita sincronizar tus datos antes de mostrarse.">
    <div className="p-5 sm:p-8">
      <div
        className="border border-red-400/40 bg-red-950/35 p-6 text-center shadow-lg shadow-black/20"
        role="alert"
      >
        <FiAlertCircle
          className="mx-auto h-10 w-10 text-red-200"
          aria-hidden="true"
        />
        <h2 className="mt-4 text-2xl font-black text-white">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-red-100/90">
          {message}
        </p>
        <Button
          type="button"
          variant="light"
          disabled={isRetrying}
          onClick={() => {
            void onRetry();
          }}
          className="mt-6"
        >
          <FiRefreshCw aria-hidden="true" />
          {isRetrying ? "Reintentando..." : "Reintentar"}
        </Button>
      </div>
    </div>
  </AccountShell>
);

type AccountProfileMetricProps = {
  icon: IconType;
  label: string;
  value: string;
  valueClassName?: string;
};

const AccountProfileMetric = ({
  icon: Icon,
  label,
  value,
  valueClassName = "text-white",
}: AccountProfileMetricProps) => (
  <div className="border border-violet-100/10 bg-white/5 p-3">
    <Icon
      className="h-4 w-4 shrink-0 text-violet-200"
      aria-hidden="true"
    />
    <dt className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-violet-200/70">
      {label}
    </dt>
    <dd className={`mt-1 wrap-break-word text-sm font-black ${valueClassName}`}>
      {value}
    </dd>
  </div>
);

type AccountActionProps = {
  actionId: AccountActionId;
  disabled: boolean;
  onSignOut: () => Promise<void>;
};

const AccountAction = ({
  actionId,
  disabled,
  onSignOut,
}: AccountActionProps) => {
  const action = ACTION_META[actionId];
  const Icon = action.icon;
  const content = (
    <>
      <Icon
        className="mt-0.5 h-5 w-5 shrink-0 text-violet-200"
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-white">
          {action.label}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-violet-100/65">
          {action.description}
        </span>
      </span>
    </>
  );
  const className =
    "flex w-full items-start gap-3 border border-violet-100/10 bg-white/5 p-4 text-left transition hover:border-violet-300/40 hover:bg-white/10";

  if (actionId === "open_dashboard") {
    return (
      <Link className={className} to={ROUTES.DASHBOARD}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={`${className} disabled:cursor-not-allowed disabled:opacity-60`}
      disabled={disabled}
      onClick={() => {
        void onSignOut();
      }}
    >
      {content}
    </button>
  );
};

type AccountFieldProps = {
  id: string;
  name: keyof AccountProfileValues;
  label: string;
  value: string;
  error?: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

const AccountField = ({
  id,
  name,
  label,
  value,
  error,
  disabled = false,
  onChange,
}: AccountFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-neutral-700">
        {label}
      </span>
      <input
        id={id}
        name={name}
        type="text"
        autoComplete={name === "firstName" ? "given-name" : "family-name"}
        value={value}
        disabled={disabled}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="w-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:bg-neutral-100 disabled:text-neutral-500"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-700">
          {error}
        </span>
      )}
    </label>
  );
};

export default Account;
