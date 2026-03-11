import { useRef, useState } from "react";
import NewsCard from "../../../components/NewsCard/NewsCard";

const CompactCarousel = ({ items }) => {
  const scrollRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollLeft = container.scrollLeft;
    const card = container.querySelector("[data-carousel-item]");
    const width = card?.offsetWidth || container.offsetWidth;

    const index = Math.round(scrollLeft / width);
    setActiveIndex(index);
  };

  return (
    <div className="w-full">
      {/* Carrusel */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="
        flex
        gap-4
        overflow-x-auto
        scroll-smooth
        snap-x snap-mandatory
        pb-4 px-1
        no-scrollbar
      "
      >
        {items.map((item) => (
          <div
          data-carousel-item
          key={item._id}
          className="
            snap-start
            shrink-0
            w-[85%]
            h-[160px]
          "
        >
            <NewsCard item={item} variant="compact" />
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 mt-2">
        {items.map((_, i) => (
          <div
            key={i}
            className={`
              h-2 w-2 rounded-full transition-all
              ${i === activeIndex ? "bg-violet-600 w-4" : "bg-gray-400"}
            `}
          />
        ))}
      </div>
    </div>
  );
};

export default CompactCarousel;
