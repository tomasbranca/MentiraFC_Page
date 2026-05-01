export const getFeaturedClasses = (featured: boolean): string => {
  return featured ? "sm:col-span-2 lg:col-span-1" : "";
};
