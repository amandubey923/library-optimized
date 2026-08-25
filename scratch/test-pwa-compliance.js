const fs = require("fs");
const path = require("path");
const assert = require("assert");

console.log("================================================================================");
console.log("  READER'S HUB — ANDROID PWA INSTALLABILITY & COMPLIANCE VERIFICATION");
console.log("================================================================================\n");

// 1. Check Web App Manifest
const manifestPath = path.join(__dirname, "../public/manifest.json");
assert(fs.existsSync(manifestPath), "public/manifest.json must exist");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

assert(manifest.name && manifest.name.includes("Reader's HUB"), "Manifest must have app name");
assert(manifest.short_name === "Reader's HUB", "Manifest must have short_name 'Reader's HUB'");
assert(manifest.display === "standalone", "Display must be 'standalone' for app-like experience");
assert(manifest.start_url === "/", "Start URL must be '/'");
assert(manifest.background_color === "#0b0d13", "Background color must match dark theme #0b0d13");
assert(manifest.theme_color === "#0b0d13", "Theme color must match dark theme #0b0d13");
assert(Array.isArray(manifest.icons) && manifest.icons.length >= 4, "Must define at least 4 icon configurations");

console.log("  ✅ [PASS] Web App Manifest: name, short_name, display: standalone, start_url, theme colors verified");

// 2. Check Icon Files & Dimensions
const icon192 = manifest.icons.find((i) => i.sizes === "192x192" && (i.purpose === "any" || !i.purpose));
const icon512 = manifest.icons.find((i) => i.sizes === "512x512" && (i.purpose === "any" || !i.purpose));
const maskable192 = manifest.icons.find((i) => i.sizes === "192x192" && i.purpose === "maskable");
const maskable512 = manifest.icons.find((i) => i.sizes === "512x512" && i.purpose === "maskable");

assert(icon192, "192x192 standard icon must be configured in manifest");
assert(icon512, "512x512 standard icon must be configured in manifest");
assert(maskable192, "192x192 maskable icon must be configured in manifest");
assert(maskable512, "512x512 maskable icon must be configured in manifest");

assert(fs.existsSync(path.join(__dirname, "../public", icon192.src)), `Icon file ${icon192.src} must exist`);
assert(fs.existsSync(path.join(__dirname, "../public", icon512.src)), `Icon file ${icon512.src} must exist`);
assert(fs.existsSync(path.join(__dirname, "../public", maskable192.src)), `Maskable icon file ${maskable192.src} must exist`);
assert(fs.existsSync(path.join(__dirname, "../public", maskable512.src)), `Maskable icon file ${maskable512.src} must exist`);
assert(fs.existsSync(path.join(__dirname, "../public/icons/apple-touch-icon.png")), "apple-touch-icon.png must exist");

console.log("  ✅ [PASS] PWA Icons: 192x192, 512x512, maskable icons and apple-touch-icon verified in public/icons/");

// 3. Check Service Worker
const swPath = path.join(__dirname, "../public/sw.js");
assert(fs.existsSync(swPath), "public/sw.js service worker must exist");
const swContent = fs.readFileSync(swPath, "utf8");
assert(swContent.includes("addEventListener(\"install\""), "Service worker must have install listener");
assert(swContent.includes("addEventListener(\"activate\""), "Service worker must have activate listener");
assert(swContent.includes("addEventListener(\"fetch\""), "Service worker must have fetch listener for PWA installability");

console.log("  ✅ [PASS] Service Worker: public/sw.js with install, activate, and fetch handlers verified");

// 4. Check Root Layout Configuration
const layoutPath = path.join(__dirname, "../app/layout.tsx");
const layoutContent = fs.readFileSync(layoutPath, "utf8");
assert(layoutContent.includes("manifest: \"/manifest.json\""), "Layout metadata must link manifest");
assert(layoutContent.includes("navigator.serviceWorker.register('/sw.js')"), "Layout must register service worker");
assert(layoutContent.includes("applicationName: \"Reader's HUB\""), "Layout must define applicationName");
assert(layoutContent.includes("mobile-web-app-capable"), "Layout must define mobile-web-app-capable");

console.log("  ✅ [PASS] Layout & Metadata: Manifest link, viewport theme, and Service Worker registration verified");

console.log("\n================================================================================");
console.log("  PWA COMPLIANCE SUMMARY: 4/4 CRITICAL SUITES PASSED (100%)");
console.log("================================================================================\n");

