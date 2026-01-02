import "./News.css";
import { useEffect, useState } from "react";
import { getNews } from "../../lib/sanity";
import NewsCard from "../../components/NewsCard/NewsCard";

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
      <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-[120px] md:auto-rows-[120px] gap-4 md:gap-4 my-8 mx-16">
        <div className="col-start-1 row-start-1 row-span-4 md:col-start-1 md:row-start-1 md:col-span-3 md:row-span-4">
          { sortedNews[0] && <NewsCard item={sortedNews[0]} variant="hero" /> }
        </div>
        <div className="col-start-1 row-start-5 row-span-2 md:col-start-1 md:row-start-5 md:col-span-1 md:row-span-3">
          { sortedNews[1] && <NewsCard item={sortedNews[1]} variant="featuredBox" /> }
        </div>
        <div className="col-start-1 row-start-7 row-span-2 md:col-start-2 md:row-start-5 md:col-span-2 md:row-span-3">
          { sortedNews[2] && <NewsCard item={sortedNews[2]} variant="featuredWide" /> }
        </div>
        <div className="hidden md:block md:col-start-1 md:row-start-8 md:col-span-1 md:row-span-2">
          { sortedNews[3] && <NewsCard item={sortedNews[3]} variant="compact" /> }
        </div>
        <div className="hidden md:block md:col-start-2 md:row-start-8 md:col-span-1 md:row-span-2">
          { sortedNews[4] && <NewsCard item={sortedNews[4]} variant="compact" /> }
        </div>
        <div className="hidden md:block md:col-start-3 md:row-start-8 md:col-span-1 md:row-span-2">
          { sortedNews[5] && <NewsCard item={sortedNews[5]} variant="compact" /> }
        </div>
      </div>
    </>
  );
};

export default News;
