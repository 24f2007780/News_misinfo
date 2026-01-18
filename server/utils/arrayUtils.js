// server/utils/arrayUtils.js
const safeMap = (array, callback) => {
  if (!Array.isArray(array)) return [];
  return array.map(callback);
};

module.exports = { safeMap };