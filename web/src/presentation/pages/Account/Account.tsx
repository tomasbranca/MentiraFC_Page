import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from "react";

import { updateCurrentProfile } from "../../../data/account";
import { reportError } from "../../../lib/errors/errorLogger";
import Button from "../../components/Button/Button";
import { useAuth } from "../../context/useAuth";
import {
  ROLE_LABELS,
  type AccountProfileErrors,
  type AccountProfileValues,
  validateAccountProfile,
} from "./account.utils";

type FormStatus = {
  tone: "success" | "error";
  message: string;
};

const Account = () => {
  const { account, user, refreshAccount } = useAuth();
  const [values, setValues] = useState<AccountProfileValues>(() => ({
    firstName: account?.firstName ?? "",
    lastName: account?.lastName ?? "",
  }));
  const [errors, setErrors] = useState<AccountProfileErrors>({});
  const [status, setStatus] = useState<FormStatus | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!account) {
      return;
    }

    setValues({
      firstName: account.firstName,
      lastName: account.lastName,
    });
  }, [account]);

  if (!account) {
    return null;
  }

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
      return;
    }

    setIsSubmitting(true);

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

  return (
    <section className="min-h-screen bg-neutral-900 px-4 py-8 text-white sm:px-6 md:px-8 md:py-12">
      <div className="mx-auto w-full max-w-5xl overflow-hidden border border-violet-200/20 bg-neutral-950 shadow-2xl shadow-black/30">
        <header className="border-b border-violet-200/15 bg-violet-900 px-5 py-6 sm:px-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">
            Cuenta
          </p>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-4xl">
            Mi cuenta
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-violet-100/85 sm:text-base">
            Consultá tus datos de acceso y mantené actualizado tu nombre dentro
            del sitio.
          </p>
        </header>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,1.05fr)]">
          <section className="border border-violet-100/10 bg-white/5 p-5">
            <h2 className="text-lg font-bold uppercase tracking-wide text-violet-100">
              Estado de la cuenta
            </h2>

            <dl className="mt-5 space-y-4 text-sm">
              <div>
                <dt className="text-violet-200/75">Correo electrónico</dt>
                <dd className="mt-1 font-medium text-white">
                  {user?.email ?? "Sin correo disponible"}
                </dd>
              </div>

              <div>
                <dt className="text-violet-200/75">Rol</dt>
                <dd className="mt-1 font-medium text-white">
                  {ROLE_LABELS[account.role]}
                </dd>
              </div>

              <div>
                <dt className="text-violet-200/75">Estado</dt>
                <dd className="mt-1 font-medium text-emerald-300">Activo</dd>
              </div>
            </dl>
          </section>

          <section className="border border-violet-100/10 bg-white p-5 text-neutral-900 sm:p-6">
            <h2 className="text-lg font-black uppercase tracking-wide text-neutral-900">
              Datos personales
            </h2>
            <p className="mt-2 text-sm text-neutral-500">
              Estos datos se usan para identificar tu cuenta dentro del club.
            </p>

            <form className="mt-6 space-y-5" onSubmit={handleSubmit} noValidate>
              <AccountField
                id="account-first-name"
                name="firstName"
                label="Nombre"
                value={values.firstName}
                error={errors.firstName}
                disabled={isSubmitting}
                onChange={handleFieldChange}
              />

              <AccountField
                id="account-last-name"
                name="lastName"
                label="Apellido"
                value={values.lastName}
                error={errors.lastName}
                disabled={isSubmitting}
                onChange={handleFieldChange}
              />

              <Button
                type="submit"
                variant="cta"
                disabled={isSubmitting}
                className="w-full py-3 text-sm font-semibold sm:w-auto"
              >
                {isSubmitting ? "Guardando..." : "Guardar cambios"}
              </Button>
            </form>

            <div
              className={`mt-5 min-h-6 text-sm ${
                status?.tone === "success" ? "text-emerald-700" : "text-red-700"
              }`}
              aria-live="polite"
              role={status?.tone === "error" ? "alert" : "status"}
            >
              {status?.message}
            </div>
          </section>
        </div>
      </div>
    </section>
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

export default Account;
