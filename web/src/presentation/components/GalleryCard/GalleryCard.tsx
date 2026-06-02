import { FiImage } from "react-icons/fi";
import { Link } from "react-router-dom";

import { getImageUrl } from "../../../data/imageService";
import type { GalleryListItem } from "../../../types/models";
import ProgressiveMedia from "../ProgressiveMedia/ProgressiveMedia";
import { buildGalleryMatchTitle } from "../../utils/gallery.utils";
import { getGalleryLink } from "../../utils/navigation.utils";

import "./GalleryCard.css";

type GalleryCardProps = {
  gallery: GalleryListItem;
  imageLoading?: "eager" | "lazy";
};

const GalleryCard = ({
  gallery,
  imageLoading = "lazy",
}: GalleryCardProps) => {
  const title = buildGalleryMatchTitle(gallery.game);
  const photoLabel = `${gallery.photoCount} ${
    gallery.photoCount === 1 ? "FOTO" : "FOTOS"
  }`;

  return (
    <Link to={getGalleryLink(gallery)} className="group block text-inherit">
      <div className="relative aspect-16/10 overflow-hidden bg-neutral-950 shadow-xl transition-all duration-300 group-hover:shadow-2xl">
        <ProgressiveMedia
          src={getImageUrl(gallery.heroImage.imageUrl, {
            width: 680,
            height: 430,
            fit: "crop",
            quality: 72,
            autoFormat: true,
          })}
          alt={gallery.heroImage.alt}
          wrapperClassName="absolute inset-0 z-10"
          className="absolute inset-0 object-cover transition-transform duration-500 group-hover:scale-105"
          width={680}
          height={430}
          loading={imageLoading}
          decoding="async"
          skeletonClassName="bg-neutral-300"
          overlay={
            <>
              <div className="gallery-card-shade" />
              <FiImage
                className="absolute top-4 right-4 z-30 h-7 w-7 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]"
                aria-hidden="true"
              />
              <span className="gallery-card-count absolute bottom-5 left-0 z-30 inline-flex min-h-6 items-center pr-3 pl-7 text-sm font-black leading-none text-white uppercase [text-shadow:0_2px_8px_rgba(0,0,0,0.85)]">
                {photoLabel}
              </span>
            </>
          }
        />
      </div>

      <p className="gallery-card-title mt-3 text-md font-bold leading-snug text-violet-50 transition-colors group-hover:text-violet-300 sm:text-[0.95rem] md:text-sm lg:text-[1.05rem] xl:text-base">
        {title}
      </p>
    </Link>
  );
};

export default GalleryCard;
