const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');
const booksJsonPath = path.join(__dirname, '..', 'data', 'books.json');
const books = JSON.parse(fs.readFileSync(booksJsonPath, 'utf8'));

const existingPdfSet = new Set(books.map(b => b.pdf.replace('/pdfs/', '')));
const allPdfFiles = fs.readdirSync(pdfsDir);
const newPdfFiles = allPdfFiles.filter(f => !existingPdfSet.has(f));

async function analyzeWithPdfLib() {
  console.log(`Analyzing ${newPdfFiles.length} new PDF files with pdf-lib...\n`);
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
      title: "",
      author: "",
      subject: "",
      creator: "",
      producer: ""
    };

    if (stats.size > 0) {
      try {
        const bytes = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        item.pages = pdfDoc.getPageCount();
        item.title = pdfDoc.getTitle() || "";
        item.author = pdfDoc.getAuthor() || "";
        item.subject = pdfDoc.getSubject() || "";
        item.creator = pdfDoc.getCreator() || "";
        item.producer = pdfDoc.getProducer() || "";
      } catch (err) {
        item.error = err.message;
      }
    }
    results.push(item);
  }

  results.forEach((r, idx) => {
    console.log(`----------------------------------------------------------------`);
    console.log(`${idx + 1}. Filename: "${r.filename}"`);
    console.log(`   Size: ${r.sizeMB} MB | Pages: ${r.pages} | Empty: ${r.isEmpty}`);
    if (r.title || r.author || r.subject) {
      console.log(`   Metadata: Title="${r.title}", Author="${r.author}", Subject="${r.subject}"`);
    }
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });

  fs.writeFileSync(path.join(__dirname, 'new-pdfs-pdflib.json'), JSON.stringify(results, null, 2));
  console.log(`\nSaved analysis to scratch/new-pdfs-pdflib.json`);
}

analyzeWithPdfLib().catch(console.error);

