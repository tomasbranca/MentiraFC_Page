import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardMatch,
  fetchDashboardMatches,
} from "../../../data/dashboardMatches";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardMatchItem } from "../../../types/dashboard";
import { ROUTES } from "../../../shared/routing";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { formatDateTime } from "../../utils/date.utils";
import {
  getDashboardMatchCompetitionLabel,
  getDashboardMatchStateLabel,
} from "./dashboardMatches.utils";

const MatchThumbnail = ({ item }: { item: DashboardMatchItem }) => {
  const imageUrl = getImageUrl(item.rivalImageUrl, {
    width: 120,
    height: 120,
    fit: "max",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.rivalImageUrl, [80, 120, 180], {
    height: (width) => width,
    fit: "max",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Partido sin escudo rival"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-100/55"
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
      alt={item.rivalName || "Escudo rival"}
      loading="lazy"
      decoding="async"
      className="h-14 w-14 shrink-0 rounded-[3px] border border-white/10 object-contain"
    />
  );
};

const getMatchTitle = (item: DashboardMatchItem): string =>
  item.rivalName ? `Mentira FC vs ${item.rivalName}` : "Partido sin rival";

const getMatchDateLabel = (item: DashboardMatchItem): string => {
  if (item.date) {
    return formatDateTime(item.date);
  }

  if (item.updatedAt) {
    return `Borrador guardado ${formatDateTime(item.updatedAt)}`;
  }

  return "Sin fecha";
};

const getMatchScoreLabel = (item: DashboardMatchItem): string => {
  if (item.state !== "finalizado") {
    return "VS";
  }

  return `${item.result?.goalsFor ?? 0} - ${item.result?.goalsAgainst ?? 0}`;
};

const MatchStatusBadge = ({ item }: { item: DashboardMatchItem }) => {
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

const DeleteMatchButton = ({
  itemId,
  itemTitle,
  isDeleting,
  onDelete,
}: {
  itemId: string;
  itemTitle: string;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => (
  <button
    type="button"
    className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
    disabled={isDeleting}
    aria-label="Borrar partido"
    title="Borrar partido"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar partido",
          text: `Vas a eliminar "${itemTitle}". Esta accion tambien borra eventos de gol asociados.`,
          confirmText: "Borrar",
          icon: "warning",
          variant: "danger",
        });

        if (confirmed) {
          await onDelete(itemId);
        }
      })();
    }}
  >
    <FiTrash2 className="size-4" aria-hidden="true" />
  </button>
);

const DashboardMatchesList = () => {
  const queryClient = useQueryClient();
  const matchesQuery = useQuery({
    queryKey: queryKeys.dashboard.matches.all,
    queryFn: async () => {
      try {
        return await fetchDashboardMatches();
      } catch (error) {
        reportError(error, {
          page: "DashboardMatchesList",
          action: "load_matches",
        });
        throw error;
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardMatch,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.matches.all,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.games.latest }),
        queryClient.invalidateQueries({ queryKey: queryKeys.games.finished }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.games.tournamentFinished,
        }),
        queryClient.invalidateQueries({ queryKey: queryKeys.events.goals() }),
      ]);
    },
  });

  const handleDeleteMatch = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando partido de Sanity...",
          success: "Partido eliminado correctamente.",
          error: "No pudimos borrar el partido.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardMatchesList",
        action: "delete_match",
        id: itemId,
      });
    }
  };

  if (matchesQuery.isLoading) {
    return <Loader />;
  }

  if (matchesQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar los partidos"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void matchesQuery.refetch()}
      />
    );
  }

  const matches = matchesQuery.data ?? [];

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Competencia
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">Partidos</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {matches.length} partidos
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra fixtures, resultados y jugadores que participaron.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_MATCHES_NEW}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            aria-label="Crear partido"
            title="Crear partido"
          >
            <FiPlus className="size-5" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {matches.length === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay partidos ni borradores cargados.
        </div>
      ) : (
        <div className="p-3 sm:p-5">
          <div className="overflow-hidden rounded-[4px] border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 md:hidden">
              {matches.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="flex min-w-0 gap-3">
                    <MatchThumbnail item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                        {getMatchDateLabel(item)}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-black uppercase leading-snug text-white">
                        {getMatchTitle(item)}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-violet-100/60">
                        {getDashboardMatchCompetitionLabel(item.competition)} -{" "}
                        {item.location || "Sin ubicacion"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xl font-black text-white">
                        {getMatchScoreLabel(item)}
                      </p>
                      <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-violet-100/45">
                        {getDashboardMatchStateLabel(item.state)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <MatchStatusBadge item={item} />
                    <div className="flex gap-2">
                      <Link
                        to={ROUTES.DASHBOARD_MATCHES_EDIT(item.id)}
                        className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                        aria-label="Editar partido"
                        title="Editar partido"
                      >
                        <FiEdit2 className="size-4" aria-hidden="true" />
                      </Link>
                      <DeleteMatchButton
                        itemId={item.id}
                        itemTitle={getMatchTitle(item)}
                        isDeleting={deleteMutation.isPending}
                        onDelete={handleDeleteMatch}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-left md:table">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.16em] text-violet-100/60">
                <tr>
                  <th className="px-5 py-4">Partido</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Resultado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {matches.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/[0.04]"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <MatchThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {getMatchTitle(item)}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            {item.tournamentLabel ||
                              getDashboardMatchCompetitionLabel(item.competition)}
                            {item.location ? ` - ${item.location}` : ""}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {getMatchDateLabel(item)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col items-start gap-2">
                        <MatchStatusBadge item={item} />
                        <span className="text-xs text-violet-100/55">
                          {getDashboardMatchStateLabel(item.state)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-lg font-black text-white">
                      {getMatchScoreLabel(item)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={ROUTES.DASHBOARD_MATCHES_EDIT(item.id)}
                          className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                          aria-label="Editar partido"
                          title="Editar partido"
                        >
                          <FiEdit2 className="size-4" aria-hidden="true" />
                        </Link>
                        <DeleteMatchButton
                          itemId={item.id}
                          itemTitle={getMatchTitle(item)}
                          isDeleting={deleteMutation.isPending}
                          onDelete={handleDeleteMatch}
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

export default DashboardMatchesList;
