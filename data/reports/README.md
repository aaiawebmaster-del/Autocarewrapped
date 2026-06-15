# Wrapped report JSON files (launch cohort)

Use these files for the **first launch** before Snowflake is wired up. The production API should return the **same JSON shape** later — only the data source changes (JSON file → Snowflake query).

Copy [`example.wrapped-report.json`](./example.wrapped-report.json) for each company and fill in real values.

## File layout (recommended)

One file per company, named by **`company.id`** (must match Impexium org mapping):

```
data/reports/
  example.wrapped-report.json   ← template / spec example
  dayco-inc.json
  company-two-id.json
  ... (7 companies total)
```

## API behavior (developer)

1. User logs in via Impexium SSO.
2. API reads org/company ID from session (never from the browser).
3. **Launch:** load `data/reports/{companyId}.json` and return it.
4. **Later:** run Snowflake SQL, map row → same JSON; merge Factbook from Factbook API when ready.
5. If no file / no row: return HTTP **404**.

Endpoint stays: `GET /api/wrapped/report`

## Field reference

See `src/types/wrappedReport.ts` and `docs/snowflake-column-mapping.md`.

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `reportYear` | number | yes | e.g. 2026 |
| `company.id` | string | yes | Stable key; matches Impexium → file name |
| `company.name` | string | yes | Display name in intro |
| `journey.membershipTenureYears` | number | yes | Years as a member |
| `journey.activeContacts` | number | yes | Active contacts in Impexium |
| `journey.communityMembers` | number | yes | Headcount in communities |
| `journey.communities` | string[] | yes | Names of communities they belong to |
| `journey.committeeMembers` | number | yes | Committee participants |
| `events.inPersonAttended` | number | yes | Events attended |
| `events.inPersonTotal` | number | yes | Events offered |
| `events.attendancePct` | number | yes | 0–100 |
| `events.webinarCount` | number | yes | **Total webinars** (UI may show as “hours”) |
| `products.*` | numbers | yes | TrendLens, DemandIndex, Academy only |
| `factbook.users` | number | yes | **Hardcoded at launch** — separate API later |
| `factbook.contactPct` | number | yes | **Hardcoded at launch** — separate API later |
| `standards.subscribedCount` | number | no | How many standards products they have |
| `standards.subscribedProducts` | string[] | no | Which standards they subscribe to |
| `standards.subscribedPct` | number | no | 0–100 for gauge UI (optional if API computes) |

There is **no `member` block** — reports are company-scoped. Everyone viewing sees their organization’s Wrapped report.

## Data sources at launch

| Section | Launch source | Later source |
|---------|---------------|--------------|
| `company`, `journey`, `events`, `products`, `standards` | Snowflake (or JSON file mimicking it) | Snowflake |
| `factbook` | Hardcoded in JSON per company | Factbook API |

## Validation rules

- All counts ≥ 0.
- `events.attendancePct` should match attended/total (rounded), or API should compute it.
- `journey.communities` and `standards.subscribedProducts` must be JSON arrays of strings.
- `factbook` is always required at launch even though values are manual.
- Omit `standards` entirely if unused; do not send `null` unless API contract allows it.

## Handoff checklist for 7 companies

- [ ] Impexium org ID for each company → `company.id`
- [ ] One JSON file per company with real metrics
- [ ] Factbook block filled manually per company
- [ ] Community names listed in `journey.communities`
- [ ] Standards lists **subscribed** products, not missing ones
- [ ] API returns correct file per logged-in org
- [ ] 404 for companies not in launch cohort
