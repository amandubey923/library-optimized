const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function escapeXml(str) {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

const technicalItems = [
  {
    id: "basics-of-api-testing",
    titleLines: ["Basics of", "API Testing"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#0f172a", bg2: "#1e293b", accent: "#38bdf8", icon: "🌐" }
  },
  {
    id: "computer-networks-complete-notes",
    titleLines: ["Computer Networks", "Complete Notes"],
    category: "Computer Science & Systems",
    type: "Notes",
    theme: { bg1: "#111827", bg2: "#1f2937", accent: "#60a5fa", icon: "📡" }
  },
  {
    id: "css-complete-reference-notes",
    titleLines: ["CSS Complete", "Reference Notes"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#1e1b4b", bg2: "#312e81", accent: "#818cf8", icon: "🎨" }
  },
  {
    id: "dsa-notes-concepts-made-easy",
    titleLines: ["DSA Notes That", "Make Concepts Easy"],
    category: "DSA & Problem Solving",
    type: "Notes",
    theme: { bg1: "#14532d", bg2: "#166534", accent: "#4ade80", icon: "⚡" }
  },
  {
    id: "git-quick-reference-cheat-sheet",
    titleLines: ["Git & GitHub Quick", "Cheat Sheet"],
    category: "System Design & DevOps",
    type: "CheatSheet",
    theme: { bg1: "#451a03", bg2: "#78350f", accent: "#fb923c", icon: "🌿" }
  },
  {
    id: "html5-complete-reference-notes",
    titleLines: ["HTML5 Complete", "Reference Notes"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#431407", bg2: "#7c2d12", accent: "#f97316", icon: "📄" }
  },
  {
    id: "javascript-core-and-es6-notes",
    titleLines: ["JavaScript Core &", "Modern ES6+ Notes"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#422006", bg2: "#713f12", accent: "#facc15", icon: "⚡" }
  },
  {
    id: "most-useful-sql-practical-notes",
    titleLines: ["Most Useful SQL", "Practical Notes"],
    category: "DBMS & SQL",
    type: "Notes",
    theme: { bg1: "#0c4a6e", bg2: "#075985", accent: "#38bdf8", icon: "🗄️" }
  },
  {
    id: "must-solve-leetcode-problems-striver",
    titleLines: ["Must Solve LeetCode", "Problems Roadmap"],
    category: "DSA & Problem Solving",
    type: "InterviewPrep",
    theme: { bg1: "#581c87", bg2: "#6b21a8", accent: "#c084fc", icon: "🚀" }
  },
  {
    id: "nextjs-complete-architecture-notes",
    titleLines: ["Next.js App Router &", "Architecture Notes"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#09090b", bg2: "#18181b", accent: "#38bdf8", icon: "▲" }
  },
  {
    id: "nodejs-backend-architecture-notes",
    titleLines: ["Node.js Backend &", "Architecture Notes"],
    category: "Web & Backend Development",
    type: "Notes",
    theme: { bg1: "#064e3b", bg2: "#065f46", accent: "#34d399", icon: "🟢" }
  },
  {
    id: "oop-fundamentals-quick-notes",
    titleLines: ["OOP Fundamentals", "Quick Notes"],
    category: "OOP & Software Design",
    type: "Notes",
    theme: { bg1: "#3b0764", bg2: "#581c87", accent: "#d8b4fe", icon: "🧩" }
  },
  {
    id: "oop-comprehensive-guide-book",
    titleLines: ["Object Oriented", "Programming Guide"],
    category: "OOP & Software Design",
    type: "Book",
    theme: { bg1: "#1e1b4b", bg2: "#3730a3", accent: "#a5b4fc", icon: "📘" }
  },
  {
    id: "oop-with-cpp-digital-notes",
    titleLines: ["OOP with C++", "Digital Notes"],
    category: "OOP & Software Design",
    type: "Notes",
    theme: { bg1: "#1e293b", bg2: "#334155", accent: "#94a3b8", icon: "⚙️" }
  },
  {
    id: "oop-in-cpp-handwritten-study-notes",
    titleLines: ["OOP in C++ Handwritten", "Study Notes"],
    category: "OOP & Software Design",
    type: "HandwrittenNotes",
    theme: { bg1: "#2e1065", bg2: "#3b0764", accent: "#e9d5ff", icon: "✍️" }
  },
  {
    id: "operating-systems-university-notes",
    titleLines: ["Operating Systems", "University Notes"],
    category: "Computer Science & Systems",
    type: "Notes",
    theme: { bg1: "#1e3a8a", bg2: "#1e40af", accent: "#93c5fd", icon: "💻" }
  },
  {
    id: "operating-systems-notes-with-diagrams",
    titleLines: ["Operating Systems", "Illustrated Notes"],
    category: "Computer Science & Systems",
    type: "Notes",
    theme: { bg1: "#0f172a", bg2: "#1e3a8a", accent: "#60a5fa", icon: "📊" }
  },
  {
    id: "python-complete-handwritten-notes",
    titleLines: ["Python Complete", "Handwritten Notes"],
    category: "Programming Languages",
    type: "HandwrittenNotes",
    theme: { bg1: "#1e3a8a", bg2: "#14532d", accent: "#facc15", icon: "🐍" }
  },
  {
    id: "sql-top-100-interview-questions",
    titleLines: ["SQL Top 100", "Interview Questions"],
    category: "DBMS & SQL",
    type: "InterviewPrep",
    theme: { bg1: "#164e63", bg2: "#155e75", accent: "#22d3ee", icon: "🎯" }
  },
  {
    id: "system-design-complete-architecture-notes",
    titleLines: ["System Design Complete", "Architecture Notes"],
    category: "System Design & DevOps",
    type: "Notes",
    theme: { bg1: "#18181b", bg2: "#27272a", accent: "#fbbf24", icon: "🏗️" }
  },
  {
    id: "system-design-illustrated-handbook",
    titleLines: ["System Design", "Illustrated Handbook"],
    category: "System Design & DevOps",
    type: "Notes",
    theme: { bg1: "#09090b", bg2: "#1c1917", accent: "#f59e0b", icon: "📐" }
  },
  {
    id: "sql-interview-quick-cheatsheet",
    titleLines: ["SQL Interview Prep", "Quick Cheatsheet"],
    category: "DBMS & SQL",
    type: "CheatSheet",
    theme: { bg1: "#042f2e", bg2: "#115e59", accent: "#2dd4bf", icon: "⚡" }
  }
];

const coversDir = path.join(__dirname, '..', 'public', 'images', 'books');

async function generateCovers() {
  console.log("Generating high-resolution WebP covers for technical collection...");

  for (const item of technicalItems) {
    const outputPath = path.join(coversDir, `${item.id}.webp`);
    
    const tspans = item.titleLines.map((line, idx) => {
      const y = 560 + idx * 45;
      return `<tspan x="300" y="${y}">${escapeXml(line)}</tspan>`;
    }).join('');

    const svg = `<svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${item.theme.bg1}"/>
          <stop offset="100%" stop-color="${item.theme.bg2}"/>
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="${item.theme.accent}"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      
      <rect width="600" height="900" fill="url(#bgGrad)" rx="24"/>
      
      <rect x="0" y="0" width="30" height="900" fill="black" opacity="0.35"/>
      <line x1="30" y1="0" x2="30" y2="900" stroke="rgba(255,255,255,0.08)" stroke-width="2"/>
      
      <g opacity="0.05" stroke="#ffffff" stroke-width="1">
        <line x1="0" y1="150" x2="600" y2="150"/>
        <line x1="0" y1="300" x2="600" y2="300"/>
        <line x1="0" y1="450" x2="600" y2="450"/>
        <line x1="0" y1="600" x2="600" y2="600"/>
        <line x1="0" y1="750" x2="600" y2="750"/>
        <line x1="150" y1="0" x2="150" y2="900"/>
        <line x1="300" y1="0" x2="300" y2="900"/>
        <line x1="450" y1="0" x2="450" y2="900"/>
      </g>
      
      <g transform="translate(60, 70)">
        <rect x="0" y="0" width="160" height="32" rx="16" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.15)"/>
        <text x="80" y="21" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="${item.theme.accent}" text-anchor="middle" letter-spacing="1.5">READER&apos;S HUB</text>
      </g>
      
      <g transform="translate(420, 70)">
        <rect x="0" y="0" width="120" height="32" rx="16" fill="${item.theme.accent}" opacity="0.2"/>
        <rect x="0" y="0" width="120" height="32" rx="16" fill="none" stroke="${item.theme.accent}" stroke-width="1.5"/>
        <text x="60" y="21" font-family="Arial, Helvetica, sans-serif" font-size="11" font-weight="bold" fill="${item.theme.accent}" text-anchor="middle">${escapeXml(item.type.toUpperCase())}</text>
      </g>
      
      <g transform="translate(230, 230)">
        <rect x="0" y="0" width="140" height="140" rx="36" fill="rgba(255,255,255,0.06)" stroke="${item.theme.accent}" stroke-width="2" opacity="0.9"/>
        <text x="70" y="85" font-size="64" text-anchor="middle" dominant-baseline="central">${item.theme.icon}</text>
      </g>
      
      <text x="300" y="470" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="${item.theme.accent}" text-anchor="middle" letter-spacing="2">${escapeXml(item.category.toUpperCase())}</text>
      
      <text font-family="Georgia, Times New Roman, serif" font-size="34" font-weight="bold" fill="#ffffff" text-anchor="middle">
        ${tspans}
      </text>
      
      <rect x="60" y="780" width="480" height="2" fill="url(#accentGrad)" opacity="0.6"/>
      <text x="300" y="825" font-family="Arial, Helvetica, sans-serif" font-size="13" font-weight="bold" fill="rgba(255,255,255,0.6)" text-anchor="middle">Curated Technical &amp; Engineering Library</text>
    </svg>`;

    await sharp(Buffer.from(svg))
      .webp({ quality: 90 })
      .toFile(outputPath);

    console.log(`[OK] Generated: ${item.id}.webp`);
  }

  console.log("\nAll 22 covers generated successfully!");
}

generateCovers().catch(console.error);

