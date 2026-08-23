const fs = require("fs");
const path = require("path");
const { PDFParse } = require("pdf-parse");

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

async function extractAll() {
  for (let i = 0; i < oshoFiles.length; i++) {
    const filename = oshoFiles[i];
    const fullPath = path.join(pdfsDir, filename);
    const buffer = fs.readFileSync(fullPath);

    try {
      const parser = new PDFParse({ data: buffer });
      await parser.load();
      const textResult = await parser.getText();
      const clean = textResult ? textResult.text.replace(/\s+/g, " ").trim().substring(0, 300) : "";
      console.log(`[${i + 1}/24] ${filename}`);
      console.log(`   "${clean.substring(0, 160)}..."\n`);
      await parser.destroy();
    } catch (e) {
      console.warn(`Error on ${filename}:`, e.message);
    }
  }
}

extractAll().catch(console.error);

