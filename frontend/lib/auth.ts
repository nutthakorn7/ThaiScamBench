// Admin authentication utilities

const ADMIN_TOKEN_KEY = 'admin_token';

export interface AdminToken {
  token: string;
  expiresAt?: number;
}

/**
 * Set admin token in localStorage
 */
export const setAdminToken = (token: string): void => {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
};

/**
 * Get admin token from localStorage
 */
export const getAdminToken = (): string | null => {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
};

/**
 * Remove admin token (logout)
 */
export const removeAdminToken = (): void => {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
};

/**
 * Check if user is authenticated as admin
 */
export const isAdminAuthenticated = (): boolean => {
  return !!getAdminToken();
};
