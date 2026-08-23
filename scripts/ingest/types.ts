import { Book, ResourceType } from "../../data/books";

export interface IngestCandidate {
  originalFilename: string;
  originalPath: string;
  proposedFilename: string;
  proposedPath: string;
  fileHash: string;
  sizeBytes: number;
  sizeMB: string;
  pageCount: number;

  // Status flags
  isDuplicate: boolean;
  duplicateOf?: string;
  isInvalid: boolean;
  invalidReason?: string;
  needsReview: boolean;
  reviewReason?: string;
  isRenamed: boolean;

  // Metadata
  id: string;
  title: string;
  author: string;
  category: string;
  resourceType: ResourceType;
  language: string;
  year: number;
  rating: number;
  description: string;
  excerpt: string;
  tags: string[];

  // Cover
  coverName: string;
  coverPath: string;
  coverRelativeUrl: string;

  // Final Book Object
  bookEntry?: Book;
}

export interface IngestReport {
  detected: number;
  added: IngestCandidate[];
  duplicates: IngestCandidate[];
  invalid: IngestCandidate[];
  needsReview: IngestCandidate[];
  renamed: Array<{ from: string; to: string }>;
  coversGenerated: number;
  catalogBefore: number;
  catalogAfter: number;
  isDryRun: boolean;
}
