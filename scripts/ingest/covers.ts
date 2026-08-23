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

export function getCoverPalette(category: string, isOsho: boolean, resourceType?: string): CoverPalette {
  if (isOsho || category === "Philosophy & Spirituality") {
    return {
      bg1: "#1e1b4b",
      bg2: "#3b0764",
      accent: "#fbbf24",
      emblem: "🪔",
      badge: "SPIRITUAL DISCOURSE",
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
      };
    }
    if (resourceType === "CheatSheet") {
      return {
        bg1: "#064e3b",
        bg2: "#022c22",
        accent: "#34d399",
        emblem: "⚡",
        badge: "QUICK CHEAT SHEET",
      };
    }
    if (resourceType === "InterviewPrep") {
      return {
        bg1: "#172554",
        bg2: "#1e1b4b",
        accent: "#60a5fa",
        emblem: "🎯",
        badge: "INTERVIEW PREPARATION",
      };
    }
    return {
      bg1: "#0f172a",
      bg2: "#111827",
      accent: "#10b981",
      emblem: "💻",
      badge: "TECHNICAL REFERENCE",
    };
  }

  if (category === "Hindi Literature") {
    return {
      bg1: "#451a03",
      bg2: "#78350f",
      accent: "#f59e0b",
      emblem: "🪔",
      badge: "HINDI LITERATURE",
    };
  }

  if (category === "Self-Development & Psychology") {
    return {
      bg1: "#134e4a",
      bg2: "#115e59",
      accent: "#2dd4bf",
      emblem: "🧠",
      badge: "SELF-DEVELOPMENT",
    };
  }

  return {
    bg1: "#1e293b",
    bg2: "#0f172a",
    accent: "#93c5fd",
    emblem: "📖",
    badge: "EDITORIAL EDITION",
  };
}

export async function generateBookCover(candidate: IngestCandidate, outputPath: string): Promise<boolean> {
  // If cover already exists and is non-empty, skip regeneration
  if (fs.existsSync(outputPath) && fs.statSync(outputPath).size > 1000) {
    return true;
  }

  const { title, author, category, resourceType, tags } = candidate;
  const isOsho = /osho/i.test(author) || /osho/i.test(title);
  const palette = getCoverPalette(category, isOsho, resourceType);

  const hindiMatch = title.match(/\((.*?)\)/);
  const hindiTitle = hindiMatch ? hindiMatch[1] : "";
  const engTitle = title.replace(/\(.*?\)/, "").trim();

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
      <g transform="translate(300, 220)">
        <circle r="48" fill="rgba(255,255,255,0.05)" stroke="${palette.accent}" stroke-opacity="0.4" stroke-width="1.5" />
        <circle r="56" fill="none" stroke="${palette.accent}" stroke-opacity="0.2" stroke-dasharray="4,4" />
        <text text-anchor="middle" y="16" font-size="44">${palette.emblem}</text>
      </g>

      <!-- Main Title (Devanagari / English) -->
      <text x="300" y="360" text-anchor="middle" font-family="'Noto Sans Devanagari', 'Mangal', serif, sans-serif" font-size="${hindiTitle ? 32 : 30}" font-weight="bold" fill="#ffffff" letter-spacing="1">
        ${hindiTitle || engTitle.substring(0, 32)}
      </text>

      <!-- Subtitle -->
      <text x="300" y="415" text-anchor="middle" font-family="serif, sans-serif" font-size="20" font-style="italic" fill="rgba(255,255,255,0.85)">
        ${hindiTitle ? engTitle.substring(0, 36) : (tags[0] || category)}
      </text>

      <!-- Divider Ornament -->
      <g transform="translate(300, 460)">
        <line x1="-120" y1="0" x2="120" y2="0" stroke="${palette.accent}" stroke-opacity="0.6" stroke-width="1.5" />
        <polygon points="0,-6 6,0 0,6 -6,0" fill="${palette.accent}" />
      </g>

      <!-- Subtitle / Tag Line -->
      <text x="300" y="520" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="500" fill="rgba(255,255,255,0.75)" letter-spacing="1">
        ${isOsho ? "आत्म-ज्ञान एवं ध्यान प्रवचन" : (tags.slice(0, 3).join(" • ") || category)}
      </text>

      <!-- Author Section -->
      <g transform="translate(300, 720)">
        <text text-anchor="middle" y="-25" font-family="sans-serif" font-size="12" font-weight="600" fill="rgba(255,255,255,0.6)" letter-spacing="3">
          ${isOsho ? "DISCOURSES BY" : "CURATED BY"}
        </text>
        <text text-anchor="middle" y="20" font-family="serif, sans-serif" font-size="${author.length > 15 ? 28 : 36}" font-weight="bold" fill="url(#accentGrad)" letter-spacing="2">
          ${author.toUpperCase()}
        </text>
        ${isOsho ? `<text text-anchor="middle" y="52" font-family="sans-serif" font-size="13" font-weight="500" fill="${palette.accent}" opacity="0.9" letter-spacing="1.5">BHAGWAN SHREE RAJNEESH</text>` : ""}
      </g>

      <!-- Footer Category Badge -->
      <g transform="translate(300, 830)">
        <rect x="-100" y="-14" width="200" height="28" rx="14" fill="rgba(0,0,0,0.35)" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
        <text text-anchor="middle" y="5" font-family="sans-serif" font-size="11" font-weight="600" fill="rgba(255,255,255,0.8)" letter-spacing="1">
          ${palette.badge}
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

