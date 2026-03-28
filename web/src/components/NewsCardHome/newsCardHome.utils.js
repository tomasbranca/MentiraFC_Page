export const getNewsLink = (item) => {
  return `/noticias/${item.slug.current}`;
};

export const getFeaturedClasses = (featured) => {
  return featured ? "sm:col-span-2 lg:col-span-1" : "";
};