import { useEffect, useRef, type ChangeEvent } from "react";

import type { DashboardNewsInput } from "../../../types/dashboard";

type FieldProps = {
  id: string;
  name: keyof DashboardNewsInput;
  label: string;
  value: string;
  error?: string;
  type?: "text" | "datetime-local";
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export const Field = ({
  id,
  name,
  label,
  value,
  error,
  type = "text",
  onChange,
}: FieldProps) => {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-violet-100">
        {label}
      </span>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="min-h-11 w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
};

type TextAreaFieldProps = {
  id: string;
  name: "description";
  label: string;
  value: string;
  error?: string;
  onChange: (event: ChangeEvent<HTMLTextAreaElement>) => void;
};

export const TextAreaField = ({
  id,
  name,
  label,
  value,
  error,
  onChange,
}: TextAreaFieldProps) => {
  const errorId = error ? `${id}-error` : undefined;
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [value]);

  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-violet-100">
        {label}
      </span>
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        rows={3}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className="min-h-24 w-full resize-none overflow-hidden rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5"
      />
      {error && (
        <span id={errorId} className="mt-2 block text-sm text-red-300">
          {error}
        </span>
      )}
    </label>
  );
};
