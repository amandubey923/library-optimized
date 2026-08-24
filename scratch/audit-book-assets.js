const fs = require('fs');
const path = require('path');

const booksJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'books.json'), 'utf-8'));

const usedCovers = new Set(booksJson.map(b => b.cover));
const usedPdfs = new Set(booksJson.map(b => b.pdf));

console.log(`Indexed in books.json: ${booksJson.length} books (${usedCovers.size} unique covers, ${usedPdfs.size} unique PDFs)`);

// Check public/images/books
const imgDir = path.join(__dirname, '..', 'public', 'images', 'books');
const diskImages = fs.readdirSync(imgDir);

const unreferencedImages = [];
let totalCoverBytes = 0;
for (const img of diskImages) {
  const relPath = `/images/books/${img}`;
  if (!usedCovers.has(relPath)) {
    const stat = fs.statSync(path.join(imgDir, img));
    totalCoverBytes += stat.size;
    unreferencedImages.push({ name: img, size: stat.size });
  }
}

console.log(`\nUnreferenced covers in public/images/books: ${unreferencedImages.length} (${(totalCoverBytes / 1024).toFixed(1)} KB)`);
unreferencedImages.forEach(item => {
  console.log(`  - ${item.name} (${(item.size / 1024).toFixed(1)} KB)`);
});

// Check public/pdfs
const pdfDir = path.join(__dirname, '..', 'public', 'pdfs');
const diskPdfs = fs.readdirSync(pdfDir);

const unreferencedPdfs = [];
let totalPdfBytes = 0;
for (const pdf of diskPdfs) {
  const relPath = `/pdfs/${pdf}`;
  if (!usedPdfs.has(relPath)) {
    const stat = fs.statSync(path.join(pdfDir, pdf));
    totalPdfBytes += stat.size;
    unreferencedPdfs.push({ name: pdf, size: stat.size });
  }
}

console.log(`\nUnreferenced PDFs in public/pdfs: ${unreferencedPdfs.length} (${(totalPdfBytes / (1024 * 1024)).toFixed(2)} MB)`);
unreferencedPdfs.forEach(item => {
  console.log(`  - ${item.name} (${(item.size / (1024 * 1024)).toFixed(2)} MB)`);
});

