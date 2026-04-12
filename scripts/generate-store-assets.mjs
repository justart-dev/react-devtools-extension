import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";

const execFileAsync = promisify(execFile);
const chromeBinary =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "store-assets", "renewal-2025");
const sourceDir = path.join(outputDir, "sources");

const assetPath = (relativePath) =>
  pathToFileURL(path.join(rootDir, relativePath)).href;

const assets = {
  cat: assetPath("public/assets/logo.png"),
  astronaut: assetPath("public/assets/space.png"),
  screenshotConsole: assetPath("public/assets/screenshot1.png"),
  screenshotNetwork: assetPath("public/assets/screenshot2.png"),
  screenshotStash: assetPath("public/assets/screenshot3.png"),
};

const writeSvg = async (name, content) => {
  const svgPath = path.join(sourceDir, `${name}.svg`);
  await fs.writeFile(svgPath, content, "utf8");
  return svgPath;
};

const renderPng = async (svgPath, pngName, width, height, resizeTo) => {
  const targetPng = path.join(outputDir, pngName);
  const sourceUrl = pathToFileURL(svgPath).href;

  await execFileAsync(chromeBinary, [
    "--headless",
    "--disable-gpu",
    "--hide-scrollbars",
    `--window-size=${width},${height}`,
    `--screenshot=${targetPng}`,
    sourceUrl,
  ]);

  if (resizeTo) {
    await execFileAsync("sips", [
      "-z",
      String(resizeTo.height),
      String(resizeTo.width),
      targetPng,
    ]);
  }
};

const baseStyles = `
  .eyebrow { font: 600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; letter-spacing: 0.18em; text-transform: uppercase; fill: #8eb8ff; }
  .title { font: 700 60px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f5f7fb; }
  .titleCompact { font: 700 46px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f5f7fb; }
  .subtitle { font: 400 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #9aa8bb; }
  .body { font: 500 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #cfdae8; }
  .pill { font: 700 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #f5f7fb; }
  .metric { font: 600 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; fill: #9aa8bb; }
`;

const shellCard = (x, y, w, h, imageHref) => `
  <g transform="translate(${x} ${y})">
    <rect width="${w}" height="${h}" rx="28" fill="url(#panelBg)" stroke="rgba(255,255,255,0.08)" />
    <rect x="0" y="0" width="${w}" height="68" rx="28" fill="#10161f" />
    <circle cx="30" cy="34" r="7" fill="#ff5f56" />
    <circle cx="54" cy="34" r="7" fill="#ffbd2e" />
    <circle cx="78" cy="34" r="7" fill="#27c93f" />
    <rect x="18" y="86" width="${w - 36}" height="${h - 104}" rx="20" fill="#0b1016" />
    <image href="${imageHref}" x="18" y="86" width="${w - 36}" height="${h - 104}" preserveAspectRatio="xMidYMid meet" />
  </g>
`;

const bullet = (x, y, color, label) => `
  <g transform="translate(${x} ${y})">
    <circle cx="10" cy="10" r="10" fill="${color}" fill-opacity="0.2" />
    <circle cx="10" cy="10" r="4" fill="${color}" />
    <text x="32" y="17" class="body">${label}</text>
  </g>
`;

const iconSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#111723" />
      <stop offset="60%" stop-color="#0a0f16" />
      <stop offset="100%" stop-color="#06080d" />
    </linearGradient>
    <radialGradient id="iconGlow" cx="38%" cy="34%" r="65%">
      <stop offset="0%" stop-color="#7eb4ff" stop-opacity="0.42" />
      <stop offset="100%" stop-color="#7eb4ff" stop-opacity="0" />
    </radialGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
  </defs>
  <rect width="512" height="512" rx="124" fill="url(#iconBg)" />
  <circle cx="198" cy="176" r="154" fill="url(#iconGlow)" />
  <circle cx="206" cy="214" r="116" fill="none" stroke="#f5f7fb" stroke-width="28" />
  <path d="M160 115 L188 62 L222 117" fill="none" stroke="#f5f7fb" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M233 117 L267 62 L294 115" fill="none" stroke="#f5f7fb" stroke-width="22" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M291 294 L374 377" fill="none" stroke="#f5f7fb" stroke-width="28" stroke-linecap="round" />
  <path d="M375 377 L436 438" fill="none" stroke="#7eb4ff" stroke-width="28" stroke-linecap="round" filter="url(#softGlow)" opacity="0.9" />
  <circle cx="206" cy="214" r="18" fill="#7eb4ff" opacity="0.95" />
  <circle cx="250" cy="214" r="18" fill="#7eb4ff" opacity="0.95" />
  <path d="M198 246 Q228 270 258 246" fill="none" stroke="#7eb4ff" stroke-width="18" stroke-linecap="round" />
