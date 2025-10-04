import Carrousel from "../Carrousel/Carrousel";
import NewsCardOverlay from "../NewsCardOverlay/NewsCardOverlay";
import { Link } from "react-router-dom";
import "./LatestNews.css";

const LatestNews = ({ news }) => {
  const sortedNews = [...news].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  const carouselNews = sortedNews.slice(0, 3);
  const otherNews = sortedNews.slice(3, 6);

  return (
    <section className="latest-news bg-violet-900 text-violet-50">
      <Carrousel items={carouselNews} />

      <div className="flex justify-between items-center mb-6 mt-10 px-6 py-6 border-t-4 border-violet-700">
        <h2 className="text-4xl font-bold uppercase">Más noticias</h2>
        <Link to="/noticias" className="underline text-sm hover:opacity-80">
          Ver todas
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-6 px-6 pb-12">
        {otherNews.map((item) => (
          <NewsCardOverlay
            key={item.id}
            id={item.id}
            title={item.title}
            imageUrl={item.imageUrl}
          />
        ))}
      </div>
    </section>
  );
};

export default LatestNews;
