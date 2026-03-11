import { useEffect, useState } from "react";
import { getNews } from "../../lib/sanity";
import NewsBentoGrid from "../../features/news/NewsBentoGrid/NewsBentoGrid";
import NewsList from "../../features/news/NewsList/NewsList";
import Loader from "../../components/Loader/Loader";

const News = () => {
  const [newsData, setNewsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getNews()
      .then((data) => setNewsData(data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  const sortedNews = [...newsData].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  return (
    <main className="news-page">

      {/* HERO / DESTACADAS */}
      <section
        className="
        bento-wrapper
        bg-neutral-900
        shadow-lg shadow-black/30
        pt-8 pb-16
        md:pt-10 md:pb-20
        lg:pt-12 lg:pb-24
      "
      >
        <div className="background"></div>
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <NewsBentoGrid items={sortedNews.slice(0, 6)} />
        </div>
      </section>

      {/* LISTA DE NOTICIAS */}
      <section
        className="
        border-t border-violet-700
        py-10
        md:py-14
        lg:py-16
      "
      >
        <div className="max-w-6xl mx-auto px-4 md:px-6 lg:px-8">
          <NewsList items={sortedNews.slice(6)} />
        </div>
      </section>

    </main>
  );
};

export default News;