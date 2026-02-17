import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import "./Carrousel.css";

const Carrousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [manual, setManual] = useState(false);

  // Autoplay SOLO desktop
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");

    const update = (e) => {
      setAutoplay(e.matches);
      setManual(!e.matches);
    };

    update(mq);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!autoplay || !items?.length) return;

    const interval = setInterval(() => {
      setActiveIndex((p) => (p + 1) % items.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [autoplay, items]);

  if (!items || items.length === 0) return null;

  const prev = () =>
    setActiveIndex((p) => (p - 1 + items.length) % items.length);

  const next = () => setActiveIndex((p) => (p + 1) % items.length);

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
            <div
              className="
                w-full overflow-hidden
                px-4 pb-4
                sm:px-6 sm:pb-5
                lg:px-10 lg:pb-10
              "
            >
              <div className="max-w-3xl">
                <h2
                  className="
                    font-black uppercase text-white
                    break-words
                  "
                >
                  {item.title}
                </h2>

                <p
                  className="
                    mt-2 text-white/90

                    /* Mobile */
                    leading-snug
                    line-clamp-2

                    /* Tablet */
                    sm:leading-snug
                    sm:line-clamp-3

                    /* Desktop */
                    lg:mt-3
                    lg:line-clamp-none
                    max-w-2xl
                  "
                >
                  {item.description}
                </p>

                <Link to={`/noticias/${item.slug.current}`}>
                  <Button
                    variant="gradient"
                    className="
                      mt-2

                      /* Mobile */
                      px-1
                      h-
                      rounded

                      /* Tablet */
                      sm:mt-3
                      sm:px-3 sm:py-1.5
                      sm:rounded-md

                      /* Desktop */
                      md:px-5 md:py-3
                      md:rounded-lg
                    "
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

export default Carrousel;
