import { Book } from "@/data/books";
import { AFFILIATE_CONFIG } from "./monetization-config";
import auditData from "@/data/content-rights-audit.json";

export interface AffiliateLinkInfo {
  url: string;
  label: string;
  disclosure: string;
  isPhysicalCopy: boolean;
}

// Map of audited eligibility for fast O(1) lookup
const auditedEligibilityMap = new Map<string, boolean>();
if (auditData && Array.isArray((auditData as any).records)) {
  for (const rec of (auditData as any).records) {
    auditedEligibilityMap.set(rec.id, Boolean(rec.affiliateEligible));
  }
}

/**
 * Returns affiliate physical purchase information ONLY for legally eligible books
 * and when the affiliate system is configured and enabled.
 */
export function getAffiliateInfoForBook(book: Book): AffiliateLinkInfo | null {
  // If global affiliate feature is not enabled, return null
  if (!AFFILIATE_CONFIG.enabled) {
    return null;
  }

  // Check if book is legally audited as eligible for physical purchase promotion
  const isAuditedEligible = auditedEligibilityMap.get(book.id);
  if (!isAuditedEligible) {
    return null;
  }

  // If book has explicit custom affiliateUrl / buyUrl
  const customUrl = (book as any).affiliateUrl || (book as any).buyUrl;
  if (customUrl) {
    return {
      url: customUrl,
      label: (book as any).purchaseLabel || AFFILIATE_CONFIG.buttonLabel,
      disclosure: AFFILIATE_CONFIG.disclosureText,
      isPhysicalCopy: true,
    };
  }

  // If Amazon tag is configured, construct safe search URL for physical edition
  if (AFFILIATE_CONFIG.amazonAssociateTag) {
    const query = encodeURIComponent(`${book.title} ${book.author} paperback book`);
    const amazonUrl = `https://www.amazon.in/s?k=${query}&tag=${encodeURIComponent(
      AFFILIATE_CONFIG.amazonAssociateTag
    )}`;

    return {
      url: amazonUrl,
      label: AFFILIATE_CONFIG.buttonLabel,
      disclosure: AFFILIATE_CONFIG.disclosureText,
      isPhysicalCopy: true,
    };
  }

  return null;
}
