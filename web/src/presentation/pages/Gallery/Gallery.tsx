import ErrorFallback from "../../components/errors/ErrorFallback";
import GalleryCard from "../../components/GalleryCard/GalleryCard";
import Loader from "../../components/Loader/Loader";
import { useGalleryData } from "./hooks/useGalleryData";

const Gallery = () => {
  const { galleries, loading, error, refetch } = useGalleryData();

  if (loading) return <Loader />;

  if (error) {
    return (
      <ErrorFallback
        title="No se pudieron cargar las galerias"
        message="Intenta nuevamente en unos minutos."
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-neutral-900 md:min-h-0 md:max-w-7xl md:mx-auto md:bg-transparent md:px-4 md:py-12">
      <section className="min-h-screen bg-neutral-900 md:min-h-0 md:border border-gray-200 shadow-sm">
        <header className="w-full bg-violet-900 p-5 md:p-8 md:border-b border-gray-200">
          <p className="mb-2 text-base font-bold leading-tight text-violet-200">
            Multimedia
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-violet-50">
            Galerias de fotos
          </h1>
        </header>

        <div className="p-5 md:p-8">
          {!galleries.length && (
            <div className="flex min-h-72 items-center justify-center bg-neutral-800 md:border border-violet-100 p-5 text-center font-bold text-violet-200">
              No hay galerias publicadas todavia
            </div>
          )}

          <div className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {galleries.map((gallery, index) => (
              <GalleryCard
                key={gallery.id}
                gallery={gallery}
                imageLoading={index < 3 ? "eager" : "lazy"}
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Gallery;
