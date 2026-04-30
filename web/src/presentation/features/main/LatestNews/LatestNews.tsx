// @ts-nocheck
import { Suspense } from "react";
import { lazyWithReload } from "../../../../lib/lazyWithReload";
import { MoreNewsSkeleton } from "../../../components/Skeletons/SectionSkeletons";

import Carousel from "./Carousel/Carousel";
import { splitNews } from "./latestNews.utils";

const MoreNews = lazyWithReload(() => import("./MoreNews"));

const LatestNews = ({ news = [] }) => {
  if (!news.length) return null;

  const { carouselNews, otherNews } = splitNews(news);

  return (
    <section className="bg-violet-900 text-violet-50">
      {/* Carousel */}
      <div className="pt-2 px-0 sm:px-2">
        <Carousel items={carouselNews} />
      </div>

      <Suspense fallback={<MoreNewsSkeleton />}>
        <MoreNews news={otherNews} />
      </Suspense>
    </section>
  );
};

export default LatestNews;
