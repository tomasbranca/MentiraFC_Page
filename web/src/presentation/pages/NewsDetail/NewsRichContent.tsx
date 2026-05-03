import { PortableText } from "@portabletext/react";
import type {
  PortableTextReactComponents,
  PortableTextTypeComponentProps,
} from "@portabletext/react";
import type { ReactNode } from "react";

import { getImageUrl } from "../../../data/imageService";
import type {
  NewsContentBlock,
  NewsImageContentBlock,
  NewsVideoContentBlock,
} from "../../../types/models";
import ProgressiveMedia from "../../components/ProgressiveMedia/ProgressiveMedia";

type ChildrenProps = {
  children?: ReactNode;
};

const getEmbedVideoUrl = (videoUrl?: string | null): string | null => {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
      const videoId =
        url.searchParams.get("v") ??
        url.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];

      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (hostname === "vimeo.com" || hostname.endsWith(".vimeo.com")) {
      const videoId = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];

      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch {
    return null;
  }

  return null;
};

const isDirectVideoUrl = (videoUrl?: string | null): boolean =>
  Boolean(videoUrl?.match(/\.(mp4|webm|ogv|ogg|mov|m4v)(\?.*)?$/i));

const NewsContentImage = ({
  value,
  isInline,
}: PortableTextTypeComponentProps<NewsImageContentBlock>) => {
  const imageUrl = getImageUrl(value.imageUrl || value, {
    width: isInline ? 640 : 1200,
    fit: "max",
    quality: 78,
    autoFormat: true,
  });

  if (!imageUrl) return null;

  const caption = value.caption?.trim();

  return (
    <figure className={isInline ? "my-2 inline-block max-w-full" : "my-8"}>
      <ProgressiveMedia
        src={imageUrl}
        alt={value.alt || caption || "Imagen de la noticia"}
        wrapperClassName="rounded-lg border border-white/10 bg-neutral-950"
        className="h-auto w-full object-contain"
        loading="lazy"
        decoding="async"
        skeletonClassName="bg-neutral-800"
      />

      {caption && (
        <figcaption className="mt-2 text-sm leading-relaxed text-neutral-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const NewsContentVideo = ({
  value,
}: PortableTextTypeComponentProps<NewsVideoContentBlock>) => {
  const embedUrl = getEmbedVideoUrl(value.url);
  const directVideoUrl =
    value.fileUrl || (isDirectVideoUrl(value.url) ? value.url : null);
  const caption = value.caption?.trim();
  const title = value.title?.trim() || value.originalFilename || "Video";

  if (!embedUrl && !directVideoUrl && value.url) {
    return (
      <p className="my-6">
        <a
          href={value.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-violet-300 underline underline-offset-4 hover:text-violet-200"
        >
          Ver video
        </a>
      </p>
    );
  }

  if (!embedUrl && !directVideoUrl) return null;

  return (
    <figure className="my-8">
      <div className="aspect-video overflow-hidden rounded-lg border border-white/10 bg-black">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={title}
            className="h-full w-full"
            loading="lazy"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <video
            src={directVideoUrl ?? undefined}
            title={title}
            className="h-full w-full"
            controls
            preload="metadata"
          />
        )}
      </div>

      {caption && (
        <figcaption className="mt-2 text-sm leading-relaxed text-neutral-400">
          {caption}
        </figcaption>
      )}
    </figure>
  );
};

const portableTextComponents: Partial<PortableTextReactComponents> = {
  types: {
    image: NewsContentImage,
    video: NewsContentVideo,
  },
  block: {
    normal: ({ children }: ChildrenProps) => (
      <p className="mb-4 text-base md:text-lg leading-relaxed text-neutral-200 whitespace-pre-line">
        {children}
      </p>
    ),
    h1: ({ children }: ChildrenProps) => (
      <h1 className="mb-4 text-3xl md:text-4xl font-extrabold normal-case text-white leading-tight">
        {children}
      </h1>
    ),
    h2: ({ children }: ChildrenProps) => (
      <h2 className="mb-4 text-2xl md:text-3xl font-bold normal-case text-white leading-tight">
        {children}
      </h2>
    ),
    h3: ({ children }: ChildrenProps) => (
      <h3 className="mb-3 text-xl md:text-2xl font-bold normal-case text-white leading-tight">
        {children}
      </h3>
    ),
    h4: ({ children }: ChildrenProps) => (
      <h4 className="mb-3 text-lg md:text-xl font-semibold normal-case text-white leading-tight">
        {children}
      </h4>
    ),
    blockquote: ({ children }: ChildrenProps) => (
      <blockquote className="my-4 border-l-4 border-violet-500 pl-4 italic text-neutral-300 whitespace-pre-line">
        {children}
      </blockquote>
    ),
  },
  marks: {
    strong: ({ children }: ChildrenProps) => (
      <strong className="font-bold text-white">{children}</strong>
    ),
    em: ({ children }: ChildrenProps) => <em className="italic">{children}</em>,
    underline: ({ children }: ChildrenProps) => (
      <span className="underline">{children}</span>
    ),
  },
  list: {
    bullet: ({ children }: ChildrenProps) => (
      <ul className="my-4 ml-6 list-disc space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ul>
    ),
    number: ({ children }: ChildrenProps) => (
      <ol className="my-4 ml-6 list-decimal space-y-2 text-base md:text-lg text-neutral-200">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }: ChildrenProps) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
    number: ({ children }: ChildrenProps) => (
      <li className="list-item whitespace-pre-line">{children}</li>
    ),
  },
  hardBreak: () => <br />,
};

type NewsRichContentProps = {
  content?: NewsContentBlock[];
};

const NewsRichContent = ({ content }: NewsRichContentProps) => {
  return <PortableText value={content ?? []} components={portableTextComponents} />;
};

export default NewsRichContent;