</svg>
`;

const marqueeSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="560" viewBox="0 0 1400 560">
  <defs>
    <linearGradient id="marqueeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1017" />
      <stop offset="55%" stop-color="#0a1118" />
      <stop offset="100%" stop-color="#05070b" />
    </linearGradient>
    <linearGradient id="panelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131b26" />
      <stop offset="100%" stop-color="#0b1118" />
    </linearGradient>
    <radialGradient id="blueBurst" cx="28%" cy="22%" r="52%">
      <stop offset="0%" stop-color="#69a7ff" stop-opacity="0.32" />
      <stop offset="100%" stop-color="#69a7ff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="amberBurst" cx="74%" cy="36%" r="48%">
      <stop offset="0%" stop-color="#f2c66d" stop-opacity="0.2" />
      <stop offset="100%" stop-color="#f2c66d" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-20%" y="-20%" width="160%" height="160%">
      <feDropShadow dx="0" dy="24" stdDeviation="22" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
    <style>${baseStyles}</style>
  </defs>
  <rect width="1400" height="560" fill="url(#marqueeBg)" />
  <rect width="1400" height="560" fill="url(#blueBurst)" />
  <rect width="1400" height="560" fill="url(#amberBurst)" />
  <circle cx="1160" cy="106" r="132" fill="#69a7ff" fill-opacity="0.08" />
  <circle cx="1222" cy="410" r="164" fill="#f2c66d" fill-opacity="0.06" />
  <text x="96" y="136" class="eyebrow">Chrome Extension</text>
  <text x="96" y="224" class="title">Taillog</text>
  <text x="96" y="276" class="subtitle">A compact debug panel for console, network, stash, and locator workflows.</text>
  ${bullet(96, 328, "#69a7ff", "Monitor logs and requests without leaving the page")}
  ${bullet(96, 382, "#5cbb7a", "Save copied snippets for quick reuse")}
  ${bullet(96, 436, "#f2c66d", "Use the renewed dark UI with fast tab switching")}
  <g transform="translate(870 72)" filter="url(#shadow)">
    <rect width="440" height="416" rx="34" fill="url(#panelBg)" stroke="rgba(255,255,255,0.08)" />
    <rect x="24" y="24" width="392" height="50" rx="16" fill="#111823" />
    <circle cx="54" cy="49" r="6" fill="#ff5f56" />
    <circle cx="76" cy="49" r="6" fill="#ffbd2e" />
    <circle cx="98" cy="49" r="6" fill="#27c93f" />
    <image href="${assets.screenshotNetwork}" x="24" y="92" width="392" height="232" preserveAspectRatio="xMidYMid meet" />
    <rect x="24" y="344" width="178" height="48" rx="16" fill="#151d28" />
    <text x="49" y="374" class="pill">Network monitor</text>
    <rect x="220" y="344" width="196" height="48" rx="16" fill="#151d28" />
    <text x="245" y="374" class="pill">Bilingual interface</text>
  </g>
  <image href="${assets.astronaut}" x="688" y="82" width="186" height="186" preserveAspectRatio="xMidYMid meet" />
</svg>
`;

const screenshotOverviewSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1017" />
      <stop offset="60%" stop-color="#091018" />
      <stop offset="100%" stop-color="#05070b" />
    </linearGradient>
    <linearGradient id="panelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131b26" />
      <stop offset="100%" stop-color="#0b1118" />
    </linearGradient>
    <radialGradient id="leftGlow" cx="20%" cy="18%" r="46%">
      <stop offset="0%" stop-color="#69a7ff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#69a7ff" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="rightGlow" cx="84%" cy="22%" r="42%">
      <stop offset="0%" stop-color="#f2c66d" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#f2c66d" stop-opacity="0" />
    </radialGradient>
    <style>${baseStyles}</style>
  </defs>
  <rect width="1280" height="800" fill="url(#screenBg)" />
  <rect width="1280" height="800" fill="url(#leftGlow)" />
  <rect width="1280" height="800" fill="url(#rightGlow)" />
  <text x="84" y="110" class="eyebrow">Store Preview 01</text>
  <text x="84" y="180" class="titleCompact">
    <tspan x="84" dy="0">Inspect page activity</tspan>
    <tspan x="84" dy="54">faster</tspan>
  </text>
  <text x="84" y="270" class="subtitle">Renewed layout for live debugging, quick stash access, and element lookup.</text>
  ${bullet(84, 326, "#69a7ff", "Readable console and network streams")}
  ${bullet(84, 378, "#5cbb7a", "Quick stash for copied text")}
  ${bullet(84, 430, "#f2c66d", "Locator mode for element lookup")}
  ${shellCard(624, 110, 580, 540, assets.screenshotNetwork)}
  <image href="${assets.astronaut}" x="104" y="470" width="228" height="228" preserveAspectRatio="xMidYMid meet" opacity="0.95" />
  <rect x="356" y="542" width="188" height="52" rx="18" fill="#131b26" stroke="rgba(255,255,255,0.08)" />
  <text x="388" y="576" class="pill">Renewed 2.0 UI</text>
</svg>
`;

const screenshotConsoleSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#081019" />
      <stop offset="100%" stop-color="#05070b" />
    </linearGradient>
    <linearGradient id="panelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131b26" />
      <stop offset="100%" stop-color="#0b1118" />
    </linearGradient>
    <style>${baseStyles}</style>
  </defs>
  <rect width="1280" height="800" fill="url(#screenBg)" />
  <circle cx="980" cy="160" r="180" fill="#69a7ff" fill-opacity="0.12" />
  <circle cx="1080" cy="620" r="210" fill="#5cbb7a" fill-opacity="0.08" />
  <text x="84" y="110" class="eyebrow">Store Preview 02</text>
  <text x="84" y="180" class="titleCompact">
    <tspan x="84" dy="0">Watch console activity</tspan>
    <tspan x="84" dy="54">without DevTools</tspan>
  </text>
  <text x="84" y="270" class="subtitle">Keep logs visible in a clean popup while you reproduce issues.</text>
  ${bullet(84, 326, "#69a7ff", "Filter levels fast")}
  ${bullet(84, 378, "#5cbb7a", "Open in a larger popup window")}
  ${bullet(84, 430, "#f2c66d", "Low-noise dark layout")}
  ${shellCard(520, 92, 684, 592, assets.screenshotConsole)}
  <rect x="84" y="516" width="244" height="56" rx="18" fill="#131b26" stroke="rgba(255,255,255,0.08)" />
  <text x="116" y="552" class="pill">Console monitoring</text>
  <rect x="84" y="598" width="212" height="94" rx="24" fill="#101722" stroke="rgba(255,255,255,0.08)" />
  <circle cx="122" cy="645" r="12" fill="#69a7ff" fill-opacity="0.22" />
  <circle cx="122" cy="645" r="5" fill="#69a7ff" />
  <text x="148" y="637" class="pill">Focused logs</text>
  <text x="148" y="665" class="metric">Level filters and window mode</text>
</svg>
`;

const screenshotNetworkSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1018" />
      <stop offset="100%" stop-color="#05070b" />
    </linearGradient>
    <linearGradient id="panelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131b26" />
      <stop offset="100%" stop-color="#0b1118" />
    </linearGradient>
    <style>${baseStyles}</style>
  </defs>
  <rect width="1280" height="800" fill="url(#screenBg)" />
  <circle cx="150" cy="92" r="120" fill="#69a7ff" fill-opacity="0.12" />
  <circle cx="1110" cy="160" r="160" fill="#f2c66d" fill-opacity="0.08" />
  <text x="84" y="110" class="eyebrow">Store Preview 03</text>
  <text x="84" y="180" class="titleCompact">
    <tspan x="84" dy="0">Track requests and</tspan>
    <tspan x="84" dy="54">status codes</tspan>
  </text>
  <text x="84" y="270" class="subtitle">Scan request methods, response codes, and URLs from the active tab.</text>
  ${bullet(84, 326, "#69a7ff", "Method and status chips")}
  ${bullet(84, 378, "#5cbb7a", "Search requests instantly")}
  ${bullet(84, 430, "#f2c66d", "Compact request list")}
  ${shellCard(502, 92, 702, 592, assets.screenshotNetwork)}
  <rect x="84" y="516" width="232" height="56" rx="18" fill="#131b26" stroke="rgba(255,255,255,0.08)" />
  <text x="116" y="552" class="pill">Network timeline</text>
