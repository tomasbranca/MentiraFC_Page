import { Link } from "react-router-dom";
import { useState } from "react";
import Button from "../../../components/Button/Button";

const NewsList = ({ items }) => {
  const [visibleCount, setVisibleCount] = useState(3);

  if (!items || items.length === 0) return null;

  const visibleNews = items.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-8 my-8 mx-16">
      {visibleNews.map((item) => (
        <Link
          key={item._id}
          to={`/noticias/${item.slug.current}`}
          className="h-36 w-full flex bg-violet-50 border-2 border-violet-200 animation-shadow"
        >
          <div
            style={{ backgroundImage: `url(${item.imageUrl})` }}
            className="h-full w-1/5 bg-cover bg-center"
          />
          <div className="p-4 flex flex-col justify-between w-4/5">
            <div>
              <h3 className="text-2xl font-bold text-violet-900">
                {item.title}
              </h3>
              <p className="mt-2">{item.description}</p>
            </div>
            <div className="text-sm">
              {new Date(item.date).toLocaleDateString()}
            </div>
          </div>
        </Link>
      ))}

      {visibleCount < items.length && (
        <Button onClick={() => setVisibleCount(visibleCount + 3)}>
          Cargar más
        </Button>
      )}
    </div>
  );
};

export default NewsList;
