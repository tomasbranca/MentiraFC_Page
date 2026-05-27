import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../../data/imageService";
import ProgressiveMedia from "../../ProgressiveMedia/ProgressiveMedia";
import { getNewsLink } from "../../../utils/navigation.utils";
import type { NewsCardVariantProps } from "../NewsCard";

const CompactCard = ({
  item,
  imageLoading = "lazy",
  imagePriority = false,
}: NewsCardVariantProps) => {
  return (
    <Link to={getNewsLink(item)} className="news-card-compact block h-full">
      <article className="news-card-image animation-shadow h-full">
        <ProgressiveMedia
          src={getImageUrl(item.imageUrl, {
            width: 720,
            height: 540,
            fit: "crop",
            quality: 70,
            autoFormat: true,
          })}
          srcSet={getImageSrcSet(item.imageUrl, [320, 420, 540], {
            height: (width) => Math.round(width * 0.75),
            fit: "crop",
            quality: 70,
            autoFormat: true,
          })}
          sizes="(max-width: 768px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 32px), calc(33vw - 32px)"
          alt={item.imageAlt || item.title}
          wrapperClassName="news-card-image h-full"
          className="news-card-media"
          loading={imageLoading}
          {...(typeof navigator !== "undefined" && navigator.userAgent.includes("Firefox")
            ? {}
            : { fetchPriority: imagePriority ? "high" : "auto" })}
          decoding="async"
          width="1200"
          height="900"
          skeletonClassName="bg-violet-950/70"
          overlay={
            <div className="news-card-overlay">
              <h3 className="news-card-title text-violet-50">{item.title}</h3>
            </div>
          }
        />
      </article>
    </Link>
  );
};

export default CompactCard;
