import fs from "fs";
import path from "path";
import sharp from "sharp";
import { IngestCandidate } from "./types";

export interface CoverPalette {
  bg1: string;
  bg2: string;
  accent: string;
  emblem: string;
  badge: string;
}

export interface CoverPalette {
  bg1: string;
  bg2: string;
  accent: string;
  emblem: string;
  badge: string;
  borderStyle?: "victorian" | "technical" | "romantic" | "ornate" | "minimal";
}

export function getCoverPalette(
  category: string,
  isOsho: boolean,
  resourceType?: string,
  title: string = "",
  author: string = ""
): CoverPalette {
  const lowerTitle = title.toLowerCase();
  const lowerAuthor = author.toLowerCase();

  // 1. Specific Book Personalities
  if (lowerTitle.includes("kurukshetra")) {
    return {
      bg1: "#450a0a",
      bg2: "#7f1d1d",
      accent: "#facc15",
      emblem: "⚔️",
      badge: "राष्ट्रकवि दिनकर काव्य",
      borderStyle: "ornate",
    };
  }

  if (lowerTitle.includes("tyagpatra") || lowerTitle.includes("tyag-patra")) {
    return {
      bg1: "#431407",
      bg2: "#7c2d12",
      accent: "#fdba74",
      emblem: "✒️",
      badge: "उपन्यास सम्राट जैनेंद्र",
      borderStyle: "ornate",
    };
  }

  if (lowerTitle.includes("shekhar") || lowerTitle.includes("sekhar")) {
    return {
      bg1: "#1e1b4b",
      bg2: "#312e81",
      accent: "#fbbf24",
      emblem: "🌅",
      badge: "अज्ञेय कालजयी उपन्यास",
      borderStyle: "ornate",
    };
  }

  if (lowerTitle.includes("jane eyre")) {
    return {
      bg1: "#064e3b",
      bg2: "#022c22",
      accent: "#fde047",
      emblem: "🕊️",
      badge: "VICTORIAN CLASSIC",
      borderStyle: "victorian",
    };
  }

  if (lowerTitle.includes("me before you")) {
    return {
      bg1: "#4c0519",
      bg2: "#881337",
      accent: "#fda4af",
      emblem: "🌸",
      badge: "CONTEMPORARY ROMANCE",
      borderStyle: "romantic",
    };
  }

  if (lowerTitle.includes("the notebook")) {
    return {
      bg1: "#7c2d12",
      bg2: "#9a3412",
      accent: "#fed7aa",
      emblem: "💌",
      badge: "TIMELESS ROMANCE",
      borderStyle: "romantic",
    };
  }

  if (lowerTitle.includes("time traveler")) {
    return {
      bg1: "#0f172a",
      bg2: "#311042",
      accent: "#67e8f9",
      emblem: "⌛",
      badge: "ROMANTIC FICTION",
      borderStyle: "romantic",
    };
  }

  if (lowerTitle.includes("pragmatic programmer")) {
    return {
      bg1: "#0f172a",
      bg2: "#082f49",
      accent: "#38bdf8",
      emblem: "⚡",
      badge: "SOFTWARE CRAFTSMANSHIP",
      borderStyle: "technical",
    };
  }

  if (lowerTitle.includes("refactoring")) {
    return {
      bg1: "#0f172a",
      bg2: "#064e3b",
      accent: "#4ade80",
      emblem: "⟳",
      badge: "CODE DESIGN PATTERNS",
      borderStyle: "technical",
    };
  }

  if (lowerTitle.includes("clean architecture")) {
    return {
      bg1: "#090d16",
      bg2: "#1e1b4b",
      accent: "#a78bfa",
      emblem: "🏛️",
      badge: "SYSTEM ARCHITECTURE",
      borderStyle: "technical",
    };
  }

  if (lowerTitle.includes("clean code")) {
    return {
      bg1: "#0b0f19",
      bg2: "#022c22",
      accent: "#34d399",
      emblem: "💻",
      badge: "SOFTWARE CRAFTSMANSHIP",
      borderStyle: "technical",
    };
  }

  // 2. Category Level Fallbacks
  if (isOsho || category === "Philosophy & Spirituality") {
    return {
      bg1: "#1e1b4b",
      bg2: "#3b0764",
      accent: "#fbbf24",
      emblem: "🪔",
      badge: "SPIRITUAL DISCOURSE",
      borderStyle: "ornate",
    };
  }

  if (category === "Classics") {
    return {
      bg1: "#1c1917",
      bg2: "#292524",
      accent: "#fef08a",
      emblem: "🏛️",
      badge: "LITERARY CLASSIC",
      borderStyle: "victorian",
    };
  }

  if (category === "Romance") {
    return {
      bg1: "#500724",
      bg2: "#831843",
      accent: "#fbcfe8",
      emblem: "🌹",
      badge: "ROMANTIC EDITION",
      borderStyle: "romantic",
    };
  }

  if (category === "Technical Knowledge") {
    if (resourceType === "HandwrittenNotes") {
      return {
        bg1: "#0f172a",
        bg2: "#1e293b",
        accent: "#f59e0b",
        emblem: "✍️",
        badge: "HANDWRITTEN NOTES",
        borderStyle: "technical",
      };
    }
    if (resourceType === "CheatSheet") {
      return {
        bg1: "#064e3b",
        bg2: "#022c22",
        accent: "#34d399",
        emblem: "⚡",
        badge: "QUICK CHEAT SHEET",
        borderStyle: "technical",
      };
    }
    if (resourceType === "InterviewPrep") {
      return {
        bg1: "#172554",
        bg2: "#1e1b4b",
        accent: "#60a5fa",
        emblem: "🎯",
        badge: "INTERVIEW PREPARATION",
        borderStyle: "technical",
      };
    }
    return {
      bg1: "#0f172a",
      bg2: "#111827",
      accent: "#10b981",
      emblem: "💻",
      badge: "TECHNICAL REFERENCE",
      borderStyle: "technical",
    };
  }

  if (category === "Hindi Literature") {
    return {
      bg1: "#451a03",
      bg2: "#78350f",
      accent: "#f59e0b",
      emblem: "🪔",
      badge: "HINDI LITERATURE",
      borderStyle: "ornate",
    };
  }

  if (category === "Self-Development & Psychology") {
    return {
      bg1: "#134e4a",
      bg2: "#115e59",
      accent: "#2dd4bf",
      emblem: "🧠",
      badge: "SELF-DEVELOPMENT",
      borderStyle: "minimal",
    };
  }

  return {
    bg1: "#1e293b",
    bg2: "#0f172a",
    accent: "#93c5fd",
    emblem: "📖",
    badge: "EDITORIAL EDITION",
    borderStyle: "minimal",
  };
}

