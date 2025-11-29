import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Carrousel.css";

const Carrousel = ({ items }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [items]);

  return (
    <section className="relative w-full h-[90vh] overflow-hidden">
      {items.map((item, index) => (
        <div
          key={item._id}
          className={`carousel-slide ${index === activeIndex ? "active" : ""}`}
        >
          <img
            src={item.imageUrl}
            alt={item.title}
            className="w-full h-[90vh] object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-900 to-transparent p-6">
            <h1 className="text-6xl font-extrabold mb-2">
              {item.title}
            </h1>

            <p className="text-xl mb-4">{item.description}</p>

            <Link
              to={`/noticias/${item._id}`}
              className="underline text-sm hover:opacity-80"
            >
              Leer más
            </Link>
          </div>
        </div>
      ))}
    </section>
  );
};

export default Carrousel;
