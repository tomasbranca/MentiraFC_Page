import { type ChangeEvent, type ReactNode } from "react";

type BaseFieldProps = {
  id: string;
  label: string;
  error?: string;
  dirty?: boolean;
  children: ReactNode;
};

const FieldFrame = ({
  id,
  label,
  error,
  dirty = false,
  children,
}: BaseFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-2 flex items-center gap-2 text-sm font-medium text-violet-100">
        <span>{label}</span>
        {dirty && (
          <span className="rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-[0.14em] text-amber-100">
            Editado
          </span>
        )}
      </span>
      {children}
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
};

type FieldProps = {
  id: string;
  name: string;
  label: string;
  value: string;
  error?: string;
  dirty?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const Field = ({
  id,
  name,
  label,
  value,
  error,
  dirty = false,
  onChange,
}: FieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <FieldFrame id={id} label={label} error={error} dirty={dirty}>
      <input
        id={id}
        name={name}
        type="text"
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="min-h-11 w-full min-w-0 max-w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
      />
    </FieldFrame>
  );
};

