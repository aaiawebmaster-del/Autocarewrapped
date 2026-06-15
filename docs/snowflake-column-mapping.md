# Snowflake Column Mapping

Maps proposed Snowflake view columns to the frontend `WrappedReport` contract in [`src/types/wrappedReport.ts`](../src/types/wrappedReport.ts).

Adjust column names after Snowflake discovery. The API layer should map Snowflake fields to this JSON — the React app never imports Snowflake names.

**Factbook** (`factbook.users`, `factbook.contactPct`) is **not** from Snowflake at launch — hardcode per company until the Factbook API exists.

| Snowflake column (proposed) | JSON path | Type | Notes |
|-----------------------------|-----------|------|-------|
| `COMPANY_ID` | `company.id` | string | Must match Impexium org mapping |
| `COMPANY_NAME` | `company.name` | string | Display name |
| `REPORT_YEAR` | `reportYear` | number | e.g. 2026 |
| `MEMBERSHIP_TENURE_YEARS` | `journey.membershipTenureYears` | number | |
| `ACTIVE_CONTACTS` | `journey.activeContacts` | number | |
| `COMMUNITY_MEMBERS` | `journey.communityMembers` | number | Headcount |
| `COMMUNITY_NAMES` | `journey.communities` | string[] | Community names (may need separate join) |
| `COMMITTEE_MEMBERS` | `journey.committeeMembers` | number | |
| `IN_PERSON_EVENTS_ATTENDED` | `events.inPersonAttended` | number | |
| `IN_PERSON_EVENTS_TOTAL` | `events.inPersonTotal` | number | Events offered |
| `ATTENDANCE_PCT` | `events.attendancePct` | number | 0–100 |
| `WEBINAR_COUNT` | `events.webinarCount` | number | Total webinars (UI may label as hours) |
| `TRENDLENS_USERS` | `products.trendLensUsers` | number | |
| `TRENDLENS_CONTACT_PCT` | `products.trendLensContactPct` | number | |
| `DEMANDINDEX_GROUPS` | `products.demandIndexGroups` | number | |
| `DEMANDINDEX_GROUPS_TOTAL` | `products.demandIndexGroupsTotal` | number | |
| `ACADEMY_USERS` | `products.academyUsers` | number | |
| `ACADEMY_COURSES_COMPLETED` | `products.academyCoursesCompleted` | number | |
| — | `factbook.users` | number | **Separate API / hardcoded at launch** |
| — | `factbook.contactPct` | number | **Separate API / hardcoded at launch** |
| `STANDARDS_SUBSCRIBED_COUNT` | `standards.subscribedCount` | number? | |
| `STANDARDS_SUBSCRIBED_PRODUCTS` | `standards.subscribedProducts` | string[]? | e.g. IPO, ISHOP, ACES |
| `STANDARDS_SUBSCRIBED_PCT` | `standards.subscribedPct` | number? | Optional; gauge UI |

Example secure view:

```sql
-- WRAPPED.V_COMPANY_REPORT_2026
SELECT * FROM WRAPPED.COMPANY_REPORT_2026
WHERE COMPANY_ID = :company_id_from_sso;
```

The API merges Snowflake row + Factbook block before returning JSON.
