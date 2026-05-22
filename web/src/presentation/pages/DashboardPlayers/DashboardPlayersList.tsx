import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardPlayer,
  fetchDashboardPlayers,
} from "../../../data/dashboardPlayers";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardPlayerItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { formatDate } from "../../utils/date.utils";
import { getDashboardPlayerPositionLabel } from "./dashboardPlayers.utils";

const PlayerThumbnail = ({ item }: { item: DashboardPlayerItem }) => {
  const imageUrl = getImageUrl(item.imageUrl, {
    width: 120,
    height: 150,
    fit: "crop",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.imageUrl, [64, 96, 120, 180], {
    height: (width) => Math.round(width * 1.25),
    fit: "crop",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Jugador sin foto"
        className="flex h-18 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-100/55"
      >
        MFC
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="56px"
      alt={`Foto de ${item.fullName}`}
      loading="lazy"
      decoding="async"
      className="h-18 w-14 shrink-0 rounded-[3px] border border-white/10 object-cover object-top"
    />
  );
};

const PlayerStatusBadge = ({ item }: { item: DashboardPlayerItem }) => {
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

const getPlayerNumberLabel = (item: DashboardPlayerItem): string =>
  item.number == null ? "Sin numero" : `#${item.number}`;

const getPlayerBirthDateLabel = (item: DashboardPlayerItem): string =>
  item.birthDate ? formatDate(item.birthDate) : "Sin fecha";

const actionButtonClassName =
  "inline-flex h-11 w-11 items-center justify-center rounded-[3px] border text-white transition hover:bg-white/[0.055] focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const deleteToastOptions = {
  style: {
    minWidth: "16rem",
  },
} as const;

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
    aria-label="Borrar jugador"
    title="Borrar jugador"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar jugador",
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

const DashboardPlayersList = () => {
  const queryClient = useQueryClient();
  const playersQuery = useQuery({
    queryKey: queryKeys.dashboard.players.all,
    queryFn: async () => {
      try {
        return await fetchDashboardPlayers();
      } catch (error) {
        reportError(error, {
          page: "DashboardPlayersList",
          action: "load_players",
        });
        throw error;
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardPlayer,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.players.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.players.all }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.matches.options,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.games.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.goals() }),
      ]);
    },
  });

  const handleDeletePlayer = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando jugador de Sanity...",
          success: "Jugador eliminado correctamente.",
          error: "No pudimos borrar el jugador.",
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

  if (playersQuery.isLoading) {
    return <Loader />;
  }

  if (playersQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar los jugadores"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void playersQuery.refetch()}
      />
    );
  }

  const players = playersQuery.data ?? [];

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Plantel
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">Jugadores</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {players.length} jugadores
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra fichas, fotos y borradores del plantel.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_PLAYERS_NEW}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            aria-label="Crear jugador"
            title="Crear jugador"
          >
            <FiPlus className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {players.length === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay jugadores ni borradores cargados.
        </div>
      ) : (
        <div className="p-3 sm:p-5">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 md:hidden">
              {players.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="mb-3 flex min-w-0 justify-end">
                    <p className="truncate text-[0.58rem] font-semibold uppercase tracking-widset text-violet-100/45">
                      {getDashboardPlayerPositionLabel(item.position)}
                    </p>
                  </div>

                  <div className="grid min-w-0 grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3">
                    <PlayerThumbnail item={item} />
                    <div className="min-w-0">
                      <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {item.fullName}
                      </h3>
                      <p className="mt-1 text-xs font-semibold text-violet-100/55">
                        {getPlayerNumberLabel(item)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <PlayerStatusBadge item={item} />
                    <div className="flex gap-2">
                      <Link
                        to={ROUTES.DASHBOARD_PLAYERS_EDIT(item.id)}
                        className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                        aria-label="Editar jugador"
                        title="Editar jugador"
                      >
                        <FiEdit2 className="size-4" aria-hidden="true" />
                      </Link>
                      <DeletePlayerButton
                        item={item}
                        isDeleting={deleteMutation.isPending}
                        onDelete={handleDeletePlayer}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-left md:table">
              <thead className="bg-white/2.5 text-xs uppercase tracking-[0.16em] text-violet-100/60">
                <tr>
                  <th className="px-5 py-4">Jugador</th>
                  <th className="px-5 py-4">Posicion</th>
                  <th className="px-5 py-4">Nacimiento</th>
                  <th className="px-5 py-4">Estado</th>
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
                        <PlayerThumbnail item={item} />
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
                      {getPlayerBirthDateLabel(item)}
                    </td>
                    <td className="px-5 py-4">
                      <PlayerStatusBadge item={item} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={ROUTES.DASHBOARD_PLAYERS_EDIT(item.id)}
                          className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                          aria-label="Editar jugador"
                          title="Editar jugador"
                        >
                          <FiEdit2 className="size-4" aria-hidden="true" />
                        </Link>
                        <DeletePlayerButton
                          item={item}
                          isDeleting={deleteMutation.isPending}
                          onDelete={handleDeletePlayer}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPlayersList;
