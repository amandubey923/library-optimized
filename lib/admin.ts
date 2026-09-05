export const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL || process.env.ADMIN_API || "kumaraman19137@gmail.com";

/**
 * Checks if the given email corresponds to the authorized Reader Hub admin.
 * Performs case-insensitive comparison.
 */
export function isAdminUser(email?: string | null): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase();
}

