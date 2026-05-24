import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaUserTie } from "react-icons/fa";
import { GiSoccerBall } from "react-icons/gi";
import { FiEdit2, FiEye, FiEyeOff, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardPlayer,
  setDashboardPlayerActiveStatus,
} from "../../../data/dashboardPlayers";
import {
  deleteDashboardStaff,
} from "../../../data/dashboardStaff";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type {
  DashboardPlayerItem,
  DashboardStaffItem,
} from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { useDashboardPermission } from "../../hooks/usePermission";
import { formatDate } from "../../utils/date.utils";
import {
  dashboardPlayersListQueryOptions,
  invalidateDashboardPlayerPublishDependencies,
} from "./dashboardPlayers.queries";
import {
  defaultDashboardPlayersListFilters,
  filterDashboardPlayersList,
  filterDashboardStaffList,
  hasActiveDashboardPlayersListFilters,
} from "./dashboardPlayersList.filters";
import {
  getDashboardPlayerActiveStatusConfirmCopy,
  getDashboardPlayerPositionLabel,
  PLAYER_POSITION_OPTIONS,
  shouldConfirmDashboardPlayerActiveStatusChange,
} from "./dashboardPlayers.utils";
import { getDashboardStaffRoleLabel } from "./dashboardStaff.utils";
import {
  dashboardStaffListQueryOptions,
  invalidateDashboardStaffPublishDependencies,
} from "./dashboardStaff.queries";

const thumbnailClassName =
  "h-18 w-14 shrink-0 rounded-[3px] border border-white/10 object-cover object-top";

const PlantelThumbnail = ({
  imageUrl,
  alt,
  fallbackLabel,
}: {
  imageUrl?: string | null;
  alt: string;
  fallbackLabel: string;
}) => {
  const src = getImageUrl(imageUrl, {
    width: 120,
    height: 150,
    fit: "crop",
    quality: 72,
  });
  const srcSet = getImageSrcSet(imageUrl, [64, 96, 120, 180], {
    height: (width) => Math.round(width * 1.25),
    fit: "crop",
    quality: 72,
  });

  if (!src) {
    return (
      <div
        aria-label={fallbackLabel}
        className="flex h-18 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-100/55"
      >
        MFC
      </div>
    );
  }

  return (
    <img
      src={src}
      srcSet={srcSet || undefined}
      sizes="56px"
      alt={alt}
      loading="lazy"
      decoding="async"
      className={thumbnailClassName}
    />
  );
};

