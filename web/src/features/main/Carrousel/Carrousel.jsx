import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../../../components/Button/Button";
import "./Carrousel.css";

const Carrousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!items || items.length === 0) return;

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [items]);

  return (
    <section className="relative w-full h-[90vh] overflow-hidden -mb-[2px]">
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

          <div
            className="absolute inset-0 flex items-end bg-gradient-to-t
        from-violet-900
        via-black/40
        to-transparent
      "
          >
            <div className="p-12 max-w-6xl">
              <h2 className="text-5xl font-black uppercase leading-tight mb-4">
                {item.title}
              </h2>

              <p className="text-lg max-w-2xl opacity-90">{item.description}</p>

              <Link to={`/noticias/${item.slug.current}`}>
                <Button
                  variant="gradient"
                  className="mt-6 shadow-violet-900/40"
                >
                  Leer más
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Carrousel;
