import { Link } from "react-router-dom";
import { getImageSrcSet, getImageUrl } from "../../../data/imageService";
import ProgressiveMedia from "../ProgressiveMedia/ProgressiveMedia";
import "./NewsCardHome.css";
import { getFeaturedClasses } from "./newsCardHome.utils";
import { getNewsLink } from "../../utils/navigation.utils";
import type { NewsItem } from "../../../types/models";

type NewsCardHomeProps = {
  item: NewsItem | null;
  featured: boolean;
  priority?: boolean;
};

const NewsCardHome = ({
  item,
  featured,
  priority = false,
}: NewsCardHomeProps) => {
  if (!item) return null;

  return (
    <Link
      to={getNewsLink(item)}
      className={`
        group block overflow-hidden
        shadow-md hover:shadow-xl transition-shadow
      
        aspect-4/3
        sm:aspect-video
      
        ${getFeaturedClasses(featured)}
      `}
    >
      <article className="news-card-image">
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
          sizes={
            featured
              ? "(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) calc(100vw - 48px), calc(33vw - 32px)"
              : "(max-width: 640px) calc(100vw - 48px), (max-width: 1024px) calc(50vw - 36px), calc(33vw - 32px)"
          }
          alt=""
          wrapperClassName="news-card-image"
          className="news-card-media"
          loading={priority ? "eager" : "lazy"}
          {...(Object.prototype.hasOwnProperty.call(
            HTMLImageElement.prototype,
            "fetchPriority"
          )
            ? { fetchPriority: priority ? "high" : "auto" }
            : {})}
          decoding="async"
          width="1200"
          height="900"
          skeletonClassName="bg-violet-950/70"
          overlay={
            <div className="news-card-overlay">
              <h3
                className={`news-card-title ${
                  featured ? "news-card-title-featured" : ""
                }`}
              >
                {item.title}
              </h3>
            </div>
          }
        />
      </article>
    </Link>
  );
};

export default NewsCardHome;
