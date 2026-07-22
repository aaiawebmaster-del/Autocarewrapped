# my.autocare.org unified `/engagement` page snippet (re:Members / AMA)

There is now **one** page for everyone: `https://my.autocare.org/engagement`.

On that page a re:Members **Query Content** component runs against the logged-in
user and outputs their 7-digit Organization ID via the shortcode
`{{RelatedOrganizationRecordNumber}}`. The embed loader reads that value and loads
the matching company's Wrapped report — no per-company pages required.

Replace `YOUR-NETLIFY-URL` with your Netlify site (no trailing slash).

---

## The snippet (paste once on the page)

The Query Content component renders the logged-in user's related Organization ID(s),
e.g. as a `<ul class="list-results">` with one or more `<li class="list-result">`
items. Point `data-record-selector` at those items:

```html
<div id="autocare-wrapped"></div>
<script
  src="https://YOUR-NETLIFY-URL/embed.js"
  data-app-url="https://YOUR-NETLIFY-URL"
  data-target="autocare-wrapped"
  data-record-selector=".list-results .list-result"
></script>
```

- `data-record-selector` should match the element(s) the Query Content component
  renders the Organization ID(s) into. The loader reads **every** match, so if a user
  belongs to multiple organizations it collects them all.
- The app then loads the first of those organizations that actually has a Wrapped
  report (only launch companies have reports today; others show "Report not available").
- The loader waits for the shortcode to resolve (it ignores the literal
  `{{RelatedOrganizationRecordNumber}}` until re:Members replaces it), so it works
  whether the value is rendered server-side or injected by the component's script.
- `data-height` (optional) overrides the iframe height (default `100dvh`).

---

## How data is selected

1. A signed-in member opens `my.autocare.org/engagement`
2. The Query Content component fills `#autocare-record` with e.g. `1101050`
3. `embed.js` reads `1101050` and loads `YOUR-NETLIFY-URL/?record=1101050&embed=1`
4. The app fetches `/data/reports/1101050.json`

### Record number resolution order

`embed.js` uses the first available source:

1. `data-record` attribute on the script (manual override)
2. `?record=` / `?company=` / `?companyId=` query param (used by share links)
3. Text of the `data-record-selector` element (the rendered shortcode — the default)
4. `/engagement/{recordNumber}` path segment (legacy per-company pages)

---

## Sharing a specific company

Share links point at the same unified page with an explicit record number, which
takes precedence over the logged-in user's org:

```
https://my.autocare.org/engagement?record=1101050
```

This is what the in-app "Share" button generates.

---

## Launch companies (October Renewal cohort) — record numbers

| Company | Record # |
|---------|----------|
| Batteries Plus, LLC | 1386304 |
| Dayco Incorporated | 1101050 |
| East Penn Manufacturing Company | 1100433 |
| ElringKlinger AG | 1376049 |
| EnerSys Batteries | 1351167 |
| Nissan North America | 1257307 |
| Recochem Inc. | 1255413 |

---

## Updating data

1. Replace `data/source/Wrapped - October Renewal Companies.xlsx`
2. Run `npm run import:reports` (or `npm run build`)
3. Redeploy Netlify

See `scripts/import-excel-reports.mjs` for KPI calculation rules.
