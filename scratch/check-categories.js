const fs = require('fs');
const path = require('path');
const books = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'books.json'), 'utf8'));

const catCounts = {};
for (const b of books) {
  catCounts[b.category] = (catCounts[b.category] || 0) + 1;
}

console.log("Existing categories and counts in books.json:");
console.log(catCounts);

