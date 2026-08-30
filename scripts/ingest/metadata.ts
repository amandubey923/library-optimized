import fs from "fs";
import { PDFDocument } from "pdf-lib";
import { PDFParse } from "pdf-parse";
import { TECHNICAL_CATEGORIES_SET, TECHNICAL_SUBCATEGORIES, ResourceType } from "../../data/books";

export interface ExtractedMeta {
  title: string;
  author: string;
  category: string;
  resourceType: ResourceType;
  language: string;
  year: number;
  rating: number;
  pageCount: number;
  description: string;
  excerpt: string;
  tags: string[];
  isOsho: boolean;
  isInvalid: boolean;
  invalidReason?: string;
  needsReview: boolean;
  reviewReason?: string;
}

export async function extractPdfMetadata(filePath: string, filename: string): Promise<ExtractedMeta> {
  const stats = fs.statSync(filePath);

  // 1. Invalid / Empty check (< 1KB)
  if (stats.size < 1024) {
    return {
      title: filename,
      author: "Unknown",
      category: "Philosophy & Spirituality",
      resourceType: "Book",
      language: "English",
      year: new Date().getFullYear(),
      rating: 4.5,
      pageCount: 0,
      description: "",
      excerpt: "",
      tags: [],
      isOsho: false,
      isInvalid: true,
      invalidReason: `Tiny placeholder / empty file (${stats.size} bytes)`,
      needsReview: false,
    };
  }

  const fileBuffer = fs.readFileSync(filePath);

  // 2. Load PDF with pdf-lib for exact page count & metadata
  let pageCount = 0;
  let metaTitle = "";
  let metaAuthor = "";
  let metaSubject = "";

  try {
    const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    pageCount = pdfDoc.getPageCount();
    metaTitle = pdfDoc.getTitle() || "";
    metaAuthor = pdfDoc.getAuthor() || "";
    metaSubject = pdfDoc.getSubject() || "";
  } catch (err: any) {
    return {
      title: filename,
      author: "Unknown",
      category: "Philosophy & Spirituality",
      resourceType: "Book",
      language: "English",
      year: new Date().getFullYear(),
      rating: 4.5,
      pageCount: 0,
      description: "",
      excerpt: "",
      tags: [],
      isOsho: false,
      isInvalid: true,
      invalidReason: `Corrupted or unreadable PDF: ${err.message}`,
      needsReview: false,
    };
  }

  // Check 1-page dummy
  if (pageCount <= 1 && stats.size < 50000) {
    return {
      title: filename,
      author: "Unknown",
      category: "Philosophy & Spirituality",
      resourceType: "Book",
      language: "English",
      year: new Date().getFullYear(),
      rating: 4.5,
      pageCount,
      description: "",
      excerpt: "",
      tags: [],
      isOsho: false,
      isInvalid: true,
      invalidReason: `1-page placeholder dummy (${stats.size} bytes)`,
      needsReview: false,
    };
  }

  // 3. Extract text from first 2 pages using PDFParse
  let extractedText = "";
  try {
    const parser = new PDFParse({ data: fileBuffer });
    const textResult = await parser.getText();
    if (textResult && textResult.text) {
      extractedText = textResult.text.replace(/\s+/g, " ").trim().substring(0, 800);
    }
    await parser.destroy();
  } catch {
    // Non-blocking text parse failure (scanned/handwritten PDF)
  }

  // 4. Identify Osho Works
  const isOshoFilename = /osho/i.test(filename) || /osho/i.test(metaAuthor) || /osho/i.test(metaTitle);
  const isOshoText = /osho/i.test(extractedText) || /ओशो/i.test(extractedText) || /रजनीश/i.test(extractedText);
  const isOsho = isOshoFilename || isOshoText;

  // 5. Detect Resource Type
  let resourceType: ResourceType = "Book";
  const lowerFile = filename.toLowerCase();
  const lowerText = extractedText.toLowerCase();

  if (lowerFile.includes("cheatsheet") || lowerFile.includes("cheat sheet") || lowerText.includes("cheat sheet")) {
    resourceType = "CheatSheet";
  } else if (lowerFile.includes("interview") || lowerFile.includes("questions") || lowerText.includes("interview questions")) {
    resourceType = "InterviewPrep";
  } else if (lowerFile.includes("handwritten") || lowerText.includes("handwritten")) {
    resourceType = "HandwrittenNotes";
  } else if (lowerFile.includes("notes") || lowerFile.includes("complete notes") || lowerText.includes("lecture notes")) {
    resourceType = "Notes";
  }

  // 6. Detect Category & Subcategory
  let category = "Philosophy & Spirituality";
  let tags: string[] = [];

  if (isOsho) {
    category = "Philosophy & Spirituality";
    tags = ["Osho", "Spiritual Discourses", "Hindi Literature", "Meditation", "Self-Realization"];
  } else if (
    lowerFile.includes("investor") || lowerFile.includes("intelligent investor") ||
    lowerFile.includes("finance") || lowerFile.includes("economics") || lowerFile.includes("startup")
  ) {
    category = "Business, Finance & Economics";
    tags = ["Finance", "Investing", "Value Investing", "Economics", "Business"];
  } else if (
    lowerFile.includes("denial of death") || lowerFile.includes("psychology") || lowerFile.includes("self-help")
  ) {
    category = "Self-Development & Psychology";
    tags = ["Psychology", "Existentialism", "Human Nature", "Philosophy"];
  } else if (
    lowerFile.includes("dsa") || lowerFile.includes("leetcode") || lowerFile.includes("algorithm") ||
    lowerText.includes("data structure") || lowerText.includes("dynamic programming")
  ) {
    category = "Technical Knowledge";
    tags = ["DSA", "Data Structures", "Algorithms", "Problem Solving", "Interview Prep"];
  } else if (
    lowerFile.includes("sql") || lowerFile.includes("dbms") || lowerFile.includes("database") ||
    lowerText.includes("relational database") || lowerText.includes("select * from")
  ) {
    category = "Technical Knowledge";
    tags = ["SQL", "DBMS", "Database", "Queries", "Backend"];
  } else if (
    lowerFile.includes("system design") || lowerFile.includes("devops") || lowerFile.includes("microservices") ||
    lowerText.includes("load balancer") || lowerText.includes("distributed systems")
  ) {
    category = "Technical Knowledge";
    tags = ["System Design", "Architecture", "DevOps", "Scalability", "Backend"];
  } else if (
    lowerFile.includes("operating system") || lowerFile.includes("os notes") || lowerFile.includes("networking") ||
    lowerFile.includes("computer network") || lowerText.includes("tcp/ip") || lowerText.includes("process scheduling")
  ) {
    category = "Technical Knowledge";
    tags = ["Operating Systems", "Networking", "Computer Science", "Core CS"];
  } else if (
    lowerFile.includes("javascript") || lowerFile.includes("node") || lowerFile.includes("nextjs") ||
    lowerFile.includes("react") || lowerFile.includes("html") || lowerFile.includes("css") ||
    lowerFile.includes("python") || lowerFile.includes("git")
  ) {
    category = "Technical Knowledge";
    tags = ["Web Development", "Programming", "Frontend", "Backend"];
  } else if (/[\u0900-\u097F]/.test(extractedText) || /[\u0900-\u097F]/.test(filename)) {
    category = "Hindi Literature";
    tags = ["Hindi Literature", "Sahitya", "Classic"];
  }

  // 7. Resolve Author & Title
  let author = isOsho ? "Osho" : "Reader's HUB";
  if (!isOsho && metaAuthor && metaAuthor.trim().length > 2 && !metaAuthor.includes("Unknown")) {
    author = metaAuthor.trim();
  }

  // Non-Osho author extraction heuristics if still default
  if (!isOsho && (author === "Reader's HUB" || author === "Unknown")) {
    if (/bertrand\s*russell/i.test(filename) || /bertrand\s*russell/i.test(extractedText)) {
      author = "Bertrand Russell";
    } else if (/nietzsche/i.test(filename) || /nietzsche/i.test(extractedText)) {
      author = "Friedrich Nietzsche";
    } else if (/ernest\s*becker/i.test(filename) || /ernest\s*becker/i.test(extractedText) || /denial\s*of\s*death/i.test(filename)) {
      author = "Ernest Becker";
    } else if (/benjamin\s*graham/i.test(filename) || /benjamin\s*graham/i.test(extractedText)) {
      author = "Benjamin Graham";
    } else if (filename.includes(" - ")) {
      const parts = filename.replace(/\.pdf$/i, "").split(" - ");
      if (parts.length === 2 && parts[1].trim().length > 2) {
        author = parts[1].replace(/([a-z])([A-Z])/g, "$1 $2").trim();
        author = author.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
      }
    }
  }

  // Title generation
  let title = "";
  if (isOsho) {
    // Check for Devanagari title on page 1
    const devanagariMatch = extractedText.match(/[\u0900-\u097F\s]{3,40}/);
    let devanagariTitle = devanagariMatch ? devanagariMatch[0].trim() : "";
    
    // Clean discourse boilerplate
    devanagariTitle = devanagariTitle
      .replace(/प्र\s*[वविि]चन\s*[-–—:]*\s*\d*/g, "")
      .replace(/अ[नुि]?\s*क्\s*रा?म?/g, "")
      .replace(/अनुक्रम/g, "")
      .replace(/प्र\s*विन/g, "")
      .trim();

    if (devanagariTitle.includes("मैं") || devanagariTitle.includes("दो कि")) {
      devanagariTitle = devanagariTitle.split(/\s+(?:मैं|दो\s+कि)/)[0].trim();
    }

    // Clean english base
    let base = filename
      .replace(/\.pdf$/i, "")
      .replace(/ByOsho/gi, "")
      .replace(/Osho/gi, "")
      .replace(/Lect\s*ALL/gi, "Complete Lectures")
      .replace(/200Translated\s*Letters\s*Source\s*Info/gi, "Letters Collection")
      .replace(/Source\s*Info/gi, "")
      .replace(/Only\s*Chapter\s*\d+/gi, "")
      .replace(/And\s*Question\s*\d+\s*Chapter\s*\d+/gi, "")
      .replace(/Translation\s*s\s*Misc/gi, "Translated Discourses Miscellaneous")
      .replace(/Translation/gi, "");
    base = base.replace(/([a-z])([A-Z])/g, "$1 $2").trim();
    if (base === "s Misc" || base === "Misc") {
      base = "Translated Discourses & Miscellaneous";
    }

    if (devanagariTitle && devanagariTitle.length >= 3) {
      title = `${base} (${devanagariTitle})`;
    } else {
      title = base;
    }
  } else {
    let base = filename.replace(/\.pdf$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2").trim();
    if (base.includes(" - ")) {
      base = base.split(" - ")[0].trim();
    }
    if (/bertrand\s*russell/i.test(base)) {
      base = base.replace(/bertrand\s*russell\s*[-–—]*/i, "").replace(/routledge\s*\d*/i, "").trim();
    }
    if (/beyond\s*good\s*and\s*evil/i.test(base) || /beyondgoodevil/i.test(filename)) {
      base = "Beyond Good and Evil";
    }
    if (/denial\s*of\s*death/i.test(base)) {
      base = "The Denial of Death";
    }
    if (/intelligent\s*investor/i.test(base)) {
      base = "The Intelligent Investor";
    }
    if (metaTitle && metaTitle.trim().length > 3 && !metaTitle.includes("Untitled") && !metaTitle.includes(".pdf")) {
      let cleanMetaTitle = metaTitle.trim();
      if (/beyond\s*good\s*and\s*evil/i.test(cleanMetaTitle)) {
        cleanMetaTitle = "Beyond Good and Evil";
      } else if (/denial\s*of\s*death/i.test(cleanMetaTitle)) {
        cleanMetaTitle = "The Denial of Death";
      } else if (/intelligent\s*investor/i.test(cleanMetaTitle)) {
        cleanMetaTitle = "The Intelligent Investor";
      }
      title = cleanMetaTitle;
    } else {
      title = base;
    }
  }

  const isHindi = /[\u0900-\u097F]/.test(title) || /[\u0900-\u097F]/.test(extractedText) || category === "Hindi Literature";
  const language = isHindi ? "Hindi" : "English";

  const description = isOsho
    ? `ओशो द्वारा दिए गए आत्म-ज्ञान और आंतरिक सत्य के अन्वेषण पर गहन अमृत प्रवचनों का संकलन।`
    : `Comprehensive high-yield study material covering core concepts, patterns, and practical reference.`;

  const excerpt = isOsho
    ? `सत्य वह नहीं जो दूसरों से सुना जाए; सत्य वह है जो स्वयं की आँखों से साक्षात् देखा और अनुभूत किया जाए।`
    : `Master essential principles and practical patterns with clear structured notes.`;

  return {
    title,
    author,
    category,
    resourceType,
    language,
    year: new Date().getFullYear(),
    rating: 4.8,
    pageCount,
    description,
    excerpt,
    tags,
    isOsho,
    isInvalid: false,
    needsReview: false,
  };
}
