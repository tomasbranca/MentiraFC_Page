import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { FiAward, FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import { deleteDashboardTournament } from "../../../data/dashboardTournaments";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardTournamentItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../dashboard/DashboardConfirmDialog";
import DashboardEmptyState from "../../dashboard/DashboardEmptyState";
import DashboardErrorState from "../../dashboard/DashboardErrorState";
import DashboardLoadingState from "../../dashboard/DashboardLoadingState";
import DashboardPageHeader from "../../dashboard/DashboardPageHeader";
import DashboardTable from "../../dashboard/DashboardTable";
import PermissionActionButton from "../../dashboard/PermissionActionButton";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { useDashboardPermission } from "../../hooks/usePermission";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardTournamentsListFilters,
  filterDashboardTournamentsList,
  hasActiveDashboardTournamentsListFilters,
} from "./dashboardTournamentsList.filters";
import {
  dashboardTournamentsListQueryOptions,
  invalidateDashboardTournamentPublishDependencies,
} from "./dashboardTournaments.queries";
import { getTournamentReferenceCount } from "./dashboardTournaments.utils";

const TournamentThumbnail = ({ item }: { item: DashboardTournamentItem }) => {
  const imageUrl = getImageUrl(item.organizationImageUrl, {
    width: 120,
    height: 120,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(
    item.organizationImageUrl,
    [80, 120, 180],
    {
      height: (width) => width,
      fit: "max",
      quality: 72,
    }
  );

  if (!imageUrl) {
    return (
      <div
        aria-label="Torneo sin logo"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-violet-100/55"
      >
        <FiAward className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="56px"
      alt={item.organizationName || "Logo del organizador"}
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const getTournamentTitle = (item: DashboardTournamentItem): string =>
  [item.organizationName, item.name].filter(Boolean).join(" - ") ||
  "Torneo sin nombre";

const getTournamentDateLabel = (item: DashboardTournamentItem): string =>
  item.updatedAt ? `Actualizado ${formatDateTime(item.updatedAt)}` : "Sin fecha";

const TournamentStatusBadge = ({ item }: { item: DashboardTournamentItem }) => {
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

const ActiveBadge = ({ active }: { active?: boolean | null }) => (
  <span
    className={`inline-flex rounded-[3px] border px-2.5 py-1 text-xs font-medium ${
      active
        ? "border-violet-200/25 bg-violet-300/12 text-violet-50"
        : "border-white/10 bg-white/[0.035] text-violet-100/60"
    }`}
  >
    {active ? "Activo" : "Inactivo"}
  </span>
);

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

const DeleteTournamentButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardTournamentItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => {
  const referenceCount = getTournamentReferenceCount(item.referenceCounts);
  const isDisabled = isDeleting || referenceCount > 0;

  return (
    <button
      type="button"
      className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
      disabled={isDisabled}
      aria-label="Borrar torneo"
      title={
        referenceCount > 0
          ? "No se puede borrar un torneo con partidos o tablas vinculados"
          : "Borrar torneo"
      }
      onClick={() => {
        void (async () => {
          const confirmed = await confirmDashboardAction({
            title: "Borrar torneo",
            text: `Vas a eliminar "${getTournamentTitle(item)}" de Sanity. Esta accion solo esta disponible si no tiene partidos ni tablas vinculados.`,
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
};

const DashboardTournamentsList = () => {
  const [filters, setFilters] = useState(defaultDashboardTournamentsListFilters);
  const queryClient = useQueryClient();
  const canCreateTournament = useDashboardPermission("tournaments", "create");
  const canEditTournament = useDashboardPermission("tournaments", "edit");
  const canDeleteTournament = useDashboardPermission("tournaments", "delete");
  const tournamentsQuery = useQuery(dashboardTournamentsListQueryOptions());
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardTournament,
    onSuccess: () =>
      invalidateDashboardTournamentPublishDependencies(queryClient),
  });

  const handleDeleteTournament = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando torneo de Sanity...",
          success: "Torneo eliminado correctamente.",
          error: (error) =>
            error instanceof Error ? error.message : "No pudimos borrar el torneo.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTournamentsList",
        action: "delete_tournament",
        id: itemId,
      });
    }
  };

  const allTournaments = tournamentsQuery.data;
  const tournaments = useMemo(
    () => filterDashboardTournamentsList(allTournaments ?? [], filters),
    [allTournaments, filters]
  );
  const totalTournaments = allTournaments?.length ?? 0;
  const hasActiveFilters = hasActiveDashboardTournamentsListFilters(filters);
  const countLabel =
    hasActiveFilters && tournaments.length !== totalTournaments
      ? `${tournaments.length} de ${totalTournaments} cargados`
      : `${totalTournaments} cargados`;
  const hasRowActions = canEditTournament || canDeleteTournament;

  if (tournamentsQuery.isLoading) {
    return <DashboardLoadingState />;
  }

  if (tournamentsQuery.isError) {
    return (
      <DashboardErrorState
        title="No pudimos cargar los torneos"
        message="No se pudo cargar la pagina. Reintenta en unos segundos."
        onRetry={() => void tournamentsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <DashboardPageHeader
        eyebrow="Competencia"
        title="Torneos"
        countLabel={countLabel}
        description="Administra torneos, organizadores vinculados, plazas y participantes oficiales."
        actions={
          canCreateTournament ? (
            <PermissionActionButton
              resource="tournaments"
              action="create"
              to={ROUTES.DASHBOARD_TOURNAMENTS_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              ariaLabel="Crear torneo"
              title="Crear torneo"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </PermissionActionButton>
          ) : null
        }
      />

      {totalTournaments === 0 ? (
        <DashboardEmptyState message="Todavia no hay torneos ni borradores cargados." />
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-tournaments-search"
            searchLabel="Buscar torneos"
            searchPlaceholder="Organizador, nombre o participantes..."
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((current) => ({ ...current, search }))
            }
            selects={[
              {
                id: "dashboard-tournaments-status",
                label: "Estado",
                value: filters.status,
                onChange: (status) =>
                  setFilters((current) => ({
                    ...current,
                    status: status as typeof filters.status,
                  })),
                options: DASHBOARD_STATUS_FILTER_OPTIONS,
              },
              {
                id: "dashboard-tournaments-active",
                label: "Vigencia",
                value: filters.active,
                onChange: (active) =>
                  setFilters((current) => ({
                    ...current,
                    active: active as typeof filters.active,
                  })),
                options: [
                  { value: "all", label: "Todos" },
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" },
                ],
              },
            ]}
            showClear={hasActiveFilters}
            onClear={() => setFilters(defaultDashboardTournamentsListFilters())}
            filteredCount={tournaments.length}
            totalCount={totalTournaments}
          />

          {tournaments.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={() => setFilters(defaultDashboardTournamentsListFilters())}
            />
          ) : (
        <div className="p-3 sm:p-5">
          <DashboardTable
            mobile={
              <>
              {tournaments.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                      {getTournamentDateLabel(item)}
                    </p>
                    <p className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-widest text-violet-100/45">
                      {item.participants.length} equipos
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                    <TournamentThumbnail item={item} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {getTournamentTitle(item)}
                      </h3>
                      <p className="mt-1 text-xs text-violet-100/55">
                        {getTournamentReferenceCount(item.referenceCounts)} usos
                        vinculados
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <div className="flex flex-wrap gap-2">
                      <TournamentStatusBadge item={item} />
                      <ActiveBadge active={item.active} />
                    </div>
                    {hasRowActions ? (
                      <div className="flex gap-2">
                        {canEditTournament ? (
                          <PermissionActionButton
                            resource="tournaments"
                            action="edit"
                            to={ROUTES.DASHBOARD_TOURNAMENTS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            ariaLabel="Editar torneo"
                            title="Editar torneo"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </PermissionActionButton>
                        ) : null}
                        {canDeleteTournament ? (
                          <DeleteTournamentButton
                            item={item}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteTournament}
                          />
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </article>
              ))}
              </>
            }
          >

              <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                <tr>
                  <th className="px-5 py-4">Torneo</th>
                  <th className="px-5 py-4">Participantes</th>
                  <th className="px-5 py-4">Uso</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <TournamentThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {getTournamentTitle(item)}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            {getTournamentDateLabel(item)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {item.participants.length}
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {getTournamentReferenceCount(item.referenceCounts)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <TournamentStatusBadge item={item} />
                        <ActiveBadge active={item.active} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEditTournament ? (
                          <PermissionActionButton
                            resource="tournaments"
                            action="edit"
                            to={ROUTES.DASHBOARD_TOURNAMENTS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            ariaLabel="Editar torneo"
                            title="Editar torneo"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </PermissionActionButton>
                        ) : null}
                        {canDeleteTournament ? (
                          <DeleteTournamentButton
                            item={item}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteTournament}
                          />
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
          </DashboardTable>
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardTournamentsList;
