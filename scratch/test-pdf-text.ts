import fs from 'fs';
import path from 'path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

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

async function run() {
  for (let i = 0; i < technicalFiles.length; i++) {
    const filename = technicalFiles[i];
    const fullPath = path.join(pdfsDir, filename);
    const data = new Uint8Array(fs.readFileSync(fullPath));
    const doc = await pdfjs.getDocument({ data }).promise;
    
    let text = "";
    const maxPages = Math.min(3, doc.numPages);
    for (let p = 1; p <= maxPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((it: any) => it.str).join(" ") + " ";
    }
    const clean = text.replace(/\s+/g, ' ').trim();
    console.log(`----------------------------------------------------------------`);
    console.log(`${i+1}. [${filename}] | Pages: ${doc.numPages} | Chars: ${clean.length}`);
    console.log(`Snippet: "${clean.slice(0, 300)}"`);
  }
}

run().catch(console.error);

