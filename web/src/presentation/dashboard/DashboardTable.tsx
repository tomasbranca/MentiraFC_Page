import type { ReactNode } from "react";

type DashboardTableProps = {
  mobile?: ReactNode;
  children: ReactNode;
};

const DashboardTable = ({ mobile, children }: DashboardTableProps) => (
  <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
    {mobile ? <div className="divide-y divide-white/8 lg:hidden">{mobile}</div> : null}
    <table className="hidden w-full border-collapse text-left lg:table">
      {children}
    </table>
  </div>
);

export default DashboardTable;
