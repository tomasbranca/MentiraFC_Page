import { FiSearch, FiX } from "react-icons/fi";

export type DashboardListFilterSelect = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
};

export type DashboardListFiltersProps = {
  searchId: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  selects?: DashboardListFilterSelect[];
  onClear?: () => void;
  showClear?: boolean;
  filteredCount: number;
  totalCount: number;
};

const controlClassName =
  "min-h-11 w-full min-w-0 max-w-full rounded-[3px] border border-white/10 bg-[#0f0f13] px-3 py-2.5 text-sm text-white outline-none transition focus:border-violet-300/80 focus:ring-2 focus:ring-violet-500/20 sm:px-3.5";

const DashboardListFilters = ({
  searchId,
  searchLabel,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  selects = [],
  onClear,
  showClear = false,
  filteredCount,
  totalCount,
}: DashboardListFiltersProps) => {
  const isFiltering = filteredCount !== totalCount;

  return (
    <section
      className="border-b border-white/10 bg-[#151518] px-3 py-4 sm:px-5"
      aria-label="Filtros del listado"
    >
      <div className="flex flex-col gap-3">
        <label className="block min-w-0" htmlFor={searchId}>
          <span className="sr-only">{searchLabel}</span>
          <span className="relative block min-w-0">
            <FiSearch
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-violet-100/45"
              aria-hidden="true"
            />
            <input
              id={searchId}
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className={`${controlClassName} pl-10 sm:pl-10`}
              autoComplete="off"
              enterKeyHint="search"
            />
          </span>
        </label>

        {(selects.length > 0 || showClear) && (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
            {selects.map((select) => (
              <label
                key={select.id}
                className="block min-w-0 sm:min-w-38 sm:flex-1 sm:basis-[calc(50%-0.25rem)] lg:basis-[calc(33.333%-0.34rem)]"
                htmlFor={select.id}
              >
                <span className="mb-2 block text-xs font-medium text-violet-100/70">
                  {select.label}
                </span>
                <select
                  id={select.id}
                  value={select.value}
                  onChange={(event) => select.onChange(event.target.value)}
                  className={controlClassName}
                >
                  {select.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ))}

            {showClear && onClear ? (
              <div className="flex items-end sm:shrink-0">
                <button
                  type="button"
                  onClick={onClear}
                  className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm font-medium text-violet-100/80 transition hover:border-violet-200/35 hover:bg-white/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 sm:w-auto"
                >
                  <FiX className="size-4" aria-hidden="true" />
                  Limpiar filtros
                </button>
              </div>
            ) : null}
          </div>
        )}

        {isFiltering ? (
          <p className="text-xs text-violet-100/60" aria-live="polite">
            Mostrando {filteredCount} de {totalCount}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default DashboardListFilters;
