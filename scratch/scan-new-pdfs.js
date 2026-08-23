const fs = require('fs');
const path = require('path');

const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
const booksPath = path.join(__dirname, '..', 'data', 'books.ts');

const pdfFiles = fs.readdirSync(pdfsDir);
console.log(`Total files in public/pdfs: ${pdfFiles.length}`);

const booksCode = fs.readFileSync(booksPath, 'utf8');

// Find all existing PDF references in books.ts
const existingPdfRefs = new Set();
const pdfRegex = /pdf:\s*["']\/pdfs\/([^"']+)["']/g;
let match;
while ((match = pdfRegex.exec(booksCode)) !== null) {
  existingPdfRefs.add(match[1]);
}

console.log(`Existing referenced PDFs in books.ts: ${existingPdfRefs.size}`);

const newPdfs = [];
const existingMatched = [];

for (const file of pdfFiles) {
  if (existingPdfRefs.has(file)) {
    existingMatched.push(file);
  } else {
    const fullPath = path.join(pdfsDir, file);
    const stats = fs.statSync(fullPath);
    newPdfs.push({
      filename: file,
      sizeBytes: stats.size,
      sizeMB: (stats.size / (1024 * 1024)).toFixed(2)
    });
  }
}

console.log(`Existing matched PDFs: ${existingMatched.length}`);
console.log(`New / Unreferenced PDFs: ${newPdfs.length}`);

console.log("\n--- NEW PDFS FOUND ---");
newPdfs.forEach((p, idx) => {
  console.log(`${idx + 1}. [${p.sizeMB} MB] ${p.filename}`);
});

