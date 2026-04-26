// @ts-nocheck
import "./NewsCard.css";
import HeroCard from "./variants/HeroCard";
import FeaturedBoxCard from "./variants/FeaturedBoxCard";
import FeaturedWideCard from "./variants/FeaturedWideCard";
import CompactCard from "./variants/CompactCard";

const NewsCard = ({ item, variant, imageLoading = "lazy", imagePriority = false }) => {
  if (!item) return null;

  const variantsMap = {
    hero: HeroCard,
    featuredBox: FeaturedBoxCard,
    featuredWide: FeaturedWideCard,
    compact: CompactCard,
  };

  const Component = variantsMap[variant];

  if (!Component) return null;

  return (
    <Component
      item={item}
      imageLoading={imageLoading}
      imagePriority={imagePriority}
    />
  );
};

export default NewsCard;
