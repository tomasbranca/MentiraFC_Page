import { Suspense } from "react";
import NewsBentoGrid from "../../features/news/NewsBentoGrid/NewsBentoGrid";
import Loader from "../../components/Loader/Loader";
import ErrorFallback from "../../components/errors/ErrorFallback";
import { lazyWithReload } from "../../../lib/lazyWithReload";

import { useNewsData } from "./hooks/useNewsData";
import { splitNewsForPage } from "./newsPage.utils";

const NewsList = lazyWithReload(
  () => import("../../features/news/NewsList/NewsList")
);

const News = () => {
  const { news, loading, error, refetch } = useNewsData();

  if (loading) return <Loader />;
  if (error) {
    return (
      <ErrorFallback
        title="No se pudieron cargar las noticias"
        message="Intentá nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  const { featured, list } = splitNewsForPage(news);

  return (
    <main className="news-page">
      {/* HERO */}
      <section className="bento-wrapper bg-neutral-900 shadow-lg shadow-black/30 pt-8 pb-16 md:pt-10 md:pb-20 lg:pt-12 lg:pb-24">
        <div className="background"></div>

        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <NewsBentoGrid items={featured} />
        </div>
      </section>

      {/* LISTA */}
      <section className="border-t border-violet-700 py-10 md:py-14 lg:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <Suspense
            fallback={
              <div
                className="h-24 w-full animate-pulse rounded-xl bg-white/5"
                aria-label="Cargando listado de noticias"
              />
            }
          >
            <NewsList items={list} />
          </Suspense>
        </div>
      </section>
    </main>
  );
};

export default News;
