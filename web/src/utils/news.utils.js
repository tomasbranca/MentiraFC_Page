export const sortNews = (news = []) =>
  [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
