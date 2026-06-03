import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiImage,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";

import { deleteDashboardGallery } from "../../../data/dashboardGalleries";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import { reportError } from "../../../lib/errors/errorLogger";
import { ROUTES } from "../../../shared/routing";
import type { DashboardGalleryItem } from "../../../types/dashboard";
import { confirmDashboardAction } from "../../app/confirmDialog";
import ErrorFallback from "../../components/errors/ErrorFallback";
import DashboardContentLoader from "../../dashboard/DashboardContentLoader";
import DashboardListFilteredEmpty from "../../dashboard/DashboardListFilteredEmpty";
import DashboardListFilters from "../../dashboard/DashboardListFilters";
import { useDashboardPermission } from "../../hooks/usePermission";
import { DASHBOARD_STATUS_FILTER_OPTIONS } from "../../dashboard/dashboardListFilters.utils";
import { formatDateTime } from "../../utils/date.utils";
import {
  defaultDashboardGalleriesListFilters,
  hasActiveDashboardGalleriesListFilters,
} from "./dashboardGalleriesList.filters";
import {
  dashboardGalleriesPageQueryOptions,
  invalidateDashboardGalleryPublishDependencies,
} from "./dashboardGalleries.queries";
import { getDashboardGalleryTitle } from "./dashboardGalleries.utils";

const DASHBOARD_GALLERIES_PAGE_LIMIT = 20;
const DASHBOARD_GALLERIES_SEARCH_MAX_LENGTH = 80;
const EMPTY_DASHBOARD_GALLERIES: DashboardGalleryItem[] = [];

