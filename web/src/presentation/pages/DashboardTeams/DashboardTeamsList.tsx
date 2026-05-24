import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiFlag, FiPlus, FiShield, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardTeam,
  fetchDashboardTeams,
} from "../../../data/dashboardTeams";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardTeamItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { useDashboardPermission } from "../../hooks/usePermission";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardTeamsListFilters,
  filterDashboardTeamsList,
  hasActiveDashboardTeamsListFilters,
} from "./dashboardTeamsList.filters";
import { getTeamReferenceCount, getTeamUsageLabel } from "./dashboardTeams.utils";

const TeamThumbnail = ({ item }: { item: DashboardTeamItem }) => {
  const imageUrl = getImageUrl(item.logoUrl, {
    width: 120,
    height: 120,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.logoUrl, [80, 120, 180], {
    height: (width) => width,
    fit: "max",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Club sin escudo"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-violet-100/55"
      >
        <FiShield className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="56px"
      alt={`Escudo de ${item.name}`}
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const getTeamDateLabel = (item: DashboardTeamItem): string =>
  item.updatedAt ? `Actualizado ${formatDateTime(item.updatedAt)}` : "Sin fecha";

const TeamStatusBadge = ({ item }: { item: DashboardTeamItem }) => {
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

const TeamKindBadge = ({ item }: { item: DashboardTeamItem }) => (
  <span
    className={
      item.isMain
        ? "inline-flex rounded-[3px] border border-sky-300/15 bg-sky-300/10 px-2.5 py-1 text-xs font-medium text-sky-100"
        : "inline-flex rounded-[3px] border border-white/10 bg-white/3 px-2.5 py-1 text-xs font-medium text-violet-100/60"
    }
  >
    {item.isMain ? "Club principal" : "Rival"}
  </span>
);

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

const DeleteTeamButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardTeamItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => {
  const referenceCount = getTeamReferenceCount(item.referenceCounts);
  const isDisabled = isDeleting || item.isMain || referenceCount > 0;
  const disabledTitle = item.isMain
    ? "No se puede borrar el club principal"
    : "No se puede borrar un club con referencias vinculadas";

  return (
    <button
      type="button"
      className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
      disabled={isDisabled}
      aria-label="Borrar club"
      title={isDisabled ? disabledTitle : "Borrar club"}
      onClick={() => {
        void (async () => {
          const confirmed = await confirmDashboardAction({
            title: "Borrar club",
            text: `Vas a eliminar "${item.name}" de Sanity. Esta accion solo esta disponible si no tiene partidos, torneos o tablas vinculadas.`,
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

const DashboardTeamsList = () => {
  const [filters, setFilters] = useState(defaultDashboardTeamsListFilters);
  const queryClient = useQueryClient();
  const canCreateTeam = useDashboardPermission("teams", "create");
  const canEditTeam = useDashboardPermission("teams", "edit");
  const canDeleteTeam = useDashboardPermission("teams", "delete");
  const teamsQuery = useQuery({
    queryKey: queryKeys.dashboard.teams.all,
    queryFn: async () => {
      try {
        return await fetchDashboardTeams();
      } catch (error) {
        reportError(error, {
          page: "DashboardTeamsList",
          action: "load_teams",
        });
        throw error;
      }
    },
  });
  const invalidateTeamQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.teams.all }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.matches.options,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.tournaments.options,
      }),
      queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.table.options,
      }),
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.games.latest }),
      queryClient.invalidateQueries({ queryKey: queryKeys.games.finished }),
      queryClient.invalidateQueries({ queryKey: queryKeys.tournaments.current }),
    ]);
  };
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardTeam,
    onSuccess: invalidateTeamQueries,
  });

  const handleDeleteTeam = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando club de Sanity...",
          success: "Club eliminado correctamente.",
          error: (error) =>
            error instanceof Error ? error.message : "No pudimos borrar el club.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardTeamsList",
        action: "delete_team",
        id: itemId,
      });
    }
  };

  const allTeams = teamsQuery.data;
  const teams = useMemo(
    () => filterDashboardTeamsList(allTeams ?? [], filters),
    [allTeams, filters]
  );
  const totalTeams = allTeams?.length ?? 0;
  const hasActiveFilters = hasActiveDashboardTeamsListFilters(filters);
  const countLabel =
    hasActiveFilters && teams.length !== totalTeams
      ? `${teams.length} de ${totalTeams} cargados`
      : `${totalTeams} cargados`;
  const hasRowActions = canEditTeam || canDeleteTeam;

  if (teamsQuery.isLoading) {
    return <Loader />;
  }

  if (teamsQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar los clubes"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void teamsQuery.refetch()}
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
              <h2 className="text-3xl font-black text-white">Clubes</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {countLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra clubes, rivales, escudos y el equipo principal.
            </p>
          </div>

          {canCreateTeam ? (
            <Link
              to={ROUTES.DASHBOARD_TEAMS_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              aria-label="Crear club"
              title="Crear club"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {totalTeams === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay clubes ni borradores cargados.
        </div>
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-teams-search"
            searchLabel="Buscar clubes"
            searchPlaceholder="Nombre, tipo o uso..."
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((current) => ({ ...current, search }))
            }
            selects={[
              {
                id: "dashboard-teams-status",
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
                id: "dashboard-teams-kind",
                label: "Tipo",
                value: filters.kind,
                onChange: (kind) =>
                  setFilters((current) => ({
                    ...current,
                    kind: kind as typeof filters.kind,
                  })),
                options: [
                  { value: "all", label: "Todos" },
                  { value: "main", label: "Principal" },
                  { value: "rivals", label: "Rivales" },
                ],
              },
              {
                id: "dashboard-teams-usage",
                label: "Uso",
                value: filters.usage,
                onChange: (usage) =>
                  setFilters((current) => ({
                    ...current,
                    usage: usage as typeof filters.usage,
                  })),
                options: [
                  { value: "all", label: "Todos" },
                  { value: "with_references", label: "Con referencias" },
                  { value: "without_references", label: "Sin referencias" },
                ],
              },
            ]}
            showClear={hasActiveFilters}
            onClear={() => setFilters(defaultDashboardTeamsListFilters())}
            filteredCount={teams.length}
            totalCount={totalTeams}
          />

          {teams.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={() => setFilters(defaultDashboardTeamsListFilters())}
            />
          ) : (
            <div className="p-3 sm:p-5">
              <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
                <div className="divide-y divide-white/8 md:hidden">
                  {teams.map((item) => (
                    <article
                      key={item.id}
                      className="p-3 text-sm text-violet-50 sm:p-4"
                    >
                      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                          {getTeamDateLabel(item)}
                        </p>
                        <p className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-widest text-violet-100/45">
                          {getTeamReferenceCount(item.referenceCounts)} usos
                        </p>
                      </div>

                      <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                        <TeamThumbnail item={item} />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                            {item.name}
                          </h3>
                          <p className="mt-1 line-clamp-1 text-xs text-violet-100/55">
                            {getTeamUsageLabel(item.referenceCounts)}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                        <div className="flex flex-wrap gap-2">
                          <TeamStatusBadge item={item} />
                          <TeamKindBadge item={item} />
                        </div>
                        {hasRowActions ? (
                          <div className="flex gap-2">
                            {canEditTeam ? (
                              <Link
                                to={ROUTES.DASHBOARD_TEAMS_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar club"
                                title="Editar club"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteTeam ? (
                              <DeleteTeamButton
                                item={item}
                                isDeleting={deleteMutation.isPending}
                                onDelete={handleDeleteTeam}
                              />
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  ))}
                </div>

                <table className="hidden w-full border-collapse text-left md:table">
                  <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                    <tr>
                      <th className="px-5 py-4">Club</th>
                      <th className="px-5 py-4">Tipo</th>
                      <th className="px-5 py-4">Uso</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teams.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <div className="flex items-center gap-3">
                            <TeamThumbnail item={item} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {item.name}
                              </p>
                              <p className="truncate text-xs text-violet-100/55">
                                {getTeamDateLabel(item)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <TeamKindBadge item={item} />
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getTeamUsageLabel(item.referenceCounts)}
                        </td>
                        <td className="px-5 py-4">
                          <TeamStatusBadge item={item} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEditTeam ? (
                              <Link
                                to={ROUTES.DASHBOARD_TEAMS_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar club"
                                title="Editar club"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteTeam ? (
                              <DeleteTeamButton
                                item={item}
                                isDeleting={deleteMutation.isPending}
                                onDelete={handleDeleteTeam}
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

export default DashboardTeamsList;