const PlantelRosterBadge = ({
  canManageActiveStatus,
  isActive,
  compact = false,
}: {
  canManageActiveStatus: boolean;
  isActive: boolean;
  compact?: boolean;
}) => {
  if (!canManageActiveStatus) {
    return (
      <span className="inline-flex rounded-[3px] border border-white/10 bg-white/3 px-2.5 py-1 text-xs font-medium text-violet-100/55">
        {compact ? "Sin publicar" : "Sin version publica"}
      </span>
    );
  }

  if (isActive) {
    return (
      <span className="inline-flex rounded-[3px] border border-sky-300/15 bg-sky-300/10 px-2.5 py-1 text-xs font-medium text-sky-100">
        {compact ? "Activo" : "Activo en plantel"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[3px] border border-neutral-300/15 bg-neutral-300/10 px-2.5 py-1 text-xs font-medium text-neutral-200">
      {compact ? "Inactivo" : "Inactivo en plantel"}
    </span>
  );
};

const PlantelStatusBadge = ({
  status,
  hasPublishedVersion,
}: {
  status: "published" | "draft";
  hasPublishedVersion: boolean;
}) => {
  if (status === "draft") {
    return (
      <span className="inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-100">
        {hasPublishedVersion ? "Borrador" : "Borrador sin publicar"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
      Publicado
    </span>
  );
};

const getPlayerNumberLabel = (item: DashboardPlayerItem): string =>
  item.number == null ? "Sin numero" : `#${item.number}`;

const getBirthDateLabel = (
  item: Pick<DashboardPlayerItem | DashboardStaffItem, "birthDate">
): string => (item.birthDate ? formatDate(item.birthDate) : "Sin fecha");

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

const TogglePlayerActiveButton = ({
  item,
  isUpdating,
  onToggle,
}: {
  item: DashboardPlayerItem;
  isUpdating: boolean;
  onToggle: (item: DashboardPlayerItem, nextIsActive: boolean) => void | Promise<void>;
}) => {
  const nextIsActive = !item.isActive;
  const label = item.isActive ? "Desactivar del plantel" : "Activar en el plantel";

  return (
    <button
      type="button"
      className={`${actionButtonClassName} border-white/10 text-violet-50 hover:border-violet-200/35 hover:bg-white/8`}
      disabled={!item.canManageActiveStatus || isUpdating}
      aria-label={label}
      title={
        item.canManageActiveStatus
          ? label
          : "Publica el jugador para activarlo o desactivarlo en el plantel"
      }
      onClick={() => {
        void onToggle(item, nextIsActive);
      }}
    >
      {item.isActive ? (
        <FiEyeOff className="size-4" aria-hidden="true" />
      ) : (
        <FiEye className="size-4" aria-hidden="true" />
      )}
    </button>
  );
};

const DeletePlayerButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardPlayerItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => (
  <button
    type="button"
    className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
    disabled={isDeleting}
    aria-label="Borrar integrante"
    title="Borrar integrante"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar integrante del plantel",
          text: `Vas a eliminar "${item.fullName}" y quitar sus referencias de partidos y eventos.`,
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

const DeleteStaffButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardStaffItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => (
  <button
    type="button"
    className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
    disabled={isDeleting}
    aria-label="Borrar integrante"
    title="Borrar integrante"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar integrante del plantel",
          text: `Vas a eliminar "${item.fullName}" del cuerpo tecnico.`,
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

const SectionTitle = ({ title, count }: { title: string; count: number }) => (
  <div className="flex flex-wrap items-center gap-2.5 border-b border-white/10 bg-white/2.5 px-4 py-3">
    <h3 className="text-base font-black uppercase tracking-wide text-white">
      {title}
    </h3>
    <span className="rounded-[3px] border border-white/10 bg-black/15 px-2.5 py-1 text-xs font-medium text-violet-100/70">
      {count}
    </span>
  </div>
);

const DashboardPlantelMobileCard = ({
  metaLeft,
  metaRight,
  thumbnail,
  title,
  subtitle,
  badges,
  actions,
}: {
  metaLeft: ReactNode;
  metaRight: ReactNode;
  thumbnail: ReactNode;
  title: string;
  subtitle?: string;
  badges: ReactNode;
  actions: ReactNode;
}) => (
  <article className="p-3 text-sm text-violet-50 sm:p-4">
    <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
      <div className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
        {metaLeft}
      </div>
      <div className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-widest text-violet-100/45">
        {metaRight}
      </div>
    </div>

    <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
      {thumbnail}
      <div className="min-w-0">
        <h4 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
          {title}
        </h4>
        {subtitle ? (
          <p className="mt-1 text-xs leading-snug text-violet-100/55">{subtitle}</p>
        ) : null}
      </div>
    </div>

    <div className="mt-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-white/8 pt-3">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {badges}
      </div>
      <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
    </div>
  </article>
);

const DashboardPlayersList = () => {
  const [filters, setFilters] = useState(defaultDashboardPlayersListFilters);
  const queryClient = useQueryClient();
  const canCreatePlayer = useDashboardPermission("players", "create");
  const canEditPlayer = useDashboardPermission("players", "edit");
  const canDeletePlayer = useDashboardPermission("players", "delete");
  const canUpdatePlayerStatus = useDashboardPermission(
    "players",
    "updateActiveStatus"
  );
  const canCreateStaff = useDashboardPermission("staff", "create");
  const canEditStaff = useDashboardPermission("staff", "edit");
  const canDeleteStaff = useDashboardPermission("staff", "delete");
  const playersQuery = useQuery(dashboardPlayersListQueryOptions());
  const staffQuery = useQuery(dashboardStaffListQueryOptions());
  const deletePlayerMutation = useMutation({
    mutationFn: deleteDashboardPlayer,
    onSuccess: () =>
      invalidateDashboardPlayerPublishDependencies(queryClient),
  });
  const activeStatusMutation = useMutation({
    mutationFn: ({
      id,
      isActive,
    }: {
      id: string;
      isActive: boolean;
    }) => setDashboardPlayerActiveStatus(id, isActive),
    onSuccess: () =>
      invalidateDashboardPlayerPublishDependencies(queryClient),
  });
  const deleteStaffMutation = useMutation({
    mutationFn: deleteDashboardStaff,
    onSuccess: () => invalidateDashboardStaffPublishDependencies(queryClient),
  });

  const handleTogglePlayerActiveStatus = async (
    item: DashboardPlayerItem,
    nextIsActive: boolean
  ) => {
    const runToggle = async () => {
      try {
        await toast.promise(
          activeStatusMutation.mutateAsync({
            id: item.id,
            isActive: nextIsActive,
          }),
          {
            loading: nextIsActive
              ? "Activando jugador en el plantel..."
              : "Desactivando jugador del plantel...",
            success: nextIsActive
              ? "Jugador activado en el plantel publico."
              : "Jugador desactivado del plantel publico.",
            error: "No pudimos actualizar el estado del jugador.",
          },
          deleteToastOptions
        );
      } catch (error) {
        reportError(error, {
          page: "DashboardPlayersList",
          action: "toggle_player_active_status",
          id: item.id,
          nextIsActive,
        });
      }
    };

    if (!shouldConfirmDashboardPlayerActiveStatusChange(item, nextIsActive)) {
      await runToggle();
      return;
    }

    const copy = getDashboardPlayerActiveStatusConfirmCopy(item, nextIsActive);
    const confirmed = await confirmDashboardAction({
      ...copy,
      icon: "warning",
      variant: nextIsActive ? "primary" : "danger",
    });

    if (confirmed) {
      await runToggle();
    }
  };

  const handleDeletePlayer = async (itemId: string) => {
    try {
      await toast.promise(
        deletePlayerMutation.mutateAsync(itemId),
        {
          loading: "Eliminando integrante de Sanity...",
          success: "Integrante eliminado correctamente.",
          error: "No pudimos borrar el integrante.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardPlayersList",
        action: "delete_player",
        id: itemId,
      });
    }
  };

  const handleDeleteStaff = async (itemId: string) => {
    try {
      await toast.promise(
        deleteStaffMutation.mutateAsync(itemId),
        {
          loading: "Eliminando integrante de Sanity...",
          success: "Integrante eliminado correctamente.",
          error: "No pudimos borrar el integrante.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardPlayersList",
        action: "delete_staff",
        id: itemId,
      });
    }
  };

  const allPlayers = playersQuery.data;
  const allStaff = staffQuery.data;
  const players = useMemo(
    () => filterDashboardPlayersList(allPlayers ?? [], filters),
    [allPlayers, filters]
  );
  const staff = useMemo(
    () =>
      filterDashboardStaffList(allStaff ?? [], {
        search: filters.search,
        status: filters.status,
      }),
    [allStaff, filters.search, filters.status]
  );
  const totalPlayers = allPlayers?.length ?? 0;
  const totalStaff = allStaff?.length ?? 0;
  const totalMembers = totalPlayers + totalStaff;
  const filteredMembers = players.length + staff.length;
  const hasActiveFilters = hasActiveDashboardPlayersListFilters(filters);
  const countLabel =
    hasActiveFilters && filteredMembers !== totalMembers
      ? `${filteredMembers} de ${totalMembers} integrantes`
      : `${totalMembers} integrantes`;
  const hasPlayerRowActions =
    canUpdatePlayerStatus || canEditPlayer || canDeletePlayer;
  const hasStaffRowActions = canEditStaff || canDeleteStaff;

  if (playersQuery.isLoading || staffQuery.isLoading) {
    return <DashboardContentLoader />;
  }

  if (playersQuery.isError || staffQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar el plantel"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => {
          void playersQuery.refetch();
          void staffQuery.refetch();
        }}
      />
    );
  }

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Gestion deportiva
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">Plantel</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {countLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra fichas, fotos, cuerpo tecnico y borradores.
            </p>
          </div>

          {canCreatePlayer || canCreateStaff ? (
            <div className="flex shrink-0 gap-2">
              {canCreatePlayer ? (
                <Link
                  to={ROUTES.DASHBOARD_PLAYERS_NEW}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  aria-label="Crear jugador"
                  title="Crear jugador"
                >
                  <GiSoccerBall className="size-5" aria-hidden="true" />
                </Link>
              ) : null}
              {canCreateStaff ? (
                <Link
                  to={ROUTES.DASHBOARD_STAFF_NEW}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-white/10 bg-white/[0.035] text-white transition hover:border-violet-200/35 hover:bg-white/8 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  aria-label="Crear integrante del cuerpo tecnico"
                  title="Crear integrante del cuerpo tecnico"
                >
                  <FaUserTie className="size-5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>

      {totalMembers === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay integrantes del plantel ni borradores cargados.
        </div>
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-players-search"
            searchLabel="Buscar integrantes"
            searchPlaceholder="Nombre, numero, posicion o rol..."
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((current) => ({ ...current, search }))
            }
            selects={[
              {
                id: "dashboard-players-status",
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
                id: "dashboard-players-position",
                label: "Posicion (jugadores)",
                value: filters.position,
                onChange: (position) =>
                  setFilters((current) => ({
                    ...current,
                    position: position as typeof filters.position,
                  })),
                options: [
                  { value: "all", label: "Todas" },
                  ...PLAYER_POSITION_OPTIONS,
                ],
              },
              {
                id: "dashboard-players-roster",
                label: "Plantel publico (jugadores)",
                value: filters.roster,
                onChange: (roster) =>
                  setFilters((current) => ({
                    ...current,
                    roster: roster as typeof filters.roster,
                  })),
                options: [
                  { value: "all", label: "Todos" },
                  { value: "active", label: "Activos" },
                  { value: "inactive", label: "Inactivos" },
                ],
              },
            ]}
            showClear={hasActiveFilters}
            onClear={() => setFilters(defaultDashboardPlayersListFilters())}
            filteredCount={filteredMembers}
            totalCount={totalMembers}
          />

          {filteredMembers === 0 ? (
            <DashboardListFilteredEmpty
              onClear={() => setFilters(defaultDashboardPlayersListFilters())}
            />
          ) : (
        <div className="space-y-5 p-3 sm:p-5">
          <section className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <SectionTitle title="Jugadores" count={players.length} />

            {totalPlayers === 0 ? (
              <div className="p-5 text-sm text-violet-100/75">
                Todavia no hay jugadores ni borradores cargados.
              </div>
            ) : players.length === 0 ? (
              <div className="p-5 text-sm text-violet-100/75">
                Ningun jugador coincide con los filtros aplicados.
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/8 md:hidden">
                  {players.map((item) => (
                    <DashboardPlantelMobileCard
                      key={item.id}
                      metaLeft={getDashboardPlayerPositionLabel(item.position)}
                      metaRight={getPlayerNumberLabel(item)}
                      thumbnail={
                        <PlantelThumbnail
                          imageUrl={item.imageUrl}
                          alt={`Foto de ${item.fullName}`}
                          fallbackLabel="Integrante sin foto"
                        />
                      }
                      title={item.fullName}
                      subtitle={
                        item.birthDate
                          ? `Nac. ${formatDate(item.birthDate)}`
                          : undefined
                      }
                      badges={
                        <>
                          <PlantelStatusBadge
                            status={item.status}
                            hasPublishedVersion={item.hasPublishedVersion}
                          />
                          <PlantelRosterBadge
                            canManageActiveStatus={item.canManageActiveStatus}
                            isActive={item.isActive}
                            compact
                          />
                        </>
                      }
                      actions={
                        hasPlayerRowActions ? (
                          <>
                            {canUpdatePlayerStatus ? (
                              <TogglePlayerActiveButton
                                item={item}
                                isUpdating={activeStatusMutation.isPending}
                                onToggle={handleTogglePlayerActiveStatus}
                              />
                            ) : null}
                            {canEditPlayer ? (
                              <Link
                                to={ROUTES.DASHBOARD_PLAYERS_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar integrante"
                                title="Editar integrante"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeletePlayer ? (
                              <DeletePlayerButton
                                item={item}
                                isDeleting={deletePlayerMutation.isPending}
                                onDelete={handleDeletePlayer}
                              />
                            ) : null}
                          </>
                        ) : null
                      }
                    />
                  ))}
                </div>

                <table className="hidden w-full border-collapse text-left md:table">
                  <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                    <tr>
                      <th className="px-5 py-4">Integrante</th>
                      <th className="px-5 py-4">Posicion</th>
                      <th className="px-5 py-4">Nacimiento</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4">Plantel</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {players.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <div className="flex items-center gap-3">
                            <PlantelThumbnail
                              imageUrl={item.imageUrl}
                              alt={`Foto de ${item.fullName}`}
                              fallbackLabel="Integrante sin foto"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {getPlayerNumberLabel(item)} {item.fullName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getDashboardPlayerPositionLabel(item.position)}
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getBirthDateLabel(item)}
                        </td>
                        <td className="px-5 py-4">
                          <PlantelStatusBadge
                            status={item.status}
                            hasPublishedVersion={item.hasPublishedVersion}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <PlantelRosterBadge
                            canManageActiveStatus={item.canManageActiveStatus}
                            isActive={item.isActive}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canUpdatePlayerStatus ? (
                              <TogglePlayerActiveButton
                                item={item}
                                isUpdating={activeStatusMutation.isPending}
                                onToggle={handleTogglePlayerActiveStatus}
                              />
                            ) : null}
                            {canEditPlayer ? (
                              <Link
                                to={ROUTES.DASHBOARD_PLAYERS_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar integrante"
                                title="Editar integrante"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeletePlayer ? (
                              <DeletePlayerButton
                                item={item}
                                isDeleting={deletePlayerMutation.isPending}
                                onDelete={handleDeletePlayer}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>

          <section className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <SectionTitle title="Cuerpo tecnico" count={staff.length} />

            {totalStaff === 0 ? (
              <div className="p-5 text-sm text-violet-100/75">
                Todavia no hay integrantes del cuerpo tecnico ni borradores
                cargados.
              </div>
            ) : staff.length === 0 ? (
              <div className="p-5 text-sm text-violet-100/75">
                Ningun integrante del cuerpo tecnico coincide con los filtros
                aplicados.
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/8 md:hidden">
                  {staff.map((item) => (
                    <DashboardPlantelMobileCard
                      key={item.id}
                      metaLeft={getDashboardStaffRoleLabel(item.role)}
                      metaRight={
                        item.birthDate ? formatDate(item.birthDate) : "Sin fecha"
                      }
                      thumbnail={
                        <PlantelThumbnail
                          imageUrl={item.imageUrl}
                          alt={`Foto de ${item.fullName}`}
                          fallbackLabel="Integrante sin foto"
                        />
                      }
                      title={item.fullName}
                      badges={
                        <PlantelStatusBadge
                          status={item.status}
                          hasPublishedVersion={item.hasPublishedVersion}
                        />
                      }
                      actions={
                        hasStaffRowActions ? (
                          <>
                            {canEditStaff ? (
                              <Link
                                to={ROUTES.DASHBOARD_STAFF_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar integrante"
                                title="Editar integrante"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteStaff ? (
                              <DeleteStaffButton
                                item={item}
                                isDeleting={deleteStaffMutation.isPending}
                                onDelete={handleDeleteStaff}
                              />
                            ) : null}
                          </>
                        ) : null
                      }
                    />
                  ))}
                </div>

                <table className="hidden w-full border-collapse text-left md:table">
                  <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                    <tr>
                      <th className="px-5 py-4">Integrante</th>
                      <th className="px-5 py-4">Rol</th>
                      <th className="px-5 py-4">Nacimiento</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staff.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <div className="flex items-center gap-3">
                            <PlantelThumbnail
                              imageUrl={item.imageUrl}
                              alt={`Foto de ${item.fullName}`}
                              fallbackLabel="Integrante sin foto"
                            />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {item.fullName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getDashboardStaffRoleLabel(item.role)}
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getBirthDateLabel(item)}
                        </td>
                        <td className="px-5 py-4">
                          <PlantelStatusBadge
                            status={item.status}
                            hasPublishedVersion={item.hasPublishedVersion}
                          />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEditStaff ? (
                              <Link
                                to={ROUTES.DASHBOARD_STAFF_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar integrante"
                                title="Editar integrante"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteStaff ? (
                              <DeleteStaffButton
                                item={item}
                                isDeleting={deleteStaffMutation.isPending}
                                onDelete={handleDeleteStaff}
                              />
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        </div>
          )}
        </>
      )}
    </div>
  );
};

export default DashboardPlayersList;
