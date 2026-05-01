export const paginateList = <T>(items: T[] = [], visibleCount = 3): T[] => {
  return items.slice(0, visibleCount);
};

export const getNextVisibleCount = (current: number, step = 3): number => {
  return current + step;
};
