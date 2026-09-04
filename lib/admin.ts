export const ADMIN_EMAIL = "kumaraman19137@gmail.com";

/**
 * Checks if the given email corresponds to the authorized Reader Hub admin.
 * Performs case-insensitive comparison.
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

