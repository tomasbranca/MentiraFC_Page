export const splitNewsForPage = (news = [], featuredCount = 6) => {
  return {
    featured: news.slice(0, featuredCount),
    list: news.slice(featuredCount),
  };
};