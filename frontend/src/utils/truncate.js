/**
 * Truncates a string to the given max length, appending "..." if truncated.
 * @param {string} str
 * @param {number} max
 * @returns {string}
 */
const truncate = (str, max = 50) => {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) + "..." : str;
};

export default truncate;
