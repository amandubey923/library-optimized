const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

const pdfsDir = path.join(__dirname, '..', 'public', 'pdfs');

const technicalFiles = [
  "Basics of API Testing.pdf",
  "COMPUTER NETWORKS NOTES.pdf",
  "CSS Notes.pdf",
  "DSA Notes That Make Concepts Easy.pdf",
  "git-cheat-sheet-education.pdf",
  "htmlnotes.pdf",
  "JS Notes.pdf",
  "Most Useful SQL Notes  (1).pdf",
  "Must Solve Leetcode bu Striver.pdf",
  "Next JS Notes.pdf",
  "Node JS Notes.pdf",
  "Object Oriented Programming.pdf",
  "OOPS BOOK.pdf",
  "OOPS C++.pdf",
  "oops_in_c++_hand_written_notes.pdf",
  "Operating System Notes.pdf",
  "OPERATING SYSTEMS  NOTES  (diagram).pdf",
  "python handwritten notes.pdf",
  "Sql 100 Interview Ques .pdf",
  "System design complete notes .pdf",
  "System Design.pdf",
  "👉 SQL Notes for Interview Preparation.pdf"
];

async function deepInspectTechnical() {
  const reports = [];

  for (const filename of technicalFiles) {
    const fullPath = path.join(pdfsDir, filename);
    const dataBuffer = fs.readFileSync(fullPath);
    let numPages = 0;
    let text = "";
    let isScanned = false;

    try {
      const parsed = await pdfParse(dataBuffer);
      numPages = parsed.numpages;
      text = parsed.text || "";
      const cleanText = text.replace(/\s+/g, ' ').trim();
      isScanned = cleanText.length < 50 && numPages > 2; // Scanned / image-only check

      reports.push({
        filename,
        pages: numPages,
        charCount: cleanText.length,
        isScanned,
        first500Chars: cleanText.slice(0, 500),
        info: parsed.info || {}
      });
    } catch (e) {
      reports.push({
        filename,
        error: e.message
      });
    }
  }

  reports.forEach((r, i) => {
    console.log(`================================================================`);
    console.log(`${i+1}. [${r.filename}] (Pages: ${r.pages}, Chars: ${r.charCount}, Scanned/Handwritten: ${r.isScanned})`);
    console.log(`Snippet: "${r.first500Chars}"\n`);
  });

  fs.writeFileSync(path.join(__dirname, 'technical-detailed.json'), JSON.stringify(reports, null, 2));
}

deepInspectTechnical().catch(console.error);

