import {
  type ImgHTMLAttributes,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getProgressiveMediaWrapperClassName,
  joinClasses,
} from "./ProgressiveMedia.utils";

type ProgressiveMediaProps = Omit<
  ImgHTMLAttributes<HTMLImageElement>,
  "alt" | "className"
> & {
  alt: string;
  className?: string;
  wrapperClassName?: string;
  skeletonClassName?: string;
  overlay?: ReactNode;
};

const ProgressiveMedia = ({
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  overlay,
  src,
  srcSet,
  onError,
  onLoad,
  ...imgProps
}: ProgressiveMediaProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const mediaKey = useMemo(() => `${src ?? ""}|${srcSet ?? ""}`, [src, srcSet]);

  useEffect(() => {
    setIsLoaded(false);

    const image = imageRef.current;

    if (image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true);
    }
  }, [mediaKey]);

  return (
    <div
      className={getProgressiveMediaWrapperClassName(wrapperClassName)}
      data-loaded={isLoaded}
    >
      {!isLoaded && (
        <div
          aria-hidden="true"
          className={joinClasses(
            "absolute inset-0 animate-pulse bg-linear-to-br from-neutral-800 via-neutral-700 to-neutral-800",
            skeletonClassName
          )}
        />
      )}

      <img
        {...imgProps}
        ref={imageRef}
        alt={alt}
        src={src}
        srcSet={srcSet}
        onLoad={(event) => {
          setIsLoaded(true);
          onLoad?.(event);
        }}
        onError={(event) => {
          setIsLoaded(true);
          onError?.(event);
        }}
        className={joinClasses(
          "h-full w-full transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0",
          className
        )}
      />

      {overlay}
    </div>
  );
};

export default ProgressiveMedia;
