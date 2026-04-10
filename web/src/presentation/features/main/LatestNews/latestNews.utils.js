export const splitNews = (news = [], carouselCount = 3, gridCount = 3) => {
  return {
    carouselNews: news.slice(0, carouselCount),
    otherNews: news.slice(carouselCount, carouselCount + gridCount),
  };
};