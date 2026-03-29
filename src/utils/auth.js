/**
 * Auth utilities for Deriv tokens
 */

/**
 * Gets the Deriv token from localStorage or cookies
 * @returns {string|null} The token or null
 */
export const getDerivToken = () => {
  // 1. Try localStorage (Legacy path)
  const localToken = localStorage.getItem('deriv_token');
  if (localToken) return localToken;

  // 2. Try Cookies (New secure path)
  const value = `; ${document.cookie}`;
  const parts = value.split(`; deriv_token=`);
  if (parts.length === 2) return parts.pop().split(';').shift();

  return null;
};

/**
 * Clears the Deriv token from localStorage and cookies
 */
export const clearDerivToken = () => {
  localStorage.removeItem('deriv_token');
  document.cookie = 'deriv_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
};
