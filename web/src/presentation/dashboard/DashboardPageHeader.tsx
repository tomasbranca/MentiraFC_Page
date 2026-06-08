import type { ReactNode } from "react";

type DashboardPageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  countLabel?: string;
  actions?: ReactNode;
};

const DashboardPageHeader = ({
  eyebrow,
  title,
  description,
  countLabel,
  actions,
}: DashboardPageHeaderProps) => (
  <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
            {eyebrow}
          </p>
        ) : null}
        <div className={eyebrow ? "mt-3 flex flex-wrap items-end gap-2.5" : "flex flex-wrap items-end gap-2.5"}>
          <h2 className="text-3xl font-black text-white">{title}</h2>
          {countLabel ? (
            <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
              {countLabel}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-2 text-sm text-violet-100/65">{description}</p>
        ) : null}
      </div>

      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  </header>
);

export default DashboardPageHeader;
