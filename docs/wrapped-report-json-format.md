# Wrapped report JSON format (for developers)

One JSON file per company. Filename must be the organization record number:

```
public/data/reports/{recordNumber}.json
```

Example: `1101050.json` for company ID `1101050`.

The embed on `my.autocare.org` loads the report for the logged-in user’s Organization ID (or a `?record=` override). The app fetches:

```
GET /data/reports/{recordNumber}.json
```

`company.id` in the JSON **must** equal that `{recordNumber}` string.

---

## Example JSON

```json
{
  "reportYear": 2026,
  "company": {
    "id": "1101050",
    "name": "Dayco Incorporated",
    "recordNumber": 1101050
  },
  "journey": {
    "membershipTenureYears": 56,
    "activeContacts": 88,
    "communityMembers": 176,
    "communities": [
      "Automotive Communications Council",
      "AWDA Community",
      "Women in Auto Care",
      "YANG Membership"
    ],
    "committeeMembers": 2
  },
  "events": {
    "inPersonAttended": 5,
    "inPersonTotal": 8,
    "attendancePct": 63,
    "webinarCount": 22,
    "aapexAttended": true,
    "aapexExhibitor": false
  },
  "products": {
    "trendLensUsers": 4,
    "trendLensContactPct": 4,
    "demandIndexGroups": 6,
    "demandIndexGroupsTotal": 200,
    "academyUsers": 2,
    "academyCoursesCompleted": 2
  },
  "factbook": {
    "users": 3,
    "contactPct": 3
  },
  "standards": {
    "subscribedCount": 3,
    "subscribedProducts": [
      "PAdb - Product Attribute database",
      "VCdb - (North America) Light Duty & Powersports",
      "VCdb - (North America) Medium & Heavy Duty"
    ],
    "subscribedPct": 100
  }
}
```

Also see `data/reports/example.wrapped-report.json` and the TypeScript contract in `src/types/wrappedReport.ts`.

---

## Field notes

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `reportYear` | number | yes | Report year shown in the experience (e.g. `2026`) |
| `company.id` | string | yes | 7-digit org/record number as a **string**; must match filename |
| `company.name` | string | yes | Display name |
| `company.recordNumber` | number | no | Same ID as a number |
| `company.marketSegment` | `"retailer"` | no | When set to `"retailer"`, Demand Index is omitted from Kick the Tires / Full Diagnostics |
| `journey.membershipSince` | string | no | Membership start date (`YYYY-MM-DD` or `M/D/YYYY`). When set, tenure years are calculated from this date. |
| `journey.membershipTenureYears` | number | yes | Years as a member (derived from `membershipSince` when present) |
| `journey.activeContacts` | number | yes | Active contacts |
| `journey.communityMembers` | number | yes | Headcount in communities (animated counter) |
| `journey.communities` | string[] | yes | Community display names (drives logos); use `[]` if none |
| `journey.committeeMembers` | number | yes | Committee participant count |
| `events.inPersonAttended` | number | yes | In-person Auto Care events attended |
| `events.inPersonTotal` | number | yes | Events offered (launch constant is typically `8`) |
| `events.attendancePct` | number | yes | 0–100; usually `round(inPersonAttended / inPersonTotal * 100)` |
| `events.webinarCount` | number | yes | Webinars attended; UI may label as hours |
| `events.aapexAttended` | boolean | no | `false` = did not attend AAPEX (changes arrival flow). Default/omit = attended |
| `events.aapexExhibitor` | boolean | no | `true` = listed as AAPEX exhibitor (changes copy) |
| `products.trendLensUsers` | number | yes | TrendLens users |
| `products.trendLensContactPct` | number | yes | Usually `round(trendLensUsers / activeContacts * 100)` |
| `products.demandIndexGroups` | number | yes | Demand Index product groups subscribed |
| `products.demandIndexGroupsTotal` | number | yes | Catalog total (launch constant is typically `200`) |
| `products.academyUsers` | number | yes | Distinct Academy users |
| `products.academyCoursesCompleted` | number | yes | Academy courses completed |
| `factbook.users` | number | yes | Factbook users (manual until Factbook API exists) |
| `factbook.contactPct` | number | yes | Usually `round(users / activeContacts * 100)` |
| `standards` | object | no | Omit entirely if unused (do not send `null`) |
| `standards.subscribedCount` | number | no | Number of standards products |
| `standards.subscribedProducts` | string[] | no | Product name strings (see examples below) |
| `standards.subscribedPct` | number | no | Optional 0–100; UI also derives coverage from product names |

---

## Standards product name examples

Use consistent display names so the UI can map badges / ACES / PIES:

```text
PAdb - Product Attribute database
VCdb - (North America) Light Duty & Powersports
VCdb - (North America) Medium & Heavy Duty
VCdb - Latin America
Translation Reference Databases (Spanish)
Enterprise
```

**Enterprise** = highest package. The app treats any product name containing `Enterprise` as **100%** standards coverage (full database set + ACES/PIES).

---

## Community name examples

```text
AWDA Community
Automotive Communications Council
Women in Auto Care
YANG Membership
Automotive Content Professionals Network
Import Vehicle Community
```

Unknown names still appear in copy; known names unlock community logos.

---

## Validation rules

- All counts must be ≥ 0.
- `company.id` must equal the filename record number and match `company.recordNumber` (when present).
- `journey.communities` and `standards.subscribedProducts` must be JSON arrays of strings (use `[]` when empty).
- Prefer computing `attendancePct`, `trendLensContactPct`, and `factbook.contactPct` from the related counts.
- Sponsorship is **not** part of this JSON contract.

---

## How the app selects a company

1. Embed reads Organization ID(s) from the page (re:Members Query Content / shortcode list), or from `?record=` / `?records=`.
2. App requests `/data/reports/{id}.json` for each candidate until one exists.
3. If the file is missing (or Netlify SPA fallback returns HTML), the user sees “Report not available.”
