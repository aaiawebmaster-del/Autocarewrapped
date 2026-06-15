# Netlify deploy + my.autocare.org embed (Phase 1)

## Overview

1. **Netlify** hosts the React app, static JSON reports, and `embed.js`
2. **my.autocare.org** pages at `/engagement/{recordNumber}` include a short script snippet
3. The snippet loads an iframe; the app loads JSON for that record number

```
my.autocare.org/engagement/1101050
        │
        └── embed.js reads path → iframe → Netlify app ?record=1101050
                                              └── /data/reports/1101050.json
```

## Deploy to Netlify

1. Connect this repo to Netlify
2. Build settings (from `netlify.toml`):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Deploy and note your URL, e.g. `https://autocare-wrapped.netlify.app`

`npm run build` runs `import:reports` first, converting the Excel workbook to JSON.

## Excel → JSON pipeline

| Input | Output |
|-------|--------|
| `data/source/Wrapped - October Renewal Companies.xlsx` | `public/data/reports/{recordNumber}.json` |

```bash
npm run import:reports
```

Override source path: `WRAPPED_XLSX=/path/to/workbook.xlsx npm run import:reports`

### KPI calculations (from workbook sheets)

| JSON field | Source / rule |
|------------|----------------|
| `company.id` | Organization `RECORDNUMBER` (string) |
| `journey.membershipTenureYears` | Membership tenure → `YearsActive` |
| `journey.activeContacts` | Number of contacts → `Contact Count` |
| `journey.communityMembers` | Count of Community Participation rows |
| `journey.communities` | Unique `MembershipName` values |
| `journey.committeeMembers` | Count of Committee Participation rows |
| `events.inPersonAttended` | Distinct in-person events (CONF, Networking) |
| `events.inPersonTotal` | 8 (launch constant) |
| `events.webinarCount` | Distinct webinar `ProductName` per org |
| `products.demandIndexGroups` | Unique Demand Index products (excludes Annual Unit Volumes) |
| `products.academyUsers` | Unique academy `CustomerRecordNumber` |
| `products.academyCoursesCompleted` | Count of academy course rows |
| `standards.subscribedProducts` | Unique Standards subscription names |
| `factbook`, `trendLens` | Not in workbook — 0 until separate APIs |

## Embed on Impexium pages

See **[impexium-page-snippets.md](./impexium-page-snippets.md)** for copy-paste HTML per company.

```html
<div id="autocare-wrapped"></div>
<script
  src="https://YOUR-NETLIFY-URL/embed.js"
  data-app-url="https://YOUR-NETLIFY-URL"
  data-target="autocare-wrapped"
></script>
```

## Local test

```bash
npm run build
npm run preview
# http://localhost:4173/?record=1101050&embed=1
```

## Netlify usage

Static hosting only — no Functions. See prior bandwidth estimate; 6 member pages = low credit usage.

## Phase 2

Replace JSON file lookup with Snowflake API; keep same JSON shape. Swap embed for SSO-based single entry if desired.
