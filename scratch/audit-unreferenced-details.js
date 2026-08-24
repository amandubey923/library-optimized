const fs = require('fs');
const path = require('path');

const booksTs = fs.readFileSync(path.join(__dirname, '..', 'data', 'books.ts'), 'utf-8');
const coverMatches = booksTs.match(/cover:\s*"([^"]+)"/g) || [];
const pdfMatches = booksTs.match(/pdf:\s*"([^"]+)"/g) || [];

const usedCovers = new Set(coverMatches.map(m => m.replace(/cover:\s*"/, '').replace(/"/, '')));
const usedPdfs = new Set(pdfMatches.map(m => m.replace(/pdf:\s*"/, '').replace(/"/, '')));

const imgDir = path.join(__dirname, '..', 'public', 'images', 'books');
const diskImages = fs.readdirSync(imgDir);

console.log("=== UNREFERENCED COVERS in public/images/books ===");
let totalCoverBytes = 0;
for (const img of diskImages) {
  const relPath = `/images/books/${img}`;
  if (!usedCovers.has(relPath)) {
    const stat = fs.statSync(path.join(imgDir, img));
    totalCoverBytes += stat.size;
    console.log(`  ${img} (${(stat.size / 1024).toFixed(1)} KB)`);
  }
}
console.log(`Total unreferenced covers: ${(totalCoverBytes / 1024).toFixed(1)} KB`);

console.log("\n=== UNREFERENCED PDFS in public/pdfs ===");
const pdfDir = path.join(__dirname, '..', 'public', 'pdfs');
const diskPdfs = fs.readdirSync(pdfDir);
let totalPdfBytes = 0;
for (const pdf of diskPdfs) {
  const relPath = `/pdfs/${pdf}`;
  if (!usedPdfs.has(relPath)) {
    const stat = fs.statSync(path.join(pdfDir, pdf));
    totalPdfBytes += stat.size;
    console.log(`  ${pdf} (${(stat.size / (1024 * 1024)).toFixed(2)} MB)`);
  }
}
console.log(`Total unreferenced PDFs: ${(totalPdfBytes / (1024 * 1024)).toFixed(2)} MB`);

