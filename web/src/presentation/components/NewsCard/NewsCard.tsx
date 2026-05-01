import "./NewsCard.css";
import HeroCard from "./variants/HeroCard";
import FeaturedBoxCard from "./variants/FeaturedBoxCard";
import FeaturedWideCard from "./variants/FeaturedWideCard";
import CompactCard from "./variants/CompactCard";
import type { NewsItem } from "../../../types/models";
import type { ImgHTMLAttributes, ReactElement } from "react";

export type NewsCardVariant =
  | "hero"
  | "featuredBox"
  | "featuredWide"
  | "compact";

export type NewsCardVariantProps = {
  item: NewsItem;
  imageLoading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  imagePriority?: boolean;
};

type NewsCardProps = NewsCardVariantProps & {
  variant: NewsCardVariant;
};

const variantsMap = {
  hero: HeroCard,
  featuredBox: FeaturedBoxCard,
  featuredWide: FeaturedWideCard,
  compact: CompactCard,
} satisfies Record<NewsCardVariant, (props: NewsCardVariantProps) => ReactElement>;

const NewsCard = ({
  item,
  variant,
  imageLoading = "lazy",
  imagePriority = false,
}: NewsCardProps) => {
  if (!item) return null;

  const Component = variantsMap[variant];

  return (
    <Component
      item={item}
      imageLoading={imageLoading}
      imagePriority={imagePriority}
    />
  );
};

export default NewsCard;
