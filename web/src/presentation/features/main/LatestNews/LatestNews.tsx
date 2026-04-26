// @ts-nocheck
import { lazy, Suspense } from "react";

import Carousel from "./Carousel/Carousel";
import { splitNews } from "./latestNews.utils";

const MoreNews = lazy(() => import("./MoreNews"));

const LatestNews = ({ news = [] }) => {
  if (!news.length) return null;

  const { carouselNews, otherNews } = splitNews(news);

  return (
    <section className="bg-violet-900 text-violet-50">
      {/* Carousel */}
      <div className="pt-2 px-0 sm:px-2">
        <Carousel items={carouselNews} />
      </div>

      <Suspense fallback={<div className="min-h-80" aria-hidden="true" />}>
        <MoreNews news={otherNews} />
      </Suspense>
    </section>
  );
};

export default LatestNews;
