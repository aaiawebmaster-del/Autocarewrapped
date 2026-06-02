import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.join(__dirname, '../src/assets');
const transcriptPath =
  process.argv[2] ||
  path.join(
    process.env.HOME || process.env.USERPROFILE || '',
    '.cursor/projects/c-Users-khardy-Downloads-Autocarewrapped-main-3/agent-transcripts/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a/8ac63b38-7bc9-4123-bee5-dd9dd1a2555a.jsonl'
  );

function extractSvgFromText(text, marker) {
  const start = text.indexOf(marker);
  if (start < 0) return null;
  const end = text.indexOf('</svg>', start);
  if (end < 0) return null;
  return text.slice(start, end + '</svg>'.length);
}

function findLatestUserSvg(transcript, marker) {
  const lines = fs.readFileSync(transcript, 'utf8').split('\n');
  let found = null;
  for (const line of lines) {
    if (!line.trim()) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o.role !== 'user') continue;
    for (const part of o.message?.content || []) {
      if (part.type !== 'text') continue;
      const svg = extractSvgFromText(part.text, marker);
      if (svg) found = svg;
    }
  }
  return found;
}

const raw = fs.readFileSync(transcriptPath, 'utf8');

// Latest message with both SVGs (line ~221)
let acesSvg = null;
let piesSvg = null;

for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  let o;
  try {
    o = JSON.parse(line);
  } catch {
    continue;
  }
  if (o.role !== 'user') continue;
  for (const part of o.message?.content || []) {
    if (part.type !== 'text') continue;
    const t = part.text;
    if (t.includes('try with these svgs') || t.includes('here is aces:')) {
      const acesStart = t.indexOf('<svg width="400" height="1600"');
      if (acesStart >= 0) {
        const piesLabel = t.indexOf('here is pies:');
        const end =
          piesLabel > acesStart
            ? t.lastIndexOf('</svg>', piesLabel)
            : t.indexOf('</svg>', acesStart);
        if (end > acesStart) {
          acesSvg = t.slice(acesStart, end + '</svg>'.length);
        }
      }
      const piesStart = t.indexOf('here is pies:');
      if (piesStart >= 0) {
        const svgStart = t.indexOf('<svg', piesStart);
        if (svgStart >= 0) {
          const end = t.indexOf('</svg>', svgStart);
          if (end > svgStart) {
            piesSvg = t.slice(svgStart, end + '</svg>'.length);
          }
        }
      }
    }
  }
}

if (!acesSvg) {
  acesSvg = findLatestUserSvg(transcriptPath, '<svg width="400" height="1600"');
}
if (!piesSvg) {
  piesSvg = findLatestUserSvg(transcriptPath, '<svg width="312" height="1509"');
}

if (!acesSvg || !piesSvg) {
  console.error('Missing SVG(s)', { aces: !!acesSvg, pies: !!piesSvg });
  process.exit(1);
}

fs.mkdirSync(assetsDir, { recursive: true });
const acesOut = path.join(assetsDir, 'dipstick-aces.svg');
const piesOut = path.join(assetsDir, 'dipstick-pies.svg');
fs.writeFileSync(acesOut, acesSvg, 'utf8');
fs.writeFileSync(piesOut, piesSvg, 'utf8');
console.log('Wrote', acesOut, acesSvg.length, 'bytes');
console.log('Wrote', piesOut, piesSvg.length, 'bytes');
