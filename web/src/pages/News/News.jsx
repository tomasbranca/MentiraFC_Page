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
    <>
      <NewsBentoGrid items={sortedNews.slice(0, 6)} />
      <NewsList items={sortedNews.slice(6)} />
    </>
  );
};

export default News;
