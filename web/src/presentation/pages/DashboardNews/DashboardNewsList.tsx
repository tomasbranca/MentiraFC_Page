import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ROUTES } from "../../../shared/routing";
import { formatDateTime } from "../../utils/date.utils";

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
      alt={item.imageAlt || `Portada de ${item.title}`}
      loading="lazy"
      decoding="async"
      className="h-16 w-20 shrink-0 rounded-[3px] border border-white/10 object-cover"
    />
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
  const queryClient = useQueryClient();
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

  const news = newsQuery.data ?? [];

  return (
    <div>
      <header className="border-b border-white/10 bg-[#151518] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-violet-200/80">
              Contenido
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">Noticias</h2>
            <p className="mt-2 text-sm text-violet-100/65">
              Administrá las publicaciones visibles del sitio.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_NEWS_NEW}
            className="inline-flex h-11 w-11 items-center justify-center rounded-[3px] border border-violet-200/30 bg-violet-100 text-violet-950 transition hover:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            aria-label="Crear noticia"
            title="Crear noticia"
          >
            <FiPlus className="size-5" aria-hidden="true" />
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <span className="rounded-[3px] border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-violet-100/70">
            {news.length} noticias
          </span>
        </div>
      </header>

      {news.length === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavía no hay noticias cargadas.
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-[4px] border border-white/10 bg-[#16161a]">
            <div className="divide-y divide-white/8 md:hidden">
              {news.map((item) => (
                <article key={item.id} className="p-4 text-sm text-violet-50">
                  <div className="flex min-w-0 gap-3">
                    <NewsThumbnail item={item} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-violet-100/45">
                        {formatDateTime(item.date)}
                      </p>
                      <h3 className="mt-1 line-clamp-2 text-sm font-black uppercase leading-snug text-white">
                        {item.title}
                      </h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-snug text-violet-100/60">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                      Publicada
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                        className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                        aria-label="Editar noticia"
                        title="Editar noticia"
                      >
                        <FiEdit2 className="size-4" aria-hidden="true" />
                      </Link>
                      <DeleteNewsButton
                        itemId={item.id}
                        itemTitle={item.title}
                        isDeleting={deleteMutation.isPending}
                        onDelete={handleDeleteNews}
                      />
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <table className="hidden w-full border-collapse text-left md:table">
              <thead className="bg-white/[0.025] text-xs uppercase tracking-[0.16em] text-violet-100/60">
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
                    className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/[0.04]"
                  >
                    <td className="max-w-sm px-5 py-4">
                      <div className="flex items-center gap-3">
                        <NewsThumbnail item={item} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {item.title}
                          </p>
                          <p className="truncate text-xs text-violet-100/55">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-violet-100/70">
                      {formatDateTime(item.date)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-[3px] border border-emerald-300/15 bg-emerald-300/10 px-2.5 py-1 text-xs font-medium text-emerald-100">
                        Publicada
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                          className={`${actionButtonClassName} border-violet-200/20 bg-violet-300/10 hover:border-violet-200/45 hover:bg-violet-300/16`}
                          aria-label="Editar noticia"
                          title="Editar noticia"
                        >
                          <FiEdit2 className="size-4" aria-hidden="true" />
                        </Link>
                        <DeleteNewsButton
                          itemId={item.id}
                          itemTitle={item.title}
                          isDeleting={deleteMutation.isPending}
                          onDelete={handleDeleteNews}
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

export default DashboardNewsList;
