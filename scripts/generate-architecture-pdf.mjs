import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const htmlPath = join(root, 'docs', 'architecture-brief.html');
const pdfPath = join(root, 'docs', 'auto-care-wrapped-architecture.pdf');
const htmlUrl = `file:///${htmlPath.replace(/\\/g, '/')}`;

const browserCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
].filter(Boolean);

const browser = browserCandidates.find((candidate) => existsSync(candidate));

if (!browser) {
  console.error('No Chrome or Edge installation found for headless PDF generation.');
  console.error('Open docs/architecture-brief.html in a browser and use Print → Save as PDF.');
  process.exit(1);
}

const result = spawnSync(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--run-all-compositor-stages-before-draw',
    '--virtual-time-budget=10000',
    `--print-to-pdf=${pdfPath}`,
    htmlUrl,
  ],
  { encoding: 'utf8', timeout: 30000 },
);

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || 'PDF generation failed.');
  process.exit(result.status ?? 1);
}

if (!existsSync(pdfPath)) {
  console.error(`Expected PDF was not created at ${pdfPath}`);
  process.exit(1);
}

console.log(`Wrote ${resolve(pdfPath)}`);
