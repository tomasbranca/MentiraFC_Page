import type { ChangeEvent } from "react";

import type { AuthFormValues } from "./login.utils";

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

export const AuthField = ({
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

export const PasswordField = ({
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
