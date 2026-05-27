import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiBarChart2, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { deleteDashboardTable } from "../../../data/dashboardTable";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardTableItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { useDashboardPermission } from "../../hooks/usePermission";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardTableListFilters,
  filterDashboardTableList,
  hasActiveDashboardTableListFilters,
} from "./dashboardTableList.filters";
import {
  dashboardTablesListQueryOptions,
  invalidateDashboardTablePublishDependencies,
} from "./dashboardTable.queries";

const TableThumbnail = ({ item }: { item: DashboardTableItem }) => {
  const imageUrl = getImageUrl(item.tournamentImageUrl, {
    width: 120,
    height: 120,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.tournamentImageUrl, [80, 120, 180], {
    height: (width) => width,
    fit: "max",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Tabla sin logo"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-violet-100/55"
      >
        <FiBarChart2 className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="56px"
      alt={item.tournamentName || "Logo del torneo"}
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const getTableTitle = (item: DashboardTableItem): string =>
  [
    item.tournamentOrganizationName,
    item.tournamentName,
    item.label || (item.matchdayNumber ? `Fecha ${item.matchdayNumber}` : null),
  ]
    .filter(Boolean)
    .join(" - ") || "Tabla sin torneo";

const getTableDateLabel = (item: DashboardTableItem): string => {
  if (item.snapshotDate) return formatDateTime(item.snapshotDate);
  if (item.updatedAt) return `Borrador guardado ${formatDateTime(item.updatedAt)}`;
  return "Sin fecha";
};

const TableStatusBadge = ({ item }: { item: DashboardTableItem }) => {
  if (item.status === "draft") {
    return (
      <span className="inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-100">
        {item.hasPublishedVersion ? "Borrador" : "Borrador sin publicar"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
      Publicado
    </span>
  );
};

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

const DeleteTableButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardTableItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => (
  <button
    type="button"
    className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
    disabled={isDeleting}
    aria-label="Borrar tabla"
    title="Borrar tabla"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar tabla actual",
          text: `Vas a eliminar "${getTableTitle(item)}" del documento editable. Las tablas historicas generadas no se borran desde esta seccion.`,
          confirmText: "Borrar",
          icon: "warning",
          variant: "danger",
        });

        if (confirmed) {
          await onDelete(item.id);
        }
      })();
    }}
  >
    <FiTrash2 className="size-4" aria-hidden="true" />
  </button>
);

const DashboardTableList = () => {
  const [filters, setFilters] = useState(defaultDashboardTableListFilters);
  const queryClient = useQueryClient();
  const canCreateTable = useDashboardPermission("table", "create");
  const canEditTable = useDashboardPermission("table", "edit");
  const canDeleteTable = useDashboardPermission("table", "delete");
  const tablesQuery = useQuery(dashboardTablesListQueryOptions());
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardTable,
    onSuccess: () => invalidateDashboardTablePublishDependencies(queryClient),
  });

  const handleDeleteTable = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando tabla actual de Sanity...",
          success: "Tabla eliminada correctamente.",
          error: "No pudimos borrar la tabla.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTableList",
        action: "delete_table",
        id: itemId,
      });
    }
  };

  const allTables = tablesQuery.data;
  const tables = useMemo(
    () => filterDashboardTableList(allTables ?? [], filters),
    [allTables, filters]
  );
  const totalTables = allTables?.length ?? 0;
  const hasActiveFilters = hasActiveDashboardTableListFilters(filters);
  const countLabel =
    hasActiveFilters && tables.length !== totalTables
      ? `${tables.length} de ${totalTables} actuales`
      : `${totalTables} actuales`;
  const hasRowActions = canEditTable || canDeleteTable;

  if (tablesQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (tablesQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar las tablas"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void tablesQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Competencia
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">Tabla</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {countLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra la tabla actual editable. El historial generado queda
              como lectura interna.
            </p>
          </div>

          {canCreateTable ? (
            <Link
              to={ROUTES.DASHBOARD_TABLE_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              aria-label="Crear tabla"
              title="Crear tabla"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {totalTables === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay tablas actuales ni borradores cargados.
        </div>
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-table-search"
            searchLabel="Buscar tablas"
            searchPlaceholder="Torneo, fecha o etiqueta..."
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((current) => ({ ...current, search }))
            }
            selects={[
              {
                id: "dashboard-table-status",
                label: "Estado",
                value: filters.status,
                onChange: (status) =>
                  setFilters((current) => ({
                    ...current,
                    status: status as typeof filters.status,
                  })),
                options: DASHBOARD_STATUS_FILTER_OPTIONS,
              },
            ]}
            showClear={hasActiveFilters}
            onClear={() => setFilters(defaultDashboardTableListFilters())}
            filteredCount={tables.length}
            totalCount={totalTables}
          />

          {tables.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={() => setFilters(defaultDashboardTableListFilters())}
            />
          ) : (
        <div className="p-3 sm:p-5">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 lg:hidden">
              {tables.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                      {getTableDateLabel(item)}
                    </p>
                    <p className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-widest text-violet-100/45">
                      {item.rows.length} filas
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                    <TableThumbnail item={item} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {getTableTitle(item)}
                      </h3>
                      <p className="mt-1 text-xs text-violet-100/55">
                        Corte:{" "}
                        {item.gamesThroughDate
                          ? formatDateTime(item.gamesThroughDate)
                          : "sin definir"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <TableStatusBadge item={item} />
                    {hasRowActions ? (
                      <div className="flex gap-2">
                        {canEditTable ? (
                          <Link
                            to={ROUTES.DASHBOARD_TABLE_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            aria-label="Editar tabla"
                            title="Editar tabla"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {canDeleteTable ? (
                          <DeleteTableButton
                            item={item}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteTable}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-left lg:table">
              <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                <tr>
                  <th className="px-5 py-4">Tabla</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Filas</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TableThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {getTableTitle(item)}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            Corte:{" "}
                            {item.gamesThroughDate
                              ? formatDateTime(item.gamesThroughDate)
                              : "sin definir"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {getTableDateLabel(item)}
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {item.rows.length}
                    </td>
                    <td className="px-5 py-4">
                      <TableStatusBadge item={item} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEditTable ? (
                          <Link
                            to={ROUTES.DASHBOARD_TABLE_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            aria-label="Editar tabla"
                            title="Editar tabla"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {canDeleteTable ? (
                          <DeleteTableButton
                            item={item}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteTable}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardTableList;
