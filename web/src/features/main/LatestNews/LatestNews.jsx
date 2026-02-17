import Carrousel from "../Carrousel/Carrousel";
import NewsCardHome from "../../../components/NewsCardHome/NewsCardHome";
import { Link } from "react-router-dom";

const LatestNews = ({ news }) => {
  const carouselNews = news.slice(0, 3);
  const otherNews = news.slice(3, 6);

  return (
    <section className="bg-violet-900 text-violet-50">
      {/* Carousel */}
      <div className="pt-2 px-0 sm:px-2">
        <Carrousel items={carouselNews} />
      </div>

      {/* Header */}
      <div className="mt-10 mb-6 px-6 pt-6 border-t border-violet-700/60">
        <div className="flex justify-center sm:justify-between items-center">
          <h3 className="font-extrabold uppercase tracking-widest">
            Más noticias
          </h3>

          <Link
            to="/noticias"
            className="hidden sm:block font-semibold underline underline-offset-4 hover:opacity-80 transition"
          >
            Ver todas
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div
        className="
          grid gap-6 px-6 pb-14
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
        "
      >
        {otherNews.map((item, index) => (
          <NewsCardHome key={item._id} item={item} featured={index === 0} />
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
