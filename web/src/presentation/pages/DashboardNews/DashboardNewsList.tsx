import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FiEdit2, FiPlus, FiTrash2 } from "react-icons/fi";

import {
  deleteDashboardNews,
  fetchDashboardNews,
} from "../../../data/dashboardNews";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardNewsItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { useDashboardPermission } from "../../hooks/usePermission";
import { ROUTES } from "../../../shared/routing";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardNewsListFilters,
  filterDashboardNewsList,
  hasActiveDashboardNewsListFilters,
} from "./dashboardNewsList.filters";

const NewsThumbnail = ({ item }: { item: DashboardNewsItem }) => {
  const imageUrl = getImageUrl(item.imageUrl, {
    width: 160,
    height: 112,
    fit: "crop",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(item.imageUrl, [96, 160, 240], {
    height: (width) => Math.round(width * 0.7),
    fit: "crop",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Noticia sin imagen de portada"
        className="flex h-16 w-20 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-[0.65rem] font-black uppercase tracking-[0.18em] text-violet-100/55"
      >
        MFC
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="80px"
      alt={item.imageAlt || `Portada de ${getNewsTitle(item)}`}
      loading="lazy"
      decoding="async"
      className="h-16 w-20 shrink-0 rounded-[3px] border border-white/10 object-cover"
    />
  );
};

const getNewsTitle = (item: DashboardNewsItem): string =>
  item.title.trim() || "Sin titulo";

const getNewsDescription = (item: DashboardNewsItem): string =>
  item.description.trim() || "Borrador sin descripcion";

const getNewsDateLabel = (item: DashboardNewsItem): string => {
  if (item.date) {
    return formatDateTime(item.date);
  }

  if (item.updatedAt) {
    return `Borrador guardado ${formatDateTime(item.updatedAt)}`;
  }

  return "Sin fecha";
};

const NewsStatusBadge = ({ item }: { item: DashboardNewsItem }) => {
  if (item.status === "draft") {
    return (
      <span className="inline-flex rounded-[3px] border border-amber-200/20 bg-amber-200/10 px-2.5 py-1 text-xs font-medium text-amber-100">
        {item.hasPublishedVersion ? "Borrador" : "Borrador sin publicar"}
      </span>
    );
  }

  return (
    <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
      Publicada
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

const DeleteNewsButton = ({
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
    aria-label="Borrar noticia"
    title="Borrar noticia"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar noticia",
          text: `Vas a eliminar "${itemTitle}". Esta acción no se puede deshacer.`,
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

const DashboardNewsList = () => {
  const [filters, setFilters] = useState(defaultDashboardNewsListFilters);
  const queryClient = useQueryClient();
  const canCreateNews = useDashboardPermission("news", "create");
  const canEditNews = useDashboardPermission("news", "edit");
  const canDeleteNews = useDashboardPermission("news", "delete");
  const newsQuery = useQuery({
    queryKey: queryKeys.dashboard.news.all,
    queryFn: async () => {
      try {
        return await fetchDashboardNews();
      } catch (error) {
        reportError(error, {
          page: "DashboardNewsList",
          action: "load_news",
        });
        throw error;
      }
    },
  });
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardNews,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.dashboard.news.all,
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.news.all });
    },
  });

  const handleDeleteNews = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando noticia de Sanity...",
          success: "Noticia eliminada correctamente.",
          error: "No pudimos borrar la noticia.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardNewsList",
        action: "delete_news",
        id: itemId,
      });
    }
  };

  const allNews = newsQuery.data;
  const news = useMemo(
    () => filterDashboardNewsList(allNews ?? [], filters),
    [allNews, filters]
  );
  const totalNews = allNews?.length ?? 0;
  const hasActiveFilters = hasActiveDashboardNewsListFilters(filters);
  const countLabel =
    hasActiveFilters && news.length !== totalNews
      ? `${news.length} de ${totalNews} noticias`
      : `${totalNews} noticias`;
  const hasRowActions = canEditNews || canDeleteNews;

  if (newsQuery.isLoading) {
    return <Loader />;
  }

  if (newsQuery.isError) {
    return (
      <ErrorFallback
        title="No pudimos cargar las noticias"
        message="Intentá nuevamente en unos minutos."
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-4 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Contenido
            </p>
            <div className="mt-3 flex flex-wrap items-end gap-2.5">
              <h2 className="text-3xl font-black text-white">Noticias</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {countLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administrá publicaciones y borradores del sitio.
            </p>
          </div>

          {canCreateNews ? (
            <Link
              to={ROUTES.DASHBOARD_NEWS_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              aria-label="Crear noticia"
              title="Crear noticia"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {totalNews === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavía no hay noticias ni borradores cargados.
        </div>
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-news-search"
            searchLabel="Buscar noticias"
            searchPlaceholder="Titulo, descripcion o slug..."
            searchValue={filters.search}
            onSearchChange={(search) =>
              setFilters((current) => ({ ...current, search }))
            }
            selects={[
              {
                id: "dashboard-news-status",
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
            onClear={() => setFilters(defaultDashboardNewsListFilters())}
            filteredCount={news.length}
            totalCount={totalNews}
          />

          {news.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={() => setFilters(defaultDashboardNewsListFilters())}
            />
          ) : (
        <div className="p-3 sm:p-5">
          <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 md:hidden">
              {news.map((item) => (
                <article key={item.id} className="p-3 text-sm text-violet-50 sm:p-4">
                  <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                      {getNewsDateLabel(item)}
                    </p>
                    <span className="shrink-0 rounded-[3px] border border-violet-300/15 bg-violet-300/10 px-2 py-0.5 text-[0.58rem] font-bold uppercase tracking-[0.12em] text-violet-100/60">
                      Noticia
                    </span>
                  </div>

                  <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                    <NewsThumbnail item={item} />
                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                        {getNewsTitle(item)}
                      </h3>
                    </div>
                  </div>

                  <p className="mt-3 line-clamp-2 text-xs leading-snug text-violet-100/60">
                    {getNewsDescription(item)}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                    <NewsStatusBadge item={item} />
                    {hasRowActions ? (
                      <div className="flex gap-2">
                        {canEditNews ? (
                          <Link
                            to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            aria-label="Editar noticia"
                            title="Editar noticia"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {canDeleteNews ? (
                          <DeleteNewsButton
                            itemId={item.id}
                            itemTitle={getNewsTitle(item)}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteNews}
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
                  <th className="px-5 py-4">Noticia</th>
                  <th className="px-5 py-4">Fecha</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {news.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <NewsThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {getNewsTitle(item)}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            {getNewsDescription(item)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {getNewsDateLabel(item)}
                    </td>
                    <td className="px-5 py-4">
                      <NewsStatusBadge item={item} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        {canEditNews ? (
                          <Link
                            to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            aria-label="Editar noticia"
                            title="Editar noticia"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </Link>
                        ) : null}
                        {canDeleteNews ? (
                          <DeleteNewsButton
                            itemId={item.id}
                            itemTitle={getNewsTitle(item)}
                            isDeleting={deleteMutation.isPending}
                            onDelete={handleDeleteNews}
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

export default DashboardNewsList;
