// @ts-nocheck
import { Link } from "react-router-dom";
import { getNewsLink } from "../../../utils/navigation.utils";

const FeaturedBoxCard = ({ item }) => {
  return (
    <Link
      to={getNewsLink(item)}
      className="animation-shadow news-card-featured-box grid grid-rows-5 size-full overflow-hidden"
    >
      <div
        className="row-span-3"
        style={{
          backgroundImage: `url(${item.imageUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      <div className="bg-neutral-950 row-span-2 flex flex-col justify-center px-4 py-4">
        <h3 className="text-violet-800 font-medium leading-snug line-clamp-2 mb-1">
          {item.title}
        </h3>

        <p className="text-sm opacity-80 line-clamp-2 text-violet-50">
          {item.description}
        </p>
      </div>
    </Link>
  );
};

export default FeaturedBoxCard;