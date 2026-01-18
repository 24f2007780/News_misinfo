// utils/arrayUtils.ts
export const safeMap = <T, U>(array: T[] | undefined | null, callback: (item: T, index: number) => U): U[] => {
  if (!Array.isArray(array)) return [];
  return array.map(callback);
};