</svg>
`;

const screenshotStashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="800" viewBox="0 0 1280 800">
  <defs>
    <linearGradient id="screenBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0a1018" />
      <stop offset="100%" stop-color="#05070b" />
    </linearGradient>
    <linearGradient id="panelBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#131b26" />
      <stop offset="100%" stop-color="#0b1118" />
    </linearGradient>
    <style>${baseStyles}</style>
  </defs>
  <rect width="1280" height="800" fill="url(#screenBg)" />
  <circle cx="260" cy="720" r="220" fill="#69a7ff" fill-opacity="0.08" />
  <circle cx="1160" cy="140" r="140" fill="#ef7d7d" fill-opacity="0.08" />
  <text x="84" y="110" class="eyebrow">Store Preview 04</text>
  <text x="84" y="180" class="titleCompact">
    <tspan x="84" dy="0">Keep copied snippets</tspan>
    <tspan x="84" dy="54">within reach</tspan>
  </text>
  <text x="84" y="270" class="subtitle">Auto-captured stash history helps you reuse selectors, payloads, and logs.</text>
  ${bullet(84, 326, "#69a7ff", "Recent copied text in one list")}
  ${bullet(84, 378, "#5cbb7a", "Copy back or clear entries")}
  ${bullet(84, 430, "#f2c66d", "Useful for QA and support handoff")}
  ${shellCard(520, 92, 684, 592, assets.screenshotStash)}
  <rect x="84" y="516" width="192" height="56" rx="18" fill="#131b26" stroke="rgba(255,255,255,0.08)" />
  <text x="116" y="552" class="pill">Clipboard stash</text>
</svg>
`;

const readme = `# Store Assets

Generated store assets for the renewed Taillog Chrome extension UI.

## Files

- \`icon-128.png\`: Chrome Web Store icon
- \`marquee-promo-tile-1400x560.png\`: promotional marquee tile
- \`screenshot-01-overview-1280x800.png\`
- \`screenshot-02-console-1280x800.png\`
- \`screenshot-03-network-1280x800.png\`
- \`screenshot-04-stash-1280x800.png\`

Source SVG files are stored in \`sources/\`.
`;

await fs.mkdir(sourceDir, { recursive: true });

const files = [
  ["icon", iconSvg, "icon-128.png", 512, 512, { width: 128, height: 128 }],
  [
    "marquee-promo-tile-1400x560",
    marqueeSvg,
    "marquee-promo-tile-1400x560.png",
    1400,
    560,
  ],
  [
    "screenshot-01-overview-1280x800",
    screenshotOverviewSvg,
    "screenshot-01-overview-1280x800.png",
    1280,
    800,
  ],
  [
    "screenshot-02-console-1280x800",
    screenshotConsoleSvg,
    "screenshot-02-console-1280x800.png",
    1280,
    800,
  ],
  [
    "screenshot-03-network-1280x800",
    screenshotNetworkSvg,
    "screenshot-03-network-1280x800.png",
    1280,
    800,
  ],
  [
    "screenshot-04-stash-1280x800",
    screenshotStashSvg,
    "screenshot-04-stash-1280x800.png",
    1280,
    800,
  ],
];

for (const [name, svg, pngName, width, height, resizeTo] of files) {
  const svgPath = await writeSvg(name, svg);
  await renderPng(svgPath, pngName, width, height, resizeTo);
}

await fs.writeFile(path.join(outputDir, "README.md"), readme, "utf8");

console.log(`Generated store assets in ${outputDir}`);
