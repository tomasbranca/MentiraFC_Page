export const adaptNews = (news = []) => {
  return news.map(adaptSingleNews);
};

export const adaptSingleNews = (item) => {
  if (!item) return null;

  return {
    id: item._id,
    title: item.title,
    description: item.description,
    content: item.content,
    date: item.date,
    slug: item.slug?.current || item.slug,
    imageUrl: item.imageUrl, // ✅ consistente
  };
};