const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
const booksJsonPath = path.join(__dirname, '..', 'data', 'books.json');
const books = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));

const existingPdfSet = new Set(books.map(b => b.pdf.replace('/pdfs/', '')));
const allPdfFiles = fs.readdirSync(pdfsDir);
const newPdfFiles = allPdfFiles.filter(f => !existingPdfSet.has(f));

async function analyzePdfs() {
  console.log(`Analyzing ${newPdfFiles.length} new PDF files...\n`);
  const results = [];

  for (const filename of newPdfFiles) {
    const filePath = path.join(pdfsDir, filename);
    const stats = fs.statSync(filePath);
    const item = {
      filename,
      sizeBytes: stats.size,
      sizeMB: (stats.size / 1024 / 1024).toFixed(2),
      isEmpty: stats.size === 0,
      pages: 0,
      textLength: 0,
      sampleText: "",
      info: {}
    };

    if (stats.size > 0) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const parsed = await pdfParse(dataBuffer);
        item.pages = parsed.numpages;
        item.textLength = parsed.text.length;
        item.sampleText = parsed.text.replace(/\s+/g, ' ').trim().slice(0, 400);
        item.info = parsed.info || {};
      } catch (err) {
        item.parseError = err.message;
      }
    }
    results.push(item);
  }

  results.forEach((r, idx) => {
    console.log(`================================================================`);
    console.log(`${idx + 1}. Filename: "${r.filename}"`);
    console.log(`   Size: ${r.sizeMB} MB | Pages: ${r.pages} | TextChars: ${r.textLength} | Empty: ${r.isEmpty}`);
    if (r.info && Object.keys(r.info).length > 0) {
      console.log(`   Info: Title="${r.info.Title || ''}", Author="${r.info.Author || ''}", Subject="${r.info.Subject || ''}"`);
    }
    console.log(`   Sample: "${r.sampleText.slice(0, 200)}..."`);
  });

  fs.writeFileSync(path.join(__dirname, 'new-pdfs-analysis.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved full analysis to scratch/new-pdfs-analysis.json`);
}

analyzePdfs().catch(console.error);

