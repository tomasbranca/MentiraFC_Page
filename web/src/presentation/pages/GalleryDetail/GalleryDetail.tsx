import { type CSSProperties, useMemo } from "react";
import { FiDownload } from "react-icons/fi";
import { useParams } from "react-router-dom";

import { getImageUrl } from "../../../data/imageService";
import ErrorFallback from "../../components/errors/ErrorFallback";
import Loader from "../../components/Loader/Loader";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";
import {
  buildGalleryMatchTitle,
  getGalleryImageAspectRatio,
  getGalleryImageDownloadFilename,
  getGalleryImageDownloadUrl,
  getGalleryImageLayout,
} from "../../utils/gallery.utils";
import {
  buildGalleryHead,
  buildMissingGalleryHead,
  STATIC_PAGE_HEAD,
} from "../../seo/metadata";
import { usePageHead } from "../../seo/usePageHead";
import { useGalleryDetail } from "./hooks/useGalleryDetail";

import "./GalleryDetail.css";

const GalleryDetail = () => {
  const { slug } = useParams();
  const { gallery, loading, error, refetch } = useGalleryDetail(slug);
  const title = gallery ? buildGalleryMatchTitle(gallery.game) : "";
  const metadata = useMemo(
    () =>
      loading
        ? STATIC_PAGE_HEAD.gallery
        : gallery
          ? buildGalleryHead(gallery)
          : buildMissingGalleryHead(slug),
    [gallery, loading, slug]
  );

  usePageHead(metadata);

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudo cargar la galeria"
        message="Intenta nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  if (!gallery) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-neutral-400">
        <p>No se encontro la galeria</p>
      </div>
    );
  }

  return (
    <article className="w-full md:max-w-7xl md:mx-auto md:px-4 md:py-12">
      <div className="bg-neutral-900 md:border border-gray-200 shadow-sm">
        <header className="w-full bg-violet-900 p-5 md:p-8 md:border-b border-gray-200">
          <p className="mb-2 text-base font-bold leading-tight text-violet-200">
            Galeria de fotos
          </p>
          <h1 className="max-w-5xl text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-violet-50">
            {title}
          </h1>
        </header>

        <section className="gallery-detail-bento p-5 md:p-8" aria-label={title}>
          {gallery.images.map((image, index) => {
            const layout = getGalleryImageLayout(image, index);
            const aspectRatio = getGalleryImageAspectRatio(image);
            const downloadUrl = getGalleryImageDownloadUrl(
              gallery,
              image,
              index
            );
            const downloadFilename = getGalleryImageDownloadFilename(
              gallery,
              image,
              index
            );

            return (
              <figure
                key={image.id}
                className={`gallery-bento-item gallery-bento-item--${layout}`}
                style={
                  {
                    "--gallery-aspect-ratio": aspectRatio,
                  } as CSSProperties
                }
              >
                <ProgressiveMedia
                  src={getImageUrl(image.imageUrl, {
                    width: layout === "portrait" ? 720 : 1280,
                    height: layout === "portrait" ? 1080 : 860,
                    fit: "crop",
                    quality: 76,
                    autoFormat: true,
                  })}
                  alt={image.alt}
                  wrapperClassName="gallery-bento-media"
                  className="object-cover transition-[opacity,transform] duration-500"
                  width={layout === "portrait" ? 720 : 1280}
                  height={layout === "portrait" ? 1080 : 860}
                  loading={index < 3 ? "eager" : "lazy"}
                  decoding="async"
                  skeletonClassName="bg-neutral-300"
                  overlay={
                    <a
                      className="absolute top-3 right-3 inline-flex h-10 w-10 items-center justify-center border border-white/50 bg-neutral-950/70 text-white transition hover:-translate-y-0.5 hover:bg-violet-700 focus-visible:-translate-y-0.5 focus-visible:bg-violet-700 focus-visible:outline-none"
                      href={downloadUrl}
                      download={downloadFilename}
                      aria-label={`Descargar ${image.alt}`}
                      title="Descargar"
                    >
                      <FiDownload className="h-5 w-5" aria-hidden="true" />
                    </a>
                  }
                />
              </figure>
            );
          })}
        </section>
      </div>
    </article>
  );
};

export default GalleryDetail;
