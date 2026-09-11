/**
 * Reader's HUB — Premium Book Completion Certificate Engine
 * Generates verified, authentic graduation/completion credentials for finished books.
 */

export interface BookCompletionCertificate {
  id: string; // e.g. "RH-CERT-2026-A1B2C3"
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  bookCategory: string;
  totalPages: number;
  verifiedReadingSeconds: number;
  completedAt: number;
  recipientName: string;
  recipientUsername?: string;
  recipientPhoto?: string;
  verificationHash: string;
  issueNumber: string;
}

const STORAGE_PREFIX = "readershub_certificates_";

function getStorageKey(uid?: string | null): string {
  if (uid && uid.trim()) {
    return `${STORAGE_PREFIX}${uid.trim()}`;
  }
  return `${STORAGE_PREFIX}guest`;
}

/**
 * Generate a unique, professional verification hash for authenticity
 */
export function generateVerificationHash(bookId: string, uid: string, timestamp: number): string {
  const seed = `${bookId}:${uid}:${timestamp}:readershub-verified-credential`;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  const hex = Math.abs(hash).toString(16).toUpperCase().padStart(8, "0");
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RH-VERIFY-${hex}-${randomSuffix}`;
}

/**
 * Creates a verified certificate object for a completed volume
 */
export function createCertificateData(params: {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  bookCover: string;
  bookCategory?: string;
  totalPages: number;
  readingSeconds?: number;
  recipientName?: string;
  recipientUsername?: string;
  recipientPhoto?: string;
  uid?: string | null;
  completedAt?: number;
}): BookCompletionCertificate {
  const completedAt = params.completedAt || Date.now();
  const uid = params.uid || "guest";
  const verificationHash = generateVerificationHash(params.bookId, uid, completedAt);
  const year = new Date(completedAt).getFullYear();
  const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const id = `RH-CERT-${year}-${randomId}`;

  return {
    id,
    bookId: params.bookId,
    bookTitle: params.bookTitle || "Literary Masterwork",
    bookAuthor: params.bookAuthor || "Honored Author",
    bookCover: params.bookCover || "/placeholder-cover.jpg",
    bookCategory: params.bookCategory || "Classic Literature",
    totalPages: params.totalPages || 1,
    verifiedReadingSeconds: params.readingSeconds || 0,
    completedAt,
    recipientName: params.recipientName || "Distinguished Scholar",
    recipientUsername: params.recipientUsername,
    recipientPhoto: params.recipientPhoto,
    verificationHash,
    issueNumber: `#RH-${randomId}`,
  };
}

/**
 * Retrieve all certificates stored locally for a given user
 */
export function getStoredCertificates(uid?: string | null): Record<string, BookCompletionCertificate> {
  if (typeof window === "undefined") return {};
  try {
    const key = getStorageKey(uid);
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[Certificate] Failed to read certificates from storage:", err);
    return {};
  }
}

/**
 * Retrieve a certificate for a specific completed book if already issued
 */
export function getCertificateForBook(bookId: string, uid?: string | null): BookCompletionCertificate | null {
  const certs = getStoredCertificates(uid);
  return certs[bookId] || null;
}

/**
 * Save a newly issued certificate to local storage
 */
export function saveCertificate(certificate: BookCompletionCertificate, uid?: string | null): void {
  if (typeof window === "undefined" || !certificate?.bookId) return;
  try {
    const key = getStorageKey(uid);
    const existing = getStoredCertificates(uid);
    existing[certificate.bookId] = certificate;
    localStorage.setItem(key, JSON.stringify(existing));
  } catch (err) {
    console.warn("[Certificate] Failed to save certificate locally:", err);
  }
}

