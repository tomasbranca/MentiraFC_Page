import Carrousel from "../Carrousel/Carrousel";
import NewsCardHome from "../../../components/NewsCardHome/NewsCardHome";
import { Link } from "react-router-dom";

const LatestNews = ({ news }) => {
  const carouselNews = news.slice(0, 3);
  const otherNews = news.slice(3, 6);

  return (
    <section className="bg-violet-900 text-violet-50">
      <div className="px-2 pt-2">
        <Carrousel items={carouselNews} />
      </div>

      <div className="flex justify-between items-center mt-12 mb-6 px-6 pt-6 border-t border-violet-700/60">
        <h3 className="font-extrabold uppercase tracking-widest text-lg">
          Más noticias
        </h3>
        <Link
          to="/noticias"
          className="text-sm font-semibold underline underline-offset-4 hover:opacity-80 transition"
        >
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 pb-14 max-lg:grid-cols-2 max-sm:grid-cols-1">
        {otherNews.map((item) => (
          <NewsCardHome key={item._id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
