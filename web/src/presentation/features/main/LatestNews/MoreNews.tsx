import { Link } from "react-router-dom";

import NewsCardHome from "../../../components/NewsCardHome/NewsCardHome";
import { ROUTES } from "../../../../shared/routing";
import type { NewsItem } from "../../../../types/models";

type MoreNewsProps = {
  news?: NewsItem[];
};

const MoreNews = ({ news = [] }: MoreNewsProps) => {
  if (!news.length) return null;

  return (
    <>
      <div className="mt-10 mb-6 px-6 pt-6 border-t border-violet-700/60">
        <div className="flex justify-center sm:justify-between items-center">
          <h3 className="font-extrabold uppercase tracking-widest">Más noticias</h3>

          <Link
            to={ROUTES.NEWS}
            className="hidden sm:block font-semibold underline underline-offset-4 hover:opacity-80 transition"
          >
            Ver todas
          </Link>
        </div>
      </div>

      <div className="grid gap-6 px-6 pb-14 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {news.map((item, index) => (
          <NewsCardHome
            key={item.id}
            item={item}
            featured={index === 0}
          />
        ))}
      </div>
    </>
  );
};

export default MoreNews;
