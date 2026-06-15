import PptxGenJS from 'pptxgenjs';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ORANGE = 'F3901D';
const INK = '0A0A0A';
const MUTED = '4A5568';
const WHITE = 'FFFFFF';
const LIGHT = 'F8FAFC';

const pptx = new PptxGenJS();
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'Auto Care Association';
pptx.title = 'Auto Care Wrapped — Phase 1 Architecture Review';

function addTitleSlide(title, subtitle) {
  const slide = pptx.addSlide();
  slide.background = { color: INK };
  slide.addText(title, {
    x: 0.6,
    y: 2.0,
    w: 8.8,
    h: 1.2,
    fontSize: 36,
    bold: true,
    color: WHITE,
    fontFace: 'Segoe UI',
  });
  slide.addText(subtitle, {
    x: 0.6,
    y: 3.2,
    w: 8.8,
    h: 0.8,
    fontSize: 18,
    color: ORANGE,
    fontFace: 'Segoe UI',
  });
}

function addSectionSlide(title) {
  const slide = pptx.addSlide();
  slide.background = { color: ORANGE };
  slide.addText(title, {
    x: 0.6,
    y: 2.3,
    w: 8.8,
    h: 1,
    fontSize: 32,
    bold: true,
    color: WHITE,
    fontFace: 'Segoe UI',
  });
}

function addContentSlide(title, bullets, notes) {
  const slide = pptx.addSlide();
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ORANGE },
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.35,
    w: 8.8,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: 'Segoe UI',
  });

  const rows = bullets.map((text) => ({
    text,
    options: { bullet: true, breakLine: true, fontSize: 14, color: INK, fontFace: 'Segoe UI', paraSpaceAfter: 8 },
  }));

  slide.addText(rows, {
    x: 0.6,
    y: 1.05,
    w: 8.8,
    h: 4.2,
    valign: 'top',
  });

  if (notes) {
    slide.addNotes(notes);
  }
}

function addQuestionSlide(title, questions, owner) {
  const slide = pptx.addSlide();
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ORANGE },
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.35,
    w: 8.8,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: INK,
    fontFace: 'Segoe UI',
  });

  const rows = questions.map((q) => ({
    text: q,
    options: { bullet: true, breakLine: true, fontSize: 13, color: INK, fontFace: 'Segoe UI', paraSpaceAfter: 6 },
  }));

  slide.addText(rows, {
    x: 0.6,
    y: 1.0,
    w: 8.5,
    h: 3.8,
    valign: 'top',
  });

  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.6,
    y: 4.85,
    w: 3.2,
    h: 0.45,
    fill: { color: LIGHT },
    line: { color: MUTED, width: 0.5 },
  });
  slide.addText(`Owner: ${owner}`, {
    x: 0.75,
    y: 4.9,
    w: 3,
    h: 0.35,
    fontSize: 11,
    color: MUTED,
    fontFace: 'Segoe UI',
  });
}

function addTableSlide(title, headers, rows) {
  const slide = pptx.addSlide();
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ORANGE },
  });
  slide.addText(title, {
    x: 0.6,
    y: 0.35,
    w: 8.8,
    h: 0.6,
    fontSize: 22,
    bold: true,
    color: INK,
    fontFace: 'Segoe UI',
  });

  const tableRows = [
    headers.map((h) => ({
      text: h,
      options: { bold: true, color: WHITE, fill: { color: INK }, fontSize: 11 },
    })),
    ...rows.map((row) =>
      row.map((cell) => ({
        text: cell,
        options: { fontSize: 11, color: INK },
      })),
    ),
  ];

  slide.addTable(tableRows, {
    x: 0.6,
    y: 1.05,
    w: 8.8,
    colW: [2.2, 2.2, 2.2, 2.2],
    border: { type: 'solid', color: MUTED, pt: 0.5 },
    autoPage: false,
  });
}

