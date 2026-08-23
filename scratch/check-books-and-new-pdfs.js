const fs = require('fs');
const path = require('path');

const booksJsonPath = path.join(__dirname, '..', 'data', 'books.json');
const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');

const books = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));
console.log(`Total books in books.json: ${books.length}`);

const existingPdfSet = new Set(books.map(b => b.pdf.replace('/pdfs/', '')));
const allPdfFiles = fs.readdirSync(pdfsDir);

console.log(`Total files in public/pdfs: ${allPdfFiles.length}`);

const existingFoundOnDisk = [];
const existingMissingOnDisk = [];
const newPdfsOnDisk = [];

for (const book of books) {
  const filename = book.pdf.replace('/pdfs/', '');
  if (fs.existsSync(path.join(pdfsDir, filename))) {
    existingFoundOnDisk.push(filename);
  } else {
    existingMissingOnDisk.push({ id: book.id, title: book.title, pdf: book.pdf });
  }
}

for (const file of allPdfFiles) {
  if (!existingPdfSet.has(file)) {
    newPdfsOnDisk.push(file);
  }
}

console.log(`Existing books found in public/pdfs: ${existingFoundOnDisk.length}`);
console.log(`Existing books missing in public/pdfs: ${existingMissingOnDisk.length}`);
if (existingMissingOnDisk.length > 0) {
  console.log("Missing existing books:", existingMissingOnDisk);
}

console.log(`\nNew PDFs on disk to be integrated (${newPdfsOnDisk.length}):`);
newPdfsOnDisk.forEach((f, idx) => {
  const stats = fs.statSync(path.join(pdfsDir, f));
  console.log(`${idx + 1}. [${(stats.size / 1024 / 1024).toFixed(2)} MB] "${f}"`);
});

