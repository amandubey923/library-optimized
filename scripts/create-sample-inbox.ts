import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "fs";
import path from "path";

async function createSamplePdf(filename: string, title: string, author: string, subject: string) {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setAuthor(author);
  doc.setSubject(subject);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([600, 800]);

  page.drawText(title, { x: 50, y: 700, size: 30, font, color: rgb(0.1, 0.1, 0.1) });
  page.drawText(`By ${author}`, { x: 50, y: 650, size: 16, font: regularFont, color: rgb(0.3, 0.3, 0.3) });
  page.drawText(subject, { x: 50, y: 600, size: 12, font: regularFont, color: rgb(0.4, 0.4, 0.4) });

  const pdfBytes = await doc.save();
  const inbox = path.join(process.cwd(), "book-inbox");
  if (!fs.existsSync(inbox)) fs.mkdirSync(inbox, { recursive: true });
  fs.writeFileSync(path.join(inbox, filename), pdfBytes);
  console.log(`Created sample PDF: book-inbox/${filename}`);
}

async function main() {
  await createSamplePdf(
    "The Art of War - Sun Tzu.pdf",
    "The Art of War",
    "Sun Tzu",
    "Ancient Chinese military treatise and strategic philosophy by Sun Tzu."
  );
  await createSamplePdf(
    "Siddhartha - Hermann Hesse.pdf",
    "Siddhartha",
    "Hermann Hesse",
    "A profound spiritual journey of self-discovery and enlightenment set in ancient India."
  );
  await createSamplePdf(
    "Meditations - Marcus Aurelius.pdf",
    "Meditations",
    "Marcus Aurelius",
    "Stoic philosophical reflections on resilience, inner peace, duty, and human virtue."
  );
}

main().catch(console.error);

