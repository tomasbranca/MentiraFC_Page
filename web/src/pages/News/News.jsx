import "./News.css";
import { useEffect, useState } from "react";
import { getNews } from "../../lib/sanity";
import NewsBentoGrid from "../../features/news/NewsBentoGrid/NewsBentoGrid";
import NewsList from "../../features/news/NewsList/NewsList";

const News = () => {
  const [newsData, setNewsData] = useState([]);

  useEffect(() => {
    getNews().then((data) => setNewsData(data));
  }, []);

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
