export const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString();
};

export const getNewsLink = (item) => {
  return `/noticias/${item.slug.current}`;
};