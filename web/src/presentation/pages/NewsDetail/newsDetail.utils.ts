// @ts-nocheck
export const shuffleArray = (array = []) => {
  return [...array].sort(() => Math.random() - 0.5);
};

export const selectSuggestedNews = (news = [], count = 3) => {
  return shuffleArray(news).slice(0, count);
};
