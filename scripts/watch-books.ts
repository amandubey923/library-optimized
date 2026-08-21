import chokidar from "chokidar";
import path from "path";
import fs from "fs";
import { importAllBooks } from "./import-books";

const PDF_DIR = path.join(process.cwd(), "public", "pdfs");

if (!fs.existsSync(PDF_DIR)) {
  fs.mkdirSync(PDF_DIR, { recursive: true });
}

console.log("\n=======================================================");
console.log("  👀 READER'S HUB — PDF DIRECTORY WATCHER ACTIVE");
console.log(`  📂 Watching folder: ${PDF_DIR}`);
console.log("  👉 Drop any new PDF into 'public/pdfs/' for instant registration!");
console.log("=======================================================\n");

let debounceTimer: NodeJS.Timeout | null = null;

const watcher = chokidar.watch(path.join(PDF_DIR, "*.pdf"), {
  persistent: true,
  ignoreInitial: true, // Only trigger for new additions
  awaitWriteFinish: {
    stabilityThreshold: 1500,
    pollInterval: 200,
  },
});

watcher.on("add", (filePath) => {
  console.log(`\n🔔 New PDF detected in public/pdfs/: ${path.basename(filePath)}`);
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    importAllBooks().catch((err) => console.error("Auto-import error:", err));
  }, 1000);
});

watcher.on("error", (error) => console.error(`Watcher error: ${error}`));
