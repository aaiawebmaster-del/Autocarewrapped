# my.autocare.org page embed snippets

Deploy the app to Netlify first, then paste the matching snippet on each Impexium page.

**Page URL pattern:** `https://my.autocare.org/engagement/{recordNumber}`

The embed script reads the record number from the page URL automatically.

Replace `YOUR-NETLIFY-URL` with your Netlify site (no trailing slash).

---

## Universal snippet (auto-detects record from URL)

Use this on any `/engagement/{recordNumber}` page:

```html
<div id="autocare-wrapped"></div>
<script
  src="https://YOUR-NETLIFY-URL/embed.js"
  data-app-url="https://YOUR-NETLIFY-URL"
  data-target="autocare-wrapped"
></script>
```

---

## Launch companies (October Renewal cohort)

| Company | Page URL | Record # |
|---------|----------|----------|
| Batteries Plus, LLC | `/engagement/1386304` | 1386304 |
| Dayco Incorporated | `/engagement/1101050` | 1101050 |
| ElringKlinger AG | `/engagement/1376049` | 1376049 |
| EnerSys Batteries | `/engagement/1351167` | 1351167 |
| Nissan North America | `/engagement/1257307` | 1257307 |
| Recochem Inc. | `/engagement/1255413` | 1255413 |

### Example — Dayco (`/engagement/1101050`)

```html
<div id="autocare-wrapped"></div>
<script
  src="https://YOUR-NETLIFY-URL/embed.js"
  data-app-url="https://YOUR-NETLIFY-URL"
  data-target="autocare-wrapped"
></script>
```

### Optional: force a record number (override URL)

```html
<div id="autocare-wrapped"></div>
<script
  src="https://YOUR-NETLIFY-URL/embed.js"
  data-app-url="https://YOUR-NETLIFY-URL"
  data-record="1101050"
  data-target="autocare-wrapped"
  data-height="2400px"
></script>
```

---

## How data is selected

1. Visitor opens `my.autocare.org/engagement/1101050`
2. `embed.js` extracts `1101050` from the path
3. iframe loads `YOUR-NETLIFY-URL/?record=1101050&embed=1`
4. App fetches `/data/reports/1101050.json`

## Updating data

1. Replace `data/source/Wrapped - October Renewal Companies.xlsx`
2. Run `npm run import:reports` (or `npm run build`)
3. Redeploy Netlify

See `scripts/import-excel-reports.mjs` for KPI calculation rules.