function escapeXml(unsafe: string): string {
  return (unsafe || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapTitle(text: string, maxLen: number = 24): string[] {
  if (text.length <= maxLen) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= maxLen) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length === 2) break;
    }
  }
  if (currentLine && lines.length < 3) lines.push(currentLine);
  return lines;
}

export async function generateBookCover(candidate: IngestCandidate, outputPath: string): Promise<boolean> {
  // If cover already exists and is non-empty, skip regeneration
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    return true;
  }

  const { title, author, category, resourceType, tags } = candidate;
  const isOsho = /osho/i.test(author) || /osho/i.test(title);
  const palette = getCoverPalette(category, isOsho, resourceType, title, author);

  const hindiMatch = title.match(/\((.*?)\)/);
  const hindiTitle = hindiMatch ? hindiMatch[1] : "";
  const engTitle = title.replace(/\(.*?\)/, "").trim();

  const titleLines = wrapTitle(hindiTitle || engTitle, hindiTitle ? 20 : 22);
  const safeSubtitle = escapeXml(hindiTitle ? engTitle : (tags[0] || category));
  const safeTagLine = escapeXml(isOsho ? "आत्म-ज्ञान एवं ध्यान प्रवचन" : (tags.slice(0, 3).join(" • ") || category));
  const safeAuthor = escapeXml(author.toUpperCase());
  const safeBadge = escapeXml(palette.badge);

  // Calculate dynamic title vertical positioning based on line count
  const titleStartY = titleLines.length === 1 ? 365 : titleLines.length === 2 ? 345 : 330;
  const lineHeight = 38;

  const svg = `
    <svg width="600" height="900" viewBox="0 0 600 900" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${palette.bg1}" />
          <stop offset="100%" stop-color="${palette.bg2}" />
        </linearGradient>
        <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="50%" stop-color="${palette.accent}" />
          <stop offset="100%" stop-color="${palette.accent}" />
        </linearGradient>
      </defs>

      <!-- Background -->
      <rect width="600" height="900" fill="url(#bgGrad)" />

      <!-- Ornate Frame Border -->
      <rect x="25" y="25" width="550" height="850" rx="16" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="2" />
      <rect x="35" y="35" width="530" height="830" rx="12" fill="none" stroke="${palette.accent}" stroke-opacity="0.35" stroke-width="1.5" />

      <!-- Header Badge -->
      <g transform="translate(300, 90)">
        <rect x="-100" y="-18" width="200" height="36" rx="18" fill="rgba(255,255,255,0.08)" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="1" />
        <text text-anchor="middle" y="6" font-family="sans-serif" font-size="13" font-weight="700" fill="${palette.accent}" letter-spacing="2">READER'S HUB</text>
      </g>

      <!-- Emblem Icon -->
      <g transform="translate(300, 205)">
        <circle r="44" fill="rgba(255,255,255,0.05)" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="1.5" />
        <circle r="52" fill="none" stroke="${palette.accent}" stroke-opacity="0.2" stroke-dasharray="4,4" />
        <text text-anchor="middle" y="16" font-size="40">${palette.emblem}</text>
      </g>

      <!-- Main Title (Multi-line with perfect balance) -->
      ${titleLines
        .map(
          (line, idx) => `
        <text x="300" y="${titleStartY + idx * lineHeight}" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Mangal', serif, sans-serif" font-size="${titleLines.length > 1 ? 27 : 31}" font-weight="bold" fill="#ffffff" letter-spacing="0.5">
          ${escapeXml(line)}
        </text>`
        )
        .join("")}

      <!-- Subtitle -->
      <text x="300" y="${titleStartY + titleLines.length * lineHeight + 25}" text-anchor="middle" font-family="serif, sans-serif" font-size="18" font-style="italic" fill="rgba(255,255,255,0.85)">
        ${safeSubtitle}
      </text>

      <!-- Divider Ornament -->
      <g transform="translate(300, ${titleStartY + titleLines.length * lineHeight + 65})">
        <line x1="-120" y1="0" x2="120" y2="0" stroke="${palette.accent}" stroke-opacity="0.6" stroke-width="1.5" />
        <polygon points="0,-6 6,0 0,6 -6,0" fill="${palette.accent}" />
      </g>

      <!-- Tag Line -->
      <text x="300" y="${titleStartY + titleLines.length * lineHeight + 115}" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="500" fill="rgba(255,255,255,0.75)" letter-spacing="1">
        ${safeTagLine}
      </text>

      <!-- Author Section -->
      <g transform="translate(300, 725)">
        <text text-anchor="middle" y="-22" font-family="sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="3">
          ${isOsho ? "DISCOURSES BY" : "WRITTEN BY"}
        </text>
        <text text-anchor="middle" y="18" font-family="serif, sans-serif" font-size="${author.length > 20 ? 24 : 32}" font-weight="bold" fill="url(#accentGrad)" letter-spacing="2">
          ${safeAuthor}
        </text>
        ${isOsho ? `<text text-anchor="middle" y="48" font-family="sans-serif" font-size="13" font-weight="500" fill="${palette.accent}" opacity="0.9" letter-spacing="1.5">BHAGWAN SHREE RAJNEESH</text>` : ""}
      </g>

      <!-- Footer Category Badge -->
      <g transform="translate(300, 830)">
        <rect x="-115" y="-14" width="230" height="28" rx="14" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <text text-anchor="middle" y="5" font-family="sans-serif" font-size="10.5" font-weight="600" fill="rgba(255,255,255,0.85)" letter-spacing="1">
          ${safeBadge}
        </text>
      </g>
    </svg>
  `;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
  return true;
}

