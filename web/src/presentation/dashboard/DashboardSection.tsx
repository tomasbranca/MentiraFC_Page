import type { ReactNode } from "react";

type DashboardSectionProps = {
  title?: string;
  countLabel?: string | number;
  children: ReactNode;
  className?: string;
};

const DashboardSection = ({
  title,
  countLabel,
  children,
  className = "",
}: DashboardSectionProps) => (
  <section
    className={`overflow-hidden rounded-sm border border-white/10 bg-[#16161a] ${className}`.trim()}
  >
    {title ? (
      <div className="flex flex-wrap items-center gap-2.5 border-b border-white/10 bg-white/2.5 px-4 py-3">
        <h3 className="text-base font-black uppercase tracking-wide text-white">
          {title}
        </h3>
        {countLabel != null ? (
          <span className="rounded-[3px] border border-white/10 bg-black/15 px-2.5 py-1 text-xs font-medium text-violet-100/70">
            {countLabel}
          </span>
        ) : null}
      </div>
    ) : null}
    {children}
  </section>
);

export default DashboardSection;
