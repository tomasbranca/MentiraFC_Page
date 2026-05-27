import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../../data/imageService";
import ProgressiveMedia from "../../ProgressiveMedia/ProgressiveMedia";
import { getNewsLink } from "../../../utils/navigation.utils";
import type { NewsCardVariantProps } from "../NewsCard";

const FeaturedBoxCard = ({
  item,
  imageLoading = "lazy",
  imagePriority = false,
}: NewsCardVariantProps) => {
  return (
    <Link
      to={getNewsLink(item)}
      className="animation-shadow news-card-featured-box grid grid-rows-5 size-full overflow-hidden"
    >
      <ProgressiveMedia
        src={getImageUrl(item.imageUrl, {
          width: 720,
          height: 480,
          fit: "crop",
          quality: 70,
          autoFormat: true,
        })}
        srcSet={getImageSrcSet(item.imageUrl, [360, 540, 720], {
          height: (width) => Math.round(width * 2 / 3),
          fit: "crop",
          quality: 70,
          autoFormat: true,
        })}
        sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 32px), calc(33vw - 32px)"
        alt={item.imageAlt || item.title}
        wrapperClassName="row-span-3"
        className="row-span-3 w-full h-full object-cover"
        loading={imageLoading}
        {...(Object.prototype.hasOwnProperty.call(
          HTMLImageElement.prototype,
          "fetchPriority"
        ) && {
          fetchPriority: imagePriority ? "high" : "auto",
        })}
        decoding="async"
        width="1200"
        height="800"
        skeletonClassName="bg-neutral-900"
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
