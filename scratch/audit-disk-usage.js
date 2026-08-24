const fs = require('fs');
const path = require('path');

function getDirSize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const f of files) {
      const full = path.join(dirPath, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        size += getDirSize(full);
      } else {
        size += stat.size;
      }
    }
  } catch (e) {}
  return size;
}

const root = path.join(__dirname, '..');
const entries = fs.readdirSync(root);

console.log("=== ROOT DIRECTORY SIZES ===");
for (const e of entries) {
  const full = path.join(root, e);
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const sz = getDirSize(full);
    console.log(`DIR:  ${e.padEnd(20)} ${(sz / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.log(`FILE: ${e.padEnd(20)} ${(stat.size / 1024).toFixed(2)} KB`);
  }
}

console.log("\n=== PUBLIC SUBDIRECTORIES ===");
const pub = path.join(root, 'public');
for (const e of fs.readdirSync(pub)) {
  const full = path.join(pub, e);
  const stat = fs.statSync(full);
  if (stat.isDirectory()) {
    const sz = getDirSize(full);
    console.log(`DIR:  ${e.padEnd(20)} ${(sz / (1024 * 1024)).toFixed(2)} MB`);
  } else {
    console.log(`FILE: ${e.padEnd(20)} ${(stat.size / 1024).toFixed(2)} KB`);
  }
}

