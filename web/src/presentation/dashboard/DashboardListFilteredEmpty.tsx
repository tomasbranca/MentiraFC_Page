import DashboardEmptyState from "./DashboardEmptyState";

type DashboardListFilteredEmptyProps = {
  onClear: () => void;
};

const DashboardListFilteredEmpty = ({
  onClear,
}: DashboardListFilteredEmptyProps) => (
  <DashboardEmptyState
    message="No hay resultados con los filtros aplicados."
    action={
      <button
        type="button"
        onClick={onClear}
        className="inline-flex min-h-11 items-center rounded-[3px] border border-white/10 bg-white/[0.035] px-3 py-2 text-sm font-medium text-violet-100/85 transition hover:border-violet-200/35 hover:bg-white/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
      >
        Limpiar filtros
      </button>
    }
  />
);

export default DashboardListFilteredEmpty;
