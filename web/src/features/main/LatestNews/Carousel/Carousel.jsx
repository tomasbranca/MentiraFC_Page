import { useEffect } from "react";
import { Link } from "react-router-dom";
import Button from "../../../../components/Button/Button";
import "./Carousel.css";

import { useCarousel } from "../../../../hooks/useCarrousel";
import { useAutoplay } from "./hooks/useAutoPlay";
import { getNewsLink } from "../../../../utils/navigation.utils";

const Carousel = ({ items }) => {
  const { activeIndex, next, prev } = useCarousel(items?.length || 0);
  const { autoplay, manual } = useAutoplay();

  useEffect(() => {
    if (!autoplay || !items?.length) return;

    const interval = setInterval(() => {
      next();
    }, 4500);

    return () => clearInterval(interval);
  }, [autoplay, items, next]);

  if (!items || items.length === 0) return null;

  return (
    <section className="carousel-wrapper relative w-full overflow-hidden">
      {items.map((item, index) => (
        <div
          key={item._id}
          className={`carousel-slide ${index === activeIndex ? "active" : ""}`}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-violet-900 via-black/40 to-transparent">
            <div className="w-full overflow-hidden px-4 pb-4 sm:px-6 sm:pb-5 lg:px-10 lg:pb-10">
              <div className="max-w-3xl">
                <h2 className="font-black uppercase text-white break-words">
                  {item.title}
                </h2>

                <p className="mt-2 text-white/90 leading-snug line-clamp-2 sm:line-clamp-3 lg:mt-3 lg:line-clamp-none max-w-2xl">
                  {item.description}
                </p>

                <Link to={getNewsLink(item)}>
                  <Button
                    variant="primary"
                    className="
                      group
                      mt-2
                      px-3 py-2
                      rounded-md
                      sm:mt-3 sm:px-4 sm:py-2.5
                      md:px-5 md:py-3 md:rounded-lg
                    "
                    showArrow
                  >
                    Leer más
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {manual && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 text-white"
          >
            ‹
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 p-2 text-white"
          >
            ›
          </button>
        </>
      )}
    </section>
  );
};

export default Carousel;