const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");
const pdfParse = require("pdf-parse");

const pdfsDir = path.join(__dirname, "../public/pdfs");

const oshoFiles = [
  "AankhonDekhiSanchByOsho.pdf",
  "AapuiGaiHeraiByOsho.pdf",
  "AdhyatamUpanishadByOsho.pdf",
  "AgyatKiOrByOsho.pdf",
  "AjhoonChetGanwarByOsho.pdf",
  "AkathKahaniPremKiByOsho.pdf",
  "AmiJharatBigsatKanwalByOsho.pdf",
  "AmritDwarByOsho.pdf",
  "AmritKanByOsho.pdf",
  "AmritKiDishaByOsho.pdf",
  "AmritVarshaByOsho.pdf",
  "AnahadMeinBisramByOsho.pdf",
  "AnandGangaByOsho.pdf",
  "AnandKiKhojByOsho.pdf",
  "AnantKiPukarByOsho.pdf",
  "AndhakarSeAlokKeeOrOnlyChapter1TranslationByOsho.pdf",
  "AntarKiKhojByOsho.pdf",
  "AntarveenaByOsho.pdf",
  "AntarYatraByOsho.pdf",
  "ApneMahiTatolByOsho.pdf",
  "AriMainToNaamKeRangChhakiByOsho.pdf",
  "AsambhavKrantiByOsho.pdf",
  "AshtavakraMahageetaByOsho.pdf",
  "AswikratiMeinUthaHathByOsho.pdf",
];

async function analyzeAll() {
  console.log("Analyzing 24 Osho Hindi PDFs...\n");
  const results = [];

  for (let i = 0; i < oshoFiles.length; i++) {
    const filename = oshoFiles[i];
    const fullPath = path.join(pdfsDir, filename);
    const buffer = fs.readFileSync(fullPath);

    let pageCount = 0;
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      pageCount = pdfDoc.getPageCount();
    } catch (e) {
      console.warn(`Error pdf-lib on ${filename}:`, e.message);
    }

    let parsedText = "";
    try {
      const parsed = await pdfParse(buffer, { max: 3 });
      parsedText = parsed.text ? parsed.text.trim().substring(0, 500) : "";
    } catch (e) {
      console.warn(`Error pdf-parse on ${filename}:`, e.message);
    }

    const item = {
      index: i + 1,
      filename,
      pageCount,
      snippet: parsedText.replace(/\s+/g, " "),
    };
    results.push(item);
    console.log(`${i + 1}. [${pageCount} pgs] ${filename}`);
    console.log(`   Sample text: "${item.snippet.substring(0, 150)}..."\n`);
  }

  fs.writeFileSync(
    path.join(__dirname, "osho-analysis.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("Saved analysis to scratch/osho-analysis.json");
}

analyzeAll().catch(console.error);

