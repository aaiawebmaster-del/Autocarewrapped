import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets');
const transcriptPath =
  process.argv[2] ||
  path.join(
    process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-khardy-Downloads-Autocarewrapped-main-3/agent-transcripts/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a.jsonl'
  );

function extractBetween(text, startLabel, endLabel) {
  const start = text.indexOf(startLabel);
  if (start < 0) return null;
  const svgStart = text.indexOf('<svg', start + startLabel.length);
  if (svgStart < 0) return null;
  const end = endLabel ? text.indexOf(endLabel, svgStart) : -1;
  const svgEnd =
    endLabel && end > svgStart
      ? text.lastIndexOf('</svg>', end)
      : text.indexOf('</svg>', svgStart);
  if (svgEnd < svgStart) return null;
  return text.slice(svgStart, svgEnd + '</svg>'.length);
}

const raw = fs.readFileSync(transcriptPath, 'utf8');
let text = '';
for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  try {
    const o = JSON.parse(line);
    if (o.role !== 'user') continue;
    for (const part of o.message?.content || []) {
      if (part.type === 'text' && part.text.includes('now replace ipo:')) {
        text = part.text;
      }
    }
  } catch {
    continue;
  }
}

if (!text) {
  console.error('No user message with IPO SVGs found');
  process.exit(1);
}

const ipo = extractBetween(text, 'now replace ipo:', 'ishop:');
const ishop = extractBetween(text, 'ishop:', 'superspec:');
const superspec = extractBetween(text, 'superspec:', null);

const outputs = [
  ['dipstick-ipo.svg', ipo],
  ['dipstick-ishop.svg', ishop],
  ['dipstick-superspec.svg', superspec],
];

fs.mkdirSync(assetsDir, { recursive: true });
for (const [name, svg] of outputs) {
  if (!svg) {
    console.error('Missing', name);
    process.exit(1);
  }
  const outPath = path.join(assetsDir, name);
  fs.writeFileSync(outPath, svg, 'utf8');
  console.log('Wrote', outPath, svg.length, 'bytes');
}
