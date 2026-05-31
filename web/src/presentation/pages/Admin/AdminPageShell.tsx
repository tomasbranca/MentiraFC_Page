import type { ReactNode } from "react";

type AdminPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

const AdminPageShell = ({
  eyebrow,
  title,
  description,
  children,
  aside,
}: AdminPageShellProps) => (
  <div className="space-y-5 p-4 sm:p-6">
    <header className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div className="rounded-md border border-[#ded7ef] bg-white p-4 sm:p-5">
        <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-violet-700">
          {eyebrow}
        </p>
        <h1 className="mt-3 text-3xl font-black uppercase leading-none text-[#17151d] sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
          {description}
        </p>
      </div>
      {aside}
    </header>
    {children}
  </div>
);

export default AdminPageShell;
