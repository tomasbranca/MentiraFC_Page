import NewsCard from "../../../components/NewsCard/NewsCard";
import CompactCarousel from "../CompactCarrousel/CompactCarrousel";

const NewsBentoGrid = ({ items }) => {
  return (
    <div className="max-w-7xl mx-auto px-4">

      {/* MOBILE LAYOUT */}
      <div className="flex flex-col gap-4 md:hidden">

        {items[0] && <NewsCard item={items[0]} variant="hero" />}

        {items[1] && <NewsCard item={items[1]} variant="featuredBox" />}

        {items[2] && <NewsCard item={items[2]} variant="featuredWide" />}

        {items.slice(3,6).length > 0 && (
          <CompactCarousel items={items.slice(3,6)} />
        )}

      </div>


      {/* DESKTOP LAYOUT */}
      <div className="hidden md:grid md:grid-cols-3 md:auto-rows-[120px] md:gap-4">

        <div className="md:col-span-3 md:row-span-4">
          {items[0] && <NewsCard item={items[0]} variant="hero" />}
        </div>

        <div className="md:col-span-1 md:row-span-3">
          {items[1] && <NewsCard item={items[1]} variant="featuredBox" />}
        </div>

        <div className="md:col-span-2 md:row-span-3">
          {items[2] && <NewsCard item={items[2]} variant="featuredWide" />}
        </div>

        <div className="md:col-span-1 md:row-span-2">
          {items[3] && <NewsCard item={items[3]} variant="compact" />}
        </div>

        <div className="md:col-span-1 md:row-span-2">
          {items[4] && <NewsCard item={items[4]} variant="compact" />}
        </div>

        <div className="md:col-span-1 md:row-span-2">
          {items[5] && <NewsCard item={items[5]} variant="compact" />}
        </div>

      </div>

    </div>
  );
};

export default NewsBentoGrid;