function addFlowSlide() {
  const slide = pptx.addSlide();
  slide.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: '100%',
    h: 0.08,
    fill: { color: ORANGE },
  });
  slide.addText('Phase 1 request flow', {
    x: 0.6,
    y: 0.35,
    w: 8.8,
    h: 0.6,
    fontSize: 24,
    bold: true,
    color: INK,
    fontFace: 'Segoe UI',
  });

  const boxes = [
    { x: 0.5, label: 'Member visits\nmy.autocare.org/wrapped' },
    { x: 2.55, label: 'Impexium SSO\n(session cookie)' },
    { x: 4.6, label: 'Wrapped SPA\n(React static build)' },
    { x: 6.65, label: 'GET /api/wrapped/report\n(JSON file lookup)' },
  ];

  boxes.forEach((box, i) => {
    slide.addShape(pptx.ShapeType.roundRect, {
      x: box.x,
      y: 1.5,
      w: 1.75,
      h: 1.1,
      fill: { color: LIGHT },
      line: { color: INK, width: 1 },
    });
    slide.addText(box.label, {
      x: box.x + 0.05,
      y: 1.65,
      w: 1.65,
      h: 0.9,
      fontSize: 10,
      align: 'center',
      color: INK,
      fontFace: 'Segoe UI',
    });
    if (i < boxes.length - 1) {
      slide.addText('→', {
        x: box.x + 1.78,
        y: 1.85,
        w: 0.35,
        h: 0.3,
        fontSize: 16,
        color: ORANGE,
        bold: true,
      });
    }
  });

  slide.addText(
    [
      {
        text: 'Key point: ',
        options: { bold: true, color: INK, fontSize: 13 },
      },
      {
        text: 'The browser never reads JSON files directly. SSO determines company ID; the API returns the matching static JSON.',
        options: { color: INK, fontSize: 13 },
      },
    ],
    { x: 0.6, y: 3.0, w: 8.8, h: 0.8 },
  );

  slide.addText(
    [
      { text: 'Phase 2 swap: ', options: { bold: true, color: INK, fontSize: 12 } },
      {
        text: 'Replace file lookup with Snowflake query — same JSON response shape, no SPA changes.',
        options: { color: MUTED, fontSize: 12 },
      },
    ],
    { x: 0.6, y: 3.7, w: 8.8, h: 0.6 },
  );
}

// --- Slides ---

addTitleSlide(
  'Auto Care Wrapped',
  'Phase 1 Architecture Review — Static JSON launch on my.autocare.org',
);

addContentSlide('Agenda', [
  'Phase 1 scope and what we are deferring',
  'Architecture: SPA, API, Impexium SSO, static JSON',
  'Data model and 7-company launch cohort',
  'Deployment and embed on my.autocare.org',
  'Open questions we need answered to ship Phase 1',
  'Owners, decisions, and next steps',
]);

addSectionSlide('Phase 1 scope');

addContentSlide('What Phase 1 delivers', [
  'Interactive Wrapped experience embedded on my.autocare.org',
  'Impexium SSO — members see their company report after login',
  'Backend API serves one JSON report per company from static files',
  '7 launch companies with real (manually entered) metrics',
  'Factbook metrics hardcoded in JSON until Factbook API exists',
  'Same JSON contract we will use when Snowflake goes live',
]);

addContentSlide('What Phase 1 does NOT include', [
  'Live Snowflake queries (Phase 2)',
  'Factbook API integration (Phase 2)',
  'Self-service report generation for all members',
  'Client-side company ID selection (security risk — never allowed)',
  'Changes to Impexium core — link or embed only',
]);

addSectionSlide('Architecture');

addContentSlide('System components', [
  'Wrapped SPA — React/Vite static build (`npm run build` → `dist/`)',
  'API layer — `GET /api/wrapped/report` + health check',
  'Impexium / my.autocare.org — SSO, session, portal embed',
  'Static JSON files — one file per company in launch cohort',
  'Future: Snowflake secure view + Factbook API (same JSON out)',
]);

addFlowSlide();

addContentSlide('Security model', [
  'Company ID comes from SSO session only — never from the browser',
  'API validates session before returning any report',
  'Companies not in launch cohort receive HTTP 404',
  'Snowflake credentials stay server-side (Phase 2)',
  'Same-origin API preferred: `/api/wrapped/report` with session cookie',
]);

addSectionSlide('Static JSON data');

addContentSlide('Why static JSON for launch?', [
  'Ship on my.autocare.org without waiting for Snowflake pipeline',
  'Validate UX, copy, and embed with real company metrics',
  'Developer converts CSV/JSON → one file per company',
  'API contract is frozen — Snowflake replaces file read later',
  'Artifacts: `example.wrapped-report.json`, CSV template, TypeScript types',
]);

addTableSlide(
  'JSON report sections',
  ['Section', 'Launch source', 'Phase 2 source', 'Notes'],
  [
    ['company', 'Static JSON', 'Snowflake', 'ID must match Impexium org'],
    ['journey', 'Static JSON', 'Snowflake', 'Includes community names list'],
    ['events', 'Static JSON', 'Snowflake', 'webinarCount = total webinars'],
    ['products', 'Static JSON', 'Snowflake', 'TrendLens, DemandIndex, Academy'],
    ['factbook', 'Hardcoded JSON', 'Factbook API', 'Separate source at launch'],
    ['standards', 'Static JSON', 'Snowflake', 'Subscribed products, not missing'],
  ],
);