const GalleryThumbnail = ({ item }: { item: DashboardGalleryItem }) => {
  const heroPhoto = item.photos.find((photo) => photo.isHero) ?? item.photos[0];
  const imageUrl = getImageUrl(heroPhoto?.imageUrl, {
    width: 160,
    height: 112,
    fit: "crop",
    quality: 72,
  });
  const imageSrcSet = getImageSrcSet(heroPhoto?.imageUrl, [96, 160, 240], {
    height: (width) => Math.round(width * 0.7),
    fit: "crop",
    quality: 72,
  });

  if (!imageUrl) {
    return (
      <div
        aria-label="Galeria sin foto"
        className="flex h-16 w-20 shrink-0 items-center justify-center rounded-[3px] border border-white/10 bg-violet-400/10 text-violet-100/55"
      >
        <FiImage className="size-5" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      srcSet={imageSrcSet || undefined}
      sizes="80px"
      alt={heroPhoto?.alt || `Hero de ${getDashboardGalleryTitle(item)}`}
      loading="lazy"
      decoding="async"
      className="h-16 w-20 shrink-0 rounded-[3px] border border-white/10 object-cover"
    />
  );
};

const getGalleryDateLabel = (item: DashboardGalleryItem): string => {
  if (item.gameDate) {
    return formatDateTime(item.gameDate);
  }

  if (item.updatedAt) {
    return `Borrador guardado ${formatDateTime(item.updatedAt)}`;
  }

  return "Sin fecha";
};

const GalleryStatusBadge = ({ item }: { item: DashboardGalleryItem }) => {
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

const DeleteGalleryButton = ({
  item,
  isDeleting,
  onDelete,
}: {
  item: DashboardGalleryItem;
  isDeleting: boolean;
  onDelete: (id: string) => void | Promise<void>;
}) => (
  <button
    type="button"
    className={`${actionButtonClassName} border-red-300/20 text-red-100 hover:border-red-200/45 hover:bg-red-400/10`}
    disabled={isDeleting}
    aria-label="Borrar galeria"
    title="Borrar galeria"
    onClick={() => {
      void (async () => {
        const confirmed = await confirmDashboardAction({
          title: "Borrar galeria",
          text: `Vas a eliminar "${getDashboardGalleryTitle(item)}" y sus fotos de Sanity. Esta accion no se puede deshacer.`,
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

const paginationButtonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[3px] border border-white/10 bg-white/[0.035] px-3 py-2.5 text-sm font-medium text-violet-100/80 transition hover:border-violet-200/35 hover:bg-white/8 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 disabled:cursor-not-allowed disabled:opacity-45";

const DashboardGalleriesPagination = ({
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
      aria-label="Paginacion de galerias"
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

const DashboardGalleriesList = () => {
  const [filters, setFilters] = useState(defaultDashboardGalleriesListFilters);
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const canCreateGallery = useDashboardPermission("galleries", "create");
  const canEditGallery = useDashboardPermission("galleries", "edit");
  const canDeleteGallery = useDashboardPermission("galleries", "delete");
  const search = filters.search.trim();
  const galleriesQuery = useQuery(
    dashboardGalleriesPageQueryOptions({
      page,
      limit: DASHBOARD_GALLERIES_PAGE_LIMIT,
      sortBy: "date",
      direction: "desc",
      search: search || null,
      status: filters.status,
      photos: filters.photos,
    })
  );
  const deleteMutation = useMutation({
    mutationFn: deleteDashboardGallery,
    onSuccess: () => invalidateDashboardGalleryPublishDependencies(queryClient),
  });
  const pageData = galleriesQuery.data;
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
      search: nextSearch.slice(0, DASHBOARD_GALLERIES_SEARCH_MAX_LENGTH),
    }));
  };

  const handleStatusChange = (status: typeof filters.status) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      status,
    }));
  };

  const handlePhotosChange = (photos: typeof filters.photos) => {
    setPage(1);
    setFilters((current) => ({
      ...current,
      photos,
    }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(defaultDashboardGalleriesListFilters());
  };

  const handleDeleteGallery = async (itemId: string) => {
    try {
      await toast.promise(
        deleteMutation.mutateAsync(itemId),
        {
          loading: "Eliminando galeria de Sanity...",
          success: "Galeria eliminada correctamente.",
          error: (error) =>
            error instanceof Error
              ? error.message
              : "No pudimos borrar la galeria.",
        },
        deleteToastOptions
      );
    } catch (error) {
      reportError(error, {
        page: "DashboardGalleriesList",
        action: "delete_gallery",
        id: itemId,
      });
    }
  };

  const pageGalleries = pageData?.items ?? EMPTY_DASHBOARD_GALLERIES;
  const galleries = pageGalleries;
  const totalGalleries = pageData?.total ?? 0;
  const totalPageGalleries = pageGalleries.length;
  const hasActiveFilters = hasActiveDashboardGalleriesListFilters(filters);
  const countLabel = `${totalGalleries} galerias`;
  const hasRowActions = canEditGallery || canDeleteGallery;
  const hasInitialData = Boolean(pageData);
  const hasEmptyDataset = totalGalleries === 0 && !hasActiveFilters;

  if (galleriesQuery.isLoading && !hasInitialData) {
    return <DashboardContentLoader />;
  }

  if (galleriesQuery.isError && !hasInitialData) {
    return (
      <ErrorFallback
        title="No pudimos cargar las galerias"
        message="Intenta nuevamente en unos minutos."
        onRetry={() => void galleriesQuery.refetch()}
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
              <h2 className="text-3xl font-black text-white">Galerias</h2>
              <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-2.5 py-1.5 text-xs font-medium text-violet-100/70">
                {countLabel}
              </span>
            </div>
            <p className="mt-2 text-sm text-violet-100/65">
              Administra albumes de partidos finalizados, fotos y heroes.
            </p>
          </div>

          {canCreateGallery ? (
            <Link
              to={ROUTES.DASHBOARD_GALLERIES_NEW}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
              aria-label="Crear galeria"
              title="Crear galeria"
            >
              <FiPlus className="size-5" aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      </header>

      {hasEmptyDataset ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavia no hay galerias ni borradores cargados.
        </div>
      ) : (
        <>
          <DashboardListFilters
            searchId="dashboard-galleries-search"
            searchLabel="Buscar galerias"
            searchPlaceholder="Rival, torneo, slug o cantidad de fotos..."
            searchValue={filters.search}
            onSearchChange={handleSearchChange}
            selects={[
              {
                id: "dashboard-galleries-status",
                label: "Estado",
                value: filters.status,
                onChange: (status) =>
                  handleStatusChange(status as typeof filters.status),
                options: DASHBOARD_STATUS_FILTER_OPTIONS,
              },
              {
                id: "dashboard-galleries-photos",
                label: "Fotos",
                value: filters.photos,
                onChange: (photos) =>
                  handlePhotosChange(photos as typeof filters.photos),
                options: [
                  { value: "all", label: "Todas" },
                  { value: "with_photos", label: "Con fotos" },
                  { value: "empty", label: "Sin fotos" },
                ],
              },
            ]}
            showClear={hasActiveFilters}
            onClear={clearFilters}
            filteredCount={galleries.length}
            totalCount={totalPageGalleries}
          />

          {galleries.length === 0 ? (
            <DashboardListFilteredEmpty
              onClear={clearFilters}
            />
          ) : (
            <div className="p-3 sm:p-5">
              <div className="overflow-hidden rounded-sm border border-white/10 bg-[#16161a]">
                <div className="divide-y divide-white/8 lg:hidden">
                  {galleries.map((item) => (
                    <article
                      key={item.id}
                      className="p-3 text-sm text-violet-50 sm:p-4"
                    >
                      <div className="mb-3 flex min-w-0 items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-violet-100/50">
                          {getGalleryDateLabel(item)}
                        </p>
                        <p className="shrink-0 text-[0.58rem] font-semibold uppercase tracking-widest text-violet-100/45">
                          {item.photoCount} fotos
                        </p>
                      </div>

                      <div className="grid min-w-0 grid-cols-[5rem_minmax(0,1fr)] items-center gap-3">
                        <GalleryThumbnail item={item} />
                        <div className="min-w-0">
                          <h3 className="line-clamp-2 text-base font-black uppercase leading-tight text-white">
                            {getDashboardGalleryTitle(item)}
                          </h3>
                          <p className="mt-1 truncate text-xs text-violet-100/55">
                            {item.slug || "Sin slug"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/8 pt-3">
                        <GalleryStatusBadge item={item} />
                        {hasRowActions ? (
                          <div className="flex gap-2">
                            {canEditGallery ? (
                              <Link
                                to={ROUTES.DASHBOARD_GALLERIES_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar galeria"
                                title="Editar galeria"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteGallery ? (
                              <DeleteGalleryButton
                                item={item}
                                isDeleting={deleteMutation.isPending}
                                onDelete={handleDeleteGallery}
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
                      <th className="px-5 py-4">Galeria</th>
                      <th className="px-5 py-4">Fecha</th>
                      <th className="px-5 py-4">Fotos</th>
                      <th className="px-5 py-4">Estado</th>
                      <th className="px-5 py-4 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {galleries.map((item) => (
                      <tr
                        key={item.id}
                        className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/4"
                      >
                        <td className="max-w-sm px-5 py-4">
                          <div className="flex items-center gap-3">
                            <GalleryThumbnail item={item} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {getDashboardGalleryTitle(item)}
                              </p>
                              <p className="truncate text-xs text-violet-100/55">
                                {item.slug || "Sin slug"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {getGalleryDateLabel(item)}
                        </td>
                        <td className="px-5 py-4 text-violet-100/70">
                          {item.photoCount}
                        </td>
                        <td className="px-5 py-4">
                          <GalleryStatusBadge item={item} />
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {canEditGallery ? (
                              <Link
                                to={ROUTES.DASHBOARD_GALLERIES_EDIT(item.id)}
                                className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                                aria-label="Editar galeria"
                                title="Editar galeria"
                              >
                                <FiEdit2 className="size-4" aria-hidden="true" />
                              </Link>
                            ) : null}
                            {canDeleteGallery ? (
                              <DeleteGalleryButton
                                item={item}
                                isDeleting={deleteMutation.isPending}
                                onDelete={handleDeleteGallery}
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
          <DashboardGalleriesPagination
            page={page}
            totalPages={totalPages}
            hasNextPage={Boolean(pageData?.hasNextPage)}
            hasPreviousPage={Boolean(pageData?.hasPreviousPage)}
            isFetching={galleriesQuery.isFetching}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
};

export default DashboardGalleriesList;
