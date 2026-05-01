import { Suspense } from "react";
import { lazyWithReload } from "../../../../lib/lazyWithReload";
import { MoreNewsSkeleton } from "../../../components/Skeletons/SectionSkeletons";

import Carousel from "./Carousel/Carousel";
import { splitNews } from "./latestNews.utils";
import type { NewsItem } from "../../../../types/models";

const MoreNews = lazyWithReload(() => import("./MoreNews"));

type LatestNewsProps = {
  news?: NewsItem[];
};

const LatestNews = ({ news = [] }: LatestNewsProps) => {
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
