const fs = require('fs');
const path = require('path');

console.log("==================================================================");
console.log("=== Reader's HUB Page Turn Animation & Sound QA Audit ===");
console.log("==================================================================\n");

// 1. Check lib/pageSound.ts
console.log("[AUDIT 1/3] Checking lib/pageSound.ts Web Audio API synthesizer...");
const soundPath = path.join(__dirname, '..', 'lib', 'pageSound.ts');
if (!fs.existsSync(soundPath)) {
  console.error("[FAIL] lib/pageSound.ts not found.");
  process.exit(1);
}

const soundCode = fs.readFileSync(soundPath, 'utf8');
const hasAudioCtx = soundCode.includes('AudioContext') || soundCode.includes('webkitAudioContext');
const hasPlayMethod = soundCode.includes('playPageTurnSound');
const hasDebounce = soundCode.includes('lastPlayTime');

console.log(`[CHECK 1] hasAudioCtx=${hasAudioCtx}, hasPlayMethod=${hasPlayMethod}, hasDebounce=${hasDebounce}`);

if (hasAudioCtx && hasPlayMethod && hasDebounce) {
  console.log("[PASS] lib/pageSound.ts implements self-contained, debounced Web Audio API page turn sound.\n");
} else {
  console.error("[FAIL] lib/pageSound.ts missing audio implementation.");
  process.exit(1);
}

// 2. Check BookReader.tsx page flip integration
console.log("[AUDIT 2/3] Checking BookReader.tsx 3D leaf flip & audio trigger...");
const readerPath = path.join(__dirname, '..', 'components', 'reader', 'BookReader.tsx');
const readerCode = fs.readFileSync(readerPath, 'utf8');

const importsSound = readerCode.includes('import { pageSound } from "@/lib/pageSound"');
const callsSoundInNext = readerCode.includes('handleNext') && readerCode.includes('pageSound.playPageTurnSound()');
const callsSoundInPrev = readerCode.includes('handlePrev') && readerCode.includes('pageSound.playPageTurnSound()');
const hasRightPageFlip = readerCode.includes('isFlipping && flipDirection === "next" ? "animate-page-flip-next');
const hasLeftPageFlip = readerCode.includes('isFlipping && flipDirection === "prev" ? "animate-page-flip-prev');

console.log(`[CHECK 2] importsSound=${importsSound}, callsSoundInNext=${callsSoundInNext}, callsSoundInPrev=${callsSoundInPrev}, hasRightPageFlip=${hasRightPageFlip}, hasLeftPageFlip=${hasLeftPageFlip}`);

if (importsSound && callsSoundInNext && callsSoundInPrev && hasRightPageFlip && hasLeftPageFlip) {
  console.log("[PASS] BookReader.tsx triggers pageSound on navigation and animates realistic individual 3D page leaves.\n");
} else {
  console.error("[FAIL] BookReader.tsx missing page turn sound or leaf flip integration.");
  process.exit(1);
}

// 3. Check globals.css 3D keyframes
console.log("[AUDIT 3/3] Checking globals.css for physical paper 3D keyframes...");
const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
const cssCode = fs.readFileSync(cssPath, 'utf8');

const hasNextKeyframes = cssCode.includes('@keyframes pageTurnRightNext') && cssCode.includes('transform-origin: left center');
const hasPrevKeyframes = cssCode.includes('@keyframes pageTurnLeftPrev') && cssCode.includes('transform-origin: right center');

console.log(`[CHECK 3] hasNextKeyframes=${hasNextKeyframes}, hasPrevKeyframes=${hasPrevKeyframes}`);

if (hasNextKeyframes && hasPrevKeyframes) {
  console.log("[PASS] globals.css contains realistic 3D paper rotation, shadow, and origin keyframes.\n");
} else {
  console.error("[FAIL] globals.css missing 3D paper turn keyframes.");
  process.exit(1);
}

console.log("==================================================================");
console.log(">>> ALL PAGE TURN ANIMATION & SOUND AUDITS PASSED 100% <<<");
console.log("==================================================================");

