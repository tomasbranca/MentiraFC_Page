import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { deleteDashboardNews } from "../../../data/dashboardNews";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import type { DashboardNewsItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../dashboard/DashboardConfirmDialog";
import DashboardEmptyState from "../../dashboard/DashboardEmptyState";
import DashboardErrorState from "../../dashboard/DashboardErrorState";
import DashboardLoadingState from "../../dashboard/DashboardLoadingState";
import DashboardPageHeader from "../../dashboard/DashboardPageHeader";
import DashboardTable from "../../dashboard/DashboardTable";
import PermissionActionButton from "../../dashboard/PermissionActionButton";
import { useDashboardPermission } from "../../hooks/usePermission";
import { ROUTES } from "../../../shared/routing";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardNewsListFilters,
  hasActiveDashboardNewsListFilters,
} from "./dashboardNewsList.filters";
import {
  dashboardNewsPageQueryOptions,
  invalidateDashboardNewsPublishDependencies,
} from "./dashboardNews.queries";

const DASHBOARD_NEWS_PAGE_LIMIT = 20;
const DASHBOARD_NEWS_SEARCH_MAX_LENGTH = 80;
const EMPTY_DASHBOARD_NEWS: DashboardNewsItem[] = [];

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

const paginationButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm font-medium text-violet-100/80 transition hover:border-violet-200/35 hover:bg-white/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const DashboardNewsPagination = ({
  page,
  totalPages,
  hasNextPage,
  hasPreviousPage,
  isFetching,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) => {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav
      className="flex flex-col gap-3 border-t border-white/10 bg-[#151518] px-3 py-4 text-sm text-violet-100/70 sm:flex-row sm:items-center sm:justify-between sm:px-5"
      aria-label="Paginacion de noticias"
    >
      <p aria-live="polite">
        Pagina {page} de {totalPages}
        {isFetching ? " - Actualizando..." : ""}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
        <button
          type="button"
          className={paginationButtonClassName}
          disabled={!hasPreviousPage || isFetching}
          onClick={() => onPageChange(page - 1)}
        >
          <FiChevronLeft className="size-4" aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          className={paginationButtonClassName}
          disabled={!hasNextPage || isFetching}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
          <FiChevronRight className="size-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};

const DashboardNewsList = () => {
  const [filters, setFilters] = useState(defaultDashboardNewsListFilters);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const canCreateNews = useDashboardPermission("news", "create");
  const canEditNews = useDashboardPermission("news", "edit");
  const canDeleteNews = useDashboardPermission("news", "delete");
  const search = filters.search.trim();
  const newsQuery = useQuery(
    dashboardNewsPageQueryOptions({
      page,
      limit: DASHBOARD_NEWS_PAGE_LIMIT,
      sortBy: "date",
      direction: "desc",
      search: search || null,
      status: filters.status,
    })
  );
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardNews,
    onSuccess: async () => {
      await invalidateDashboardNewsPublishDependencies(queryClient);
    },
  });

  const pageData = newsQuery.data;
  const totalPages = pageData?.totalPages ?? 1;

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleSearchChange = (nextSearch: string) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      search: nextSearch.slice(0, DASHBOARD_NEWS_SEARCH_MAX_LENGTH),
    }));
  };

  const handleStatusChange = (status: typeof filters.status) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      status,
    }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(defaultDashboardNewsListFilters());
  };

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

  const pageNews = pageData?.items ?? EMPTY_DASHBOARD_NEWS;
  const news = pageNews;
  const totalNews = pageData?.total ?? 0;
  const totalPageNews = pageNews.length;
  const hasActiveFilters = hasActiveDashboardNewsListFilters(filters);
  const countLabel = `${totalNews} noticias`;
  const hasRowActions = canEditNews || canDeleteNews;
  const hasInitialData = Boolean(pageData);
  const hasEmptyDataset = totalNews === 0 && !hasActiveFilters;

  if (newsQuery.isLoading && !hasInitialData) {
    return <DashboardLoadingState />;
  }

  if (newsQuery.isError && !hasInitialData) {
    return (
      <DashboardErrorState
        title="No pudimos cargar las noticias"
        message="No se pudo cargar la pagina. Reintenta en unos segundos."
        onRetry={() => void newsQuery.refetch()}
      />
    );
  }

  return (
    <div>
      <DashboardPageHeader
        eyebrow="Contenido"
        title="Noticias"
        countLabel={countLabel}
        description="Administra publicaciones y borradores del sitio."
        actions={
          canCreateNews ? (
            <PermissionActionButton
              resource="news"
              action="create"
              to={ROUTES.DASHBOARD_NEWS_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              ariaLabel="Crear noticia"
              title="Crear noticia"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </PermissionActionButton>
          ) : null
        }
      />

      {hasEmptyDataset ? (
        <DashboardEmptyState message="Todavia no hay noticias ni borradores cargados." />
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-news-search"
            searchLabel="Buscar noticias"
            searchPlaceholder="Titulo, descripcion o slug..."
            searchValue={filters.search}
            onSearchChange={handleSearchChange}
            selects={[
              {
                id: "dashboard-news-status",
                label: "Estado",
                value: filters.status,
                onChange: (status) =>
                  handleStatusChange(status as typeof filters.status),
                options: DASHBOARD_STATUS_FILTER_OPTIONS,
              },
            ]}
            showClear={hasActiveFilters}
            onClear={clearFilters}
            filteredCount={news.length}
            totalCount={totalPageNews}
          />

          {news.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={clearFilters}
            />
          ) : (
        <div className="p-3 sm:p-5">
          <DashboardTable
            mobile={
              <>
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
                          <PermissionActionButton
                            resource="news"
                            action="edit"
                            to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            ariaLabel="Editar noticia"
                            title="Editar noticia"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </PermissionActionButton>
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
              </>
            }
          >

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
                          <PermissionActionButton
                            resource="news"
                            action="edit"
                            to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                            className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                            ariaLabel="Editar noticia"
                            title="Editar noticia"
                          >
                            <FiEdit2 className="size-4" aria-hidden="true" />
                          </PermissionActionButton>
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
          </DashboardTable>
        </div>
          )}
          <DashboardNewsPagination
            page={page}
            totalPages={totalPages}
            hasNextPage={Boolean(pageData?.hasNextPage)}
            hasPreviousPage={Boolean(pageData?.hasPreviousPage)}
            isFetching={newsQuery.isFetching}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default DashboardNewsList;
