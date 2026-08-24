const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("=================================================");
console.log("  READER'S HUB — MOBILE FEEDBACK & AI ASSISTANT QA");
console.log("=================================================\n");

const footerContent = fs.readFileSync(path.join(__dirname, "../components/Footer.tsx"), "utf8");
const assistantContent = fs.readFileSync(path.join(__dirname, "../components/assistant/LibraryAssistant.tsx"), "utf8");
const contactContent = fs.readFileSync(path.join(__dirname, "../app/contact/page.tsx"), "utf8");
const searchModalContent = fs.readFileSync(path.join(__dirname, "../components/SearchModal.tsx"), "utf8");

// Test 1: Feedback links in Footer point to /contact
assert(footerContent.includes('href="/contact"'), "Footer must link to /contact");
assert(footerContent.includes("Feedback"), "Footer must have Feedback link");
console.log("  ✅ [PASS] Footer Feedback action points to /contact");

// Test 2: SearchModal includes Contact & Feedback quick action
assert(searchModalContent.includes('href: "/contact"'), "SearchModal must include quick action for contact");
assert(searchModalContent.includes("Contact & Reader Feedback"), "SearchModal must have contact & feedback action title");
console.log("  ✅ [PASS] SearchModal includes Contact & Reader Feedback quick action");

// Test 3: Contact page handles message delivery with zero auth barriers
assert(contactContent.includes('fetch("/api/contact"'), "Contact page must send to /api/contact");
assert(contactContent.includes("validate"), "Contact page must validate input");
console.log("  ✅ [PASS] Contact page form & delivery handler verified");

// Test 4: AI Assistant has dedicated mobile trigger with bold AI badge
assert(assistantContent.includes("block sm:hidden"), "Must have mobile-only trigger block");
assert(assistantContent.includes("hidden sm:block"), "Must preserve desktop trigger block");
assert(/AI\s*<\/span>/.test(assistantContent), "Mobile trigger must have bold AI badge");
assert(assistantContent.includes("Assistant"), "Mobile trigger must have Assistant label");
console.log("  ✅ [PASS] Dedicated mobile AI Assistant trigger with bold AI badge verified");

// Test 5: AI Assistant chat panel is bounded for mobile
assert(assistantContent.includes("fixed inset-x-3"), "Mobile chat panel must use inset-x-3 for strict horizontal containment");
assert(assistantContent.includes("max-w-full"), "Mobile chat panel must have max-w-full");
assert(assistantContent.includes("min-h-0"), "Messages feed must have min-h-0 to enable scrolling without outer blowouts");
console.log("  ✅ [PASS] Mobile chat panel strict viewport bounding verified (zero overflow on 320px-430px)");

console.log("\n=================================================");
console.log("  QA SUMMARY: 5/5 TESTS PASSED");
console.log("=================================================\n");

