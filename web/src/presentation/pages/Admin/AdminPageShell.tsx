import type { ReactNode } from "react";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
  actions?: ReactNode;
};

const AdminPageShell = ({
  eyebrow,
  title,
  description,
  children,
  aside,
  actions,
}: AdminPageShellProps) => (
  <div className="space-y-4 p-3 sm:p-5 md:p-6">
    <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="rounded-md border border-[#ded7ef] bg-white p-4 shadow-[0_12px_32px_rgba(23,21,29,0.06)] sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-2xl font-black uppercase leading-none text-[#17151d] sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
              {description}
            </p>
          </div>
          {actions ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
      {aside}
    </header>
    {children}
  </div>
);

export default AdminPageShell;
