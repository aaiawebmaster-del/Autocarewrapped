import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcriptPath =
  process.argv[2] ||
  'C:/Users/khardy/.cursor/projects/c-Users-khardy-Downloads-Autocarewrapped-main-3/agent-transcripts/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a.jsonl';
const outPath = path.join(__dirname, '../src/assets/aces-dipstick.svg');

const raw = fs.readFileSync(transcriptPath, 'utf8');
const marker = '<svg width=\\"2158\\"';
const start = raw.indexOf(marker);
if (start < 0) {
  console.error('SVG start not found');
  process.exit(1);
}
const end = raw.indexOf('</svg>', start);
if (end < 0) {
  console.error('SVG end not found');
  process.exit(1);
}
const svg = raw.slice(start, end + '</svg>'.length);
fs.writeFileSync(outPath, svg, 'utf8');
console.log('Wrote', outPath, 'bytes', svg.length);
