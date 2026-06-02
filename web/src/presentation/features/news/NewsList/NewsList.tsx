import { Link } from "react-router-dom";

import { getImageUrl } from "../../../../data/imageService";
import Button from "../../../components/Button/Button";
import ProgressiveMedia from "../../../components/ProgressiveMedia/ProgressiveMedia";
import { formatDate } from "../../../utils/date.utils";
import { getNewsLink } from "../../../utils/navigation.utils";
import type { NewsItem } from "../../../../types/models";

type NewsListProps = {
  items?: NewsItem[];
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
};

const NewsList = ({
  items = [],
  hasMore = false,
  loadingMore = false,
  onLoadMore,
}: NewsListProps) => {
  if (!items.length) return null;

  return (
    <section className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h2 className="font-bold uppercase tracking-wide text-violet-900">
          Últimas noticias
        </h2>

        <div className="mt-2 h-1 w-16 bg-violet-800"></div>
      </div>

      <div className="flex flex-col gap-6">
        {items.map((item) => (
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
              className="h-full w-full object-cover"
              width={480}
              height={320}
              loading="lazy"
              decoding="async"
              skeletonClassName="bg-neutral-300"
              overlay={
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
              }
            />

            <div className="flex w-full flex-col justify-between px-5 py-4 md:w-[62%] lg:w-3/4">
              <div className="max-w-3xl">
                <h3 className="text-lg font-extrabold uppercase leading-tight text-violet-900 md:text-xl">
                  {item.title}
                </h3>

                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">
                  {item.description}
                </p>
              </div>

              <span className="mt-4 text-xs uppercase tracking-wide text-gray-500">
                {formatDate(item.date)}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-10">
          <Button
            variant="light"
            className="rounded-lg px-5 py-2.5 text-sm"
            disabled={loadingMore}
            onClick={onLoadMore}
          >
            {loadingMore ? "Cargando..." : "Cargar más"}
          </Button>
        </div>
      )}
    </section>
  );
};

export default NewsList;
