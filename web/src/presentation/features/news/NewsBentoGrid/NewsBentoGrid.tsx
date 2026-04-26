// @ts-nocheck
import { lazy, Suspense } from "react";
import NewsCard from "../../../components/NewsCard/NewsCard";
import { mapBentoItems } from "./newsBentoGrid.utils";

const CompactCarousel = lazy(() => import("../CompactCarousel/CompactCarousel"));

const NewsBentoGrid = ({ items = [] }) => {
  if (!items.length) return null;

  const { hero, featuredBox, featuredWide, compact } = mapBentoItems(items);

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* MOBILE */}
      <div className="flex flex-col gap-4 md:hidden">
        {hero && <NewsCard item={hero} variant="hero" />}

        {featuredBox && <NewsCard item={featuredBox} variant="featuredBox" />}

        {featuredWide && (
          <NewsCard item={featuredWide} variant="featuredWide" />
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
      <div className="hidden md:grid md:grid-cols-3 md:auto-rows-[120px] md:gap-4">
        <div className="md:col-span-3 md:row-span-4">
          {hero && <NewsCard item={hero} variant="hero" />}
        </div>

        <div className="md:col-span-1 md:row-span-3">
          {featuredBox && <NewsCard item={featuredBox} variant="featuredBox" />}
        </div>

        <div className="md:col-span-2 md:row-span-3">
          {featuredWide && (
            <NewsCard item={featuredWide} variant="featuredWide" />
          )}
        </div>

        {compact.map((item) => (
          <div key={item.id} className="md:col-span-1 md:row-span-2">
            <NewsCard item={item} variant="compact" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NewsBentoGrid;
