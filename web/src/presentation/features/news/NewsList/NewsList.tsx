import { useState } from "react";
import { Link } from "react-router-dom";

import { getImageUrl } from "../../../../data/imageService";
import Button from "../../../components/Button/Button";
import ProgressiveMedia from "../../../components/ProgressiveMedia/ProgressiveMedia";
import { formatDate } from "../../../utils/date.utils";
import { getNewsLink } from "../../../utils/navigation.utils";
import { getNextVisibleCount, paginateList } from "./newsList.utils";
import type { NewsItem } from "../../../../types/models";

type NewsListProps = {
  items?: NewsItem[];
};

const NewsList = ({ items = [] }: NewsListProps) => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!items.length) return null;

  const visibleNews = paginateList(items, visibleCount);

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="text-violet-900 font-bold uppercase tracking-wide">
          Últimas noticias
        </h2>

        <div className="w-16 h-1 bg-violet-800 mt-2"></div>
      </div>

      <div className="flex flex-col gap-6">
        {visibleNews.map((item) => (
          <Link
            key={item.id}
            to={getNewsLink(item)}
            className="
              group
              flex flex-col
              md:flex-row
              w-full
              bg-white
              border border-gray-200
              hover:border-violet-600
              transition-colors
              overflow-hidden
            "
          >
            <ProgressiveMedia
              src={getImageUrl(item.imageUrl, {
                width: 480,
                height: 320,
                fit: "crop",
                quality: 68,
                autoFormat: true,
              })}
              alt={item.imageAlt || item.title}
              wrapperClassName="
                relative
                w-full
                h-50
                md:w-[38%]
                md:h-auto
                md:min-h-30
                lg:w-1/4
              "
              className="w-full h-full object-cover"
              width={480}
              height={320}
              loading="lazy"
              decoding="async"
              skeletonClassName="bg-neutral-300"
              overlay={
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
              }
            />

            <div className="flex flex-col justify-between px-5 py-4 w-full md:w-[62%] lg:w-3/4">
              <div className="max-w-3xl">
                <h3 className="text-lg md:text-xl font-extrabold uppercase text-violet-900 leading-tight">
                  {item.title}
                </h3>

                <p className="mt-2 text-gray-700 text-sm leading-relaxed line-clamp-3">
                  {item.description}
                </p>
              </div>

              <span className="mt-4 text-xs tracking-wide text-gray-500 uppercase">
                {formatDate(item.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {visibleCount < items.length && (
        <div className="flex justify-center pt-10">
          <Button
            variant="light"
            className="px-5 py-2.5 rounded-lg text-sm"
            onClick={() => setVisibleCount(getNextVisibleCount(visibleCount))}
          >
            Cargar más
          </Button>
        </div>
      )}
    </section>
  );
};

export default NewsList;
