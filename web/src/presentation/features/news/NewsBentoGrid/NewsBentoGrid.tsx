import { Suspense } from "react";
import NewsCard from "../../../components/NewsCard/NewsCard";
import { lazyWithReload } from "../../../../lib/lazyWithReload";
import { mapBentoItems } from "./newsBentoGrid.utils";
import type { NewsItem } from "../../../../types/models";

const CompactCarousel = lazyWithReload(
  () => import("../CompactCarousel/CompactCarousel")
);

type NewsBentoGridProps = {
  items?: NewsItem[];
};

const NewsBentoGrid = ({ items = [] }: NewsBentoGridProps) => {
  if (!items.length) return null;

  const { hero, featuredBox, featuredWide, compact } = mapBentoItems(items);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* MOBILE */}
      <div className="flex flex-col gap-4 md:hidden">
        {hero && (
          <NewsCard
            item={hero}
            variant="hero"
            imageLoading="eager"
            imagePriority
          />
        )}

        {featuredBox && (
          <NewsCard item={featuredBox} variant="featuredBox" imageLoading="lazy" />
        )}

        {featuredWide && (
          <NewsCard item={featuredWide} variant="featuredWide" imageLoading="lazy" />
        )}

        {compact.length > 0 && (
          <Suspense
            fallback={
              <div
                className="h-40 w-full animate-pulse rounded-xl bg-white/5"
                aria-label="Cargando carrusel de noticias"
              />
            }
          >
            <CompactCarousel items={compact} />
          </Suspense>
        )}
      </div>

      {/* DESKTOP */}
      <div className="hidden md:grid md:grid-cols-2 md:auto-rows-[120px] md:gap-4 lg:grid-cols-3">
        <div className="md:col-span-2 md:row-span-4 lg:col-span-3">
          {hero && (
            <NewsCard
              item={hero}
              variant="hero"
              imageLoading="eager"
              imagePriority
            />
          )}
        </div>

        <div className="md:col-span-1 md:row-span-3">
          {featuredBox && (
            <NewsCard
              item={featuredBox}
              variant="featuredBox"
              imageLoading="eager"
              imagePriority
            />
          )}
        </div>

        <div className="md:col-span-1 md:row-span-3 lg:col-span-2">
          {featuredWide && (
            <NewsCard
              item={featuredWide}
              variant="featuredWide"
              imageLoading="eager"
              imagePriority
            />
          )}
        </div>

        {compact.map((item) => (
          <div key={item.id} className="md:col-span-1 md:row-span-2">
            <NewsCard item={item} variant="compact" imageLoading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsBentoGrid;