addContentSlide('7-company launch cohort', [
  'Confirm Impexium org ID for each company → `company.id`',
  'One JSON file per company (e.g. `dayco-inc.json`)',
  'Fill metrics from internal data / stakeholder spreadsheet',
  'Factbook block entered manually per company',
  'API maps authenticated org → correct JSON file',
  'All other members: friendly “report not available” (404)',
]);

addSectionSlide('Deployment on my.autocare.org');

addContentSlide('Hosting model', [
  'Deploy SPA static files to agreed path (e.g. `/wrapped/`)',
  'Configure SPA fallback so client routes work on refresh',
  'API hosted on same domain or trusted subdomain (cookie/SSO)',
  'Impexium portal: link or iframe to Wrapped URL',
  'No GitHub → Impexium deploy — separate hosting for `dist/`',
  'Staging environment before production cutover',
]);

addSectionSlide('Questions to answer');

addQuestionSlide(
  'Infrastructure & hosting',
  [
    'What is the production URL? (e.g. `my.autocare.org/wrapped`)',
    'Who deploys the SPA static build and who owns the server?',
    'Where does `GET /api/wrapped/report` run — existing API service or new?',
    'Do we need a subpath base URL config (`/wrapped/`)?',
    'What is the staging URL and who provisions it?',
    'SPA fallback and cache headers — any CDN or WAF rules?',
  ],
  'Auto Care Infrastructure',
);

addQuestionSlide(
  'Impexium SSO & embed',
  [
    'How do we embed Wrapped in my.autocare.org — new nav link, iframe, or standalone URL?',
    'What SSO protocol is in use (OAuth2, SAML, OpenID Connect)?',
    'What claim gives us the company/org ID after login?',
    'Does org ID match our JSON `company.id` naming?',
    'Session model: shared cookie domain or token exchange via BFF?',
    'Redirect URLs to register for dev, staging, and production?',
    'Org-level access only — any user-level restrictions?',
  ],
  'Impexium / re:members',
);

addQuestionSlide(
  'API & static JSON data',
  [
    'Who builds the Phase 1 API that reads JSON files by org ID?',
    'Where do JSON files live in deployment (filesystem, blob, config repo)?',
    'How do we update JSON without redeploying the SPA?',
    '404 vs empty report for companies outside the 7-company cohort?',
    'Who provides verified metrics for each launch company?',
    'Process to correct data if a member disputes a number?',
  ],
  'Development + Data team',
);

addQuestionSlide(
  'Content, QA & sign-off',
  [
    'Who approves copy variants (zero events, low/high engagement)?',
    'Which 7 companies are in the launch cohort — names and Impexium IDs?',
    'UAT plan: who tests each company scenario before go-live?',
    'Performance target for report API (e.g. < 2s)?',
    'Marketing/comms plan for launch announcement?',
    'Rollback plan if SSO or API fails in production?',
  ],
  'Product + Marketing',
);

addTableSlide(
  'Decisions & owners',
  ['Decision', 'Owner', 'Target date', 'Status'],
  [
    ['Production URL & hosting path', '', '', 'Open'],
    ['SSO claim → company ID mapping', '', '', 'Open'],
    ['Phase 1 API owner', '', '', 'Open'],
    ['7 launch companies + JSON data', '', '', 'Open'],
    ['Impexium embed / nav link', '', '', 'Open'],
    ['Staging UAT sign-off', '', '', 'Open'],
  ],
);

addContentSlide('Phase 1 → Phase 2 path', [
  'Phase 1: SSO + API reads static JSON files',
  'Phase 2: API queries Snowflake secure view, same JSON shape',
  'Phase 2: Factbook API replaces hardcoded factbook block',
  'Frontend unchanged between phases',
  'Discovery docs: snowflake-column-mapping.md, discovery-checklist.md',
]);

addContentSlide('Artifacts in repo (share with team)', [
  'SPA: React/Vite app — `npm run build` produces deployable `dist/`',
  'JSON example: `data/reports/example.wrapped-report.json`',
  'CSV template: `docs/wrapped-report-data-template.csv`',
  'Types: `src/types/wrappedReport.ts`',
  'Reference mock API: `server/mock-api.ts`',
  'Architecture brief: `docs/architecture-brief.html`',
]);

addTitleSlide('Discussion', 'Capture owners and dates for each open question before we leave the room.');

const outPath = join(__dirname, 'Auto-Care-Wrapped-Phase1-Architecture.pptx');
await pptx.writeFile({ fileName: outPath });
console.log(`Created: ${outPath}`);
