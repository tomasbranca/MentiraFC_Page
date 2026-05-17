import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import {
  deleteDashboardNews,
  fetchDashboardNews,
} from "../../../data/dashboardNews";
import { queryKeys } from "../../../data/queryKeys";
import { reportError } from "../../../lib/errors/errorLogger";
import Button from "../../components/Button/Button";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import { ROUTES } from "../../constants/routes.constants";
import { formatDateTime } from "../../utils/date.utils";

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
      <header className="border-b border-white/10 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-violet-200">
              Contenido
            </p>
            <h2 className="mt-3 text-3xl font-black text-white">Noticias</h2>
            <p className="mt-2 text-sm text-violet-100/70">
              Administrá las publicaciones visibles del sitio.
            </p>
          </div>

          <Link
            to={ROUTES.DASHBOARD_NEWS_NEW}
            className="inline-flex items-center justify-center rounded-full border border-violet-200/20 bg-violet-100 px-5 py-3 text-sm font-semibold text-violet-950 transition hover:bg-white"
          >
            Nueva noticia
          </Link>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-violet-100/70">
            <span aria-hidden="true">⌕</span>
            <span>Buscador disponible próximamente</span>
          </label>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-violet-100/70">
              {news.length} noticias
            </span>
            <span className="rounded-full border border-violet-300/15 bg-violet-400/10 px-3 py-2 text-xs font-medium text-violet-100">
              Vista lista
            </span>
          </div>
        </div>
      </header>

      {news.length === 0 ? (
        <div className="p-6 text-sm text-violet-100/75">
          Todavía no hay noticias cargadas.
        </div>
      ) : (
        <div className="p-4 sm:p-5">
          <div className="overflow-hidden rounded-[1.2rem] border border-white/10 bg-white/[0.025]">
          <table className="w-full min-w-[46rem] border-collapse text-left">
            <thead className="bg-white/[0.03] text-xs uppercase tracking-[0.18em] text-violet-100/65">
              <tr>
                <th className="px-5 py-4">Noticia</th>
                <th className="px-5 py-4">Fecha</th>
                <th className="px-5 py-4">Estado</th>
                <th className="px-5 py-4">Slug</th>
                <th className="px-5 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr
                  key={item.id}
                  className="border-t border-white/8 text-sm text-violet-50 transition hover:bg-white/[0.045]"
                >
                  <td className="max-w-sm px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 shrink-0 rounded-2xl border border-white/10 bg-violet-400/10" />
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
                    <span className="inline-flex rounded-full bg-emerald-300/12 px-3 py-1 text-xs font-medium text-emerald-100">
                      Publicada
                    </span>
                  </td>
                  <td className="px-5 py-4 text-violet-100/65">
                    {item.slug}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={ROUTES.DASHBOARD_NEWS_EDIT(item.id)}
                        className="rounded-full border border-violet-200/20 bg-violet-300/10 px-3 py-2 text-xs font-semibold text-white transition hover:border-violet-200/45 hover:bg-violet-300/16"
                      >
                        Editar
                      </Link>
                      <Button
                        type="button"
                        variant="ghostStrong"
                        className="rounded-full px-3 py-2 text-xs"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Esta noticia se eliminará de forma definitiva. ¿Querés continuar?"
                            )
                          ) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        Borrar
                      </Button>
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
