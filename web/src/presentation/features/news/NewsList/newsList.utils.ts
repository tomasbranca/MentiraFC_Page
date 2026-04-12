// @ts-nocheck
export const paginateList = (items = [], visibleCount = 3) => {
  return items.slice(0, visibleCount);
};

export const getNextVisibleCount = (current, step = 3) => {
  return current + step;
};