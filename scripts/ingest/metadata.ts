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

  // 3. Extract text from first 2 pages using PDFParse (fast & non-blocking)
  let extractedText = "";
  try {
    const parsePromise = (async () => {
      const parser = new PDFParse({ data: fileBuffer });
      const textResult = await parser.getText();
      const txt = textResult?.text ? textResult.text.replace(/\s+/g, " ").trim().substring(0, 800) : "";
      await parser.destroy();
      return txt;
    })();

    const timeoutPromise = new Promise<string>((resolve) => setTimeout(() => resolve(""), 1500));
    extractedText = await Promise.race([parsePromise, timeoutPromise]);
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
  } else if (/jane\s*eyre/i.test(filename) || /charlotte\s*bront/i.test(filename) || /charlotte\s*bront/i.test(extractedText)) {
    category = "Classics";
    tags = ["Classic Literature", "Victorian Literature", "Gothic Romance", "British Classics"];
  } else if (/me\s*before\s*you/i.test(filename) || /the\s*notebook/i.test(filename) || /time.*traveler/i.test(filename) || /nicholas\s*sparks/i.test(filename) || /jojo\s*moyes/i.test(filename)) {
    category = "Romance";
    tags = ["Romance", "Contemporary Fiction", "Emotional", "Bestseller", "Love Story"];
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
    /clean[\s_-]*code/i.test(filename) || /clean[\s_-]*architecture/i.test(filename) || /refactoring/i.test(filename) ||
    /pragmatic[\s_-]*programmer/i.test(filename) || /design[\s_-]*pattern/i.test(filename) || /software[\s_-]*engineering/i.test(filename) ||
    lowerText.includes("clean architecture") || lowerText.includes("refactoring") || lowerText.includes("software craftsmanship")
  ) {
    category = "Technical Knowledge";
    tags = ["OOP & Software Design", "Software Architecture", "Clean Code", "Best Practices", "Technical Knowledge"];
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
  } else if (
    lowerFile.includes("kurukshetra") || lowerFile.includes("tyag-patra") || lowerFile.includes("sekhar") || lowerFile.includes("shekhar") ||
    /[\u0900-\u097F]/.test(extractedText) || /[\u0900-\u097F]/.test(filename)
  ) {
    category = "Hindi Literature";
    tags = ["Hindi Literature", "Sahitya", "Classic", "Hindi Novel"];
  }

  // 7. Resolve Author & Title
  let author = isOsho ? "Osho" : "Reader's HUB";
  if (!isOsho && metaAuthor && metaAuthor.trim().length > 2 && !metaAuthor.includes("Unknown") && !metaAuthor.includes("Microsoft")) {
    author = metaAuthor.trim();
  }

  // Non-Osho author extraction heuristics
  if (!isOsho && (author === "Reader's HUB" || author === "Unknown" || author.includes("Microsoft"))) {
    if (/kurukshetra/i.test(filename) || /dinker|dinkar/i.test(filename)) {
      author = "Ramdhari Singh 'Dinkar'";
    } else if (/tyag.*patra/i.test(filename)) {
      author = "Jainendra Kumar";
    } else if (/sekhar|shekhar/i.test(filename)) {
      author = "Sachchidananda Vatsyayan 'Agyeya'";
    } else if (/jane\s*eyre/i.test(filename)) {
      author = "Charlotte Brontë";
    } else if (/me\s*before\s*you/i.test(filename) || /jojo\s*moyes/i.test(filename)) {
      author = "Jojo Moyes";
    } else if (/the\s*notebook/i.test(filename) || /nicholas\s*sparks/i.test(filename)) {
      author = "Nicholas Sparks";
    } else if (/time.*traveler/i.test(filename) || /audrey\s*niffenegger/i.test(filename)) {
      author = "Audrey Niffenegger";
    } else if (/refactoring/i.test(filename) || /martin\s*fowler/i.test(filename) || /martin\s*fowler/i.test(extractedText)) {
      author = "Martin Fowler";
    } else if (/pragmatic\s*programmer/i.test(filename) || /andrew\s*hunt/i.test(filename) || /andrew\s*hunt/i.test(extractedText)) {
      author = "Andrew Hunt & David Thomas";
    } else if (/clean\s*architecture.*realms|clean\s*architecture.*z/i.test(filename)) {
      author = "Benjamin Smith";
    } else if (/clean\s*architecture/i.test(filename) || /robert\s*c\.?\s*martin/i.test(filename) || /uncle\s*bob/i.test(extractedText)) {
      author = "Robert C. Martin";
    } else if (/clean\s*code/i.test(filename) || /robert\s*c\.?\s*martin/i.test(filename) || /robert\s*c\.?\s*martin/i.test(extractedText) || /uncle\s*bob/i.test(extractedText)) {
      author = "Robert C. Martin";
    } else if (/bertrand\s*russell/i.test(filename) || /bertrand\s*russell/i.test(extractedText)) {
      author = "Bertrand Russell";
    } else if (/nietzsche/i.test(filename) || /nietzsche/i.test(extractedText)) {
      author = "Friedrich Nietzsche";
    } else if (/ernest\s*becker/i.test(filename) || /ernest\s*becker/i.test(extractedText) || /denial\s*of\s*death/i.test(filename)) {
      author = "Ernest Becker";
    } else if (/benjamin\s*graham/i.test(filename) || /benjamin\s*graham/i.test(extractedText)) {
      author = "Benjamin Graham";
    } else if (/karen\s*armstrong/i.test(filename) || /karen\s*armstrong/i.test(extractedText)) {
      author = "Karen Armstrong";
    } else if (/henepola\s*gunaratana|bhante\s*gunaratana|eight\s*mindful\s*steps/i.test(filename) || /gunaratana/i.test(extractedText)) {
      author = "Bhante Henepola Gunaratana";
    } else if (/in\s*the\s*words\s*of\s*the\s*buddha|in\s*the\s*buddhas\s*words|bhikkhu\s*bodhi/i.test(filename) || /bhikkhu\s*bodhi/i.test(extractedText)) {
      author = "Bhikkhu Bodhi";
    } else if (/thich\s*nhat\s*hanh|old\s*path\s*white\s*clouds/i.test(filename) || /thich\s*nhat\s*hanh/i.test(extractedText)) {
      author = "Thich Nhat Hanh";
    } else if (/rupert\s*gethin|foundations\s*of\s*buddhism/i.test(filename) || /rupert\s*gethin/i.test(extractedText)) {
      author = "Rupert Gethin";
    } else if (/walpola\s*rahula|what\s*the\s*buddha\s*taught/i.test(filename) || /walpola\s*rahula/i.test(extractedText)) {
      author = "Walpola Rahula";
    } else if (/scrndhamma/i.test(filename) || /dhamma/i.test(filename)) {
      author = "S.N. Goenka";
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
    // Specific title mappings for new batch
    if (/buddha[\s_-]*karen[\s_-]*armstrong/i.test(filename)) {
      title = "Buddha: A Biography";
    } else if (/eight[\s_-]*mindful[\s_-]*steps/i.test(filename)) {
      title = "Eight Mindful Steps to Happiness: Walking the Buddha's Path";
    } else if (/in[\s_-]*the[\s_-]*words[\s_-]*of[\s_-]*the[\s_-]*buddha|in[\s_-]*the[\s_-]*buddhas[\s_-]*words/i.test(filename)) {
      title = "In the Buddha's Words: An Anthology of Discourses from the Pali Canon";
    } else if (/old[\s_-]*path[\s_-]*white[\s_-]*clouds/i.test(filename)) {
      title = "Old Path White Clouds: Walking in the Footsteps of the Buddha";
    } else if (/foundations[\s_-]*of[\s_-]*buddhism/i.test(filename)) {
      title = "The Foundations of Buddhism";
    } else if (/what[\s_-]*the[\s_-]*buddha[\s_-]*taught/i.test(filename)) {
      title = "What the Buddha Taught";
    } else if (/scrndhamma/i.test(filename)) {
      title = "The Essence of Dhamma: Core Teachings & Mindful Reflection";
    } else if (/kurukshetra/i.test(filename)) {
      title = "Kurukshetra (कुरुक्षेत्र)";
    } else if (/tyag.*patra/i.test(filename)) {
      title = "Tyagpatra (त्यागपत्र)";
    } else if (/sekhar|shekhar/i.test(filename)) {
      title = "Shekhar: Ek Jeevani - Vividh Aayam (शेखर: एक जीवनी)";
    } else if (/clean.*architecture.*realms|clean.*architecture.*z/i.test(filename)) {
      title = "Clean Architecture: A Comprehensive Beginner's Guide from A to Z";
    } else if (/clean.*architecture.*principles|clean.*architecture.*understand/i.test(filename)) {
      title = "Clean Architecture: Principles and Patterns";
    } else if (/pragmatic.*programmer/i.test(filename)) {
      title = "The Pragmatic Programmer: Your Journey to Mastery";
    } else if (/refactoring/i.test(filename)) {
      title = "Refactoring: Improving the Design of Existing Code";
    } else if (/me.*before.*you/i.test(filename)) {
      title = "Me Before You";
    } else if (/the.*notebook/i.test(filename)) {
      title = "The Notebook";
    } else if (/time.*traveler/i.test(filename)) {
      title = "The Time Traveler's Wife";
    } else if (/jane.*eyre/i.test(filename)) {
      title = "Jane Eyre";
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
      if (metaTitle && metaTitle.trim().length > 3 && !metaTitle.includes("Untitled") && !metaTitle.includes(".pdf") && !metaTitle.includes("Microsoft Word")) {
        let cleanMetaTitle = metaTitle.trim();
        if (/clean\s*code/i.test(cleanMetaTitle)) {
          cleanMetaTitle = "Clean Code: A Handbook of Agile Software Craftsmanship";
        } else if (/beyond\s*good\s*and\s*evil/i.test(cleanMetaTitle)) {
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
  }

  const isHindi = /[\u0900-\u097F]/.test(title) || /[\u0900-\u097F]/.test(extractedText) || category === "Hindi Literature";
  const language = isHindi ? "Hindi" : "English";

  // Individualized descriptions and excerpts
  let description = isOsho
    ? `ओशो द्वारा दिए गए आत्म-ज्ञान और आंतरिक सत्य के अन्वेषण पर गहन अमृत प्रवचनों का संकलन।`
    : `Comprehensive high-yield study material covering core concepts, patterns, and practical reference.`;

  let excerpt = isOsho
    ? `सत्य वह नहीं जो दूसरों से सुना जाए; सत्य वह है जो स्वयं की आँखों से साक्षात् देखा और अनुभूत किया जाए।`
    : `Master essential principles and practical patterns with clear structured notes.`;

  if (/buddha:\s*a\s*biography/i.test(title)) {
    description = "A profound and accessible biography by acclaimed religious historian Karen Armstrong exploring the life, spiritual quest, and foundational insights of Siddhartha Gautama.";
    excerpt = "The Buddha was convinced that suffering could not be overcome by metaphysical theories or ascetic extremes, but by a radical reorientation of the mind and compassionate action.";
  } else if (/eight\s*mindful\s*steps/i.test(title)) {
    description = "Renowned meditation master Bhante Gunaratana illuminates the Noble Eightfold Path with practical, compassionate guidance for cultivating inner peace and mindful living.";
    excerpt = "Mindfulness is the observant, non-judgmental awareness of what is happening in the present moment, within and around us.";
  } else if (/in\s*the\s*buddha's\s*words/i.test(title)) {
    description = "Bhikkhu Bodhi's essential anthology curating the most vital teachings of the Pali Canon, offering a clear and comprehensive framework of the Buddha's path to liberation.";
    excerpt = "Just as the great ocean has but one taste, the taste of salt, so too this teaching and discipline has but one taste, the taste of liberation.";
  } else if (/old\s*path\s*white\s*clouds/i.test(title)) {
    description = "Thich Nhat Hanh's beloved, poetic retelling of the life and teachings of Gautama Buddha, drawn from original Pali, Sanskrit, and Chinese texts with deep gentleness and clarity.";
    excerpt = "Walk as if you are kissing the Earth with your feet. When we walk like that with every breath, peace becomes a reality.";
  } else if (/the\s*essence\s*of\s*dhamma/i.test(title)) {
    description = "Foundational discourses and practical insights into Vipassana meditation, universal Dhamma, and the art of living in harmony and self-observation.";
    excerpt = "Real peace is within oneself; when the mind is free of craving, aversion, and ignorance, genuine harmony arises.";
  } else if (/the\s*foundations\s*of\s*buddhism/i.test(title)) {
    description = "A standard Oxford University introduction exploring the narrative, philosophical, cosmological, and meditative dimensions of Buddhist traditions.";
    excerpt = "The purpose of Buddhist practice is not simply to contemplate truth, but to transform the mind through understanding and ethics.";
  } else if (/what\s*the\s*buddha\s*taught/i.test(title)) {
    description = "Ven. Dr. Walpola Rahula's world-renowned classic presenting the core doctrines of Buddhism, the Four Noble Truths, and the nature of mind with scholarly precision.";
    excerpt = "Buddhism is neither pessimistic nor optimistic. If anything, it is realistic, for it takes a realistic view of life and of the world.";
  } else if (/kurukshetra/i.test(title)) {
    description = "राष्ट्रकवि रामधारी सिंह 'दिनकर' का कालजयी प्रबंध-काव्य, जिसमें महाभारत के युद्ध के माध्यम से शांति और क्रांति, न्याय और हिंसा के सनातन द्वंद्व पर ओजस्वी विचार व्यक्त किए गए हैं।";
    excerpt = "नर पर नर का अधिकार न हो, कोई न किसी से त्रस्त रहे। सब एक पिता की संतानें, सब एक भाव में मस्त रहें।";
  } else if (/tyagpatra/i.test(title)) {
    description = "उपन्यास सम्राट जैनेंद्र कुमार की सुप्रसिद्ध मनोवैज्ञानिक रचना, जो भारतीय समाज में नारी की स्थिति, त्याग और सामाजिक मर्यादाओं का मर्मस्पर्शी विश्लेषण प्रस्तुत करती है।";
    excerpt = "संसार में त्याग से बड़ा कोई बल नहीं है, लेकिन जब समाज उस त्याग की उपेक्षा करता है तो वह जीवन की त्रासदी बन जाता है।";
  } else if (/shekhar/i.test(title)) {
    description = "सच्चिदानंद हीरानंद वात्स्यायन 'अज्ञेय' की अमर औपन्यासिक कृति 'शेखर: एक जीवनी' के विविध आयामों, विद्रोही चेतना और मनोवैज्ञानिक संरचना पर गंभीर विमर्श।";
    excerpt = "विद्रोह जीवन की सजीवता का प्रमाण है; जो बंधनों को स्वीकार कर लेता है, वह जीने से पहले ही मर जाता है।";
  } else if (/jane\s*eyre/i.test(title)) {
    description = "Charlotte Brontë's masterwork following the emotional and moral journey of an independent, resilient governess at Thornfield Hall.";
    excerpt = "I am no bird; and no net ensnares me; I am a free human being with an independent will, which I now exert to leave you.";
  } else if (/me\s*before\s*you/i.test(title)) {
    description = "Jojo Moyes's heartwarming and heartbreaking bestselling romance chronicling the transformative bond between Louisa Clark and Will Traynor.";
    excerpt = "You only get one life. It's actually your duty to live it as fully as possible.";
  } else if (/the\s*notebook/i.test(title)) {
    description = "Nicholas Sparks's timeless, evocative story of enduring love, devotion, and shared memories across decades between Noah Calhoun and Allie Nelson.";
    excerpt = "I am nothing special, of this I am sure. I am a common man with common thoughts... but I've loved another with all my heart and soul, and to me, this has always been enough.";
  } else if (/time\s*traveler/i.test(title)) {
    description = "Audrey Niffenegger's inventive romantic novel about Henry DeTamble, a librarian with a rare genetic disorder causing him to involuntarily travel through time, and his deep bond with Clare Abshire.";
    excerpt = "I love you, always, time is nothing.";
  } else if (/pragmatic\s*programmer/i.test(title)) {
    description = "The seminal software engineering classic by Andrew Hunt and David Thomas that illustrates the craftsmanship, career philosophy, and practical disciplines of software development.";
    excerpt = "Care About Your Craft. Why spend your life developing software unless you care about doing it well?";
  } else if (/refactoring/i.test(title)) {
    description = "Martin Fowler's foundational guide to improving the internal design and maintainability of existing codebases through systematic code transformation patterns.";
    excerpt = "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.";
  } else if (/clean\s*architecture/i.test(title)) {
    description = "Essential principles and practical structural patterns for building decoupled, testable, and maintainable software systems across diverse environments.";
    excerpt = "The architecture of a software system is the shape given to that system by those who build it.";
  }

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
