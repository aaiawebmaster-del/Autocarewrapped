# Wrapped report data template (Excel / CSV)

There is **no original Excel file** for the JSON sample. The sample JSON defines the **API contract** the frontend expects — it was built from UI requirements and placeholder metrics (Dayco), not converted from a spreadsheet.

Use this template if you need to enter or convert data for the **7 launch companies**.

## Files

| File | Purpose |
|------|---------|
| [`../data/reports/example.wrapped-report.json`](../data/reports/example.wrapped-report.json) | Target JSON shape (one company) |
| [`wrapped-report-data-template.csv`](./wrapped-report-data-template.csv) | Excel-friendly bulk entry (open in Excel or Google Sheets) |

## CSV → JSON rules

1. **One row per company** in the CSV.
2. **`communities`** and **`standards_subscribed_products`**: separate multiple values with `|` (pipe), e.g. `IPO|ISHOP|ACES`.
3. **`company_id`** becomes `company.id` and the JSON filename, e.g. `dayco-inc.json`.
4. **`factbook_*` columns** are hardcoded at launch until the Factbook API exists.
5. **`webinar_count`** is the total number of webinars (UI may label as hours).

## Column → JSON mapping

| CSV column | JSON path |
|------------|-----------|
| `company_id` | `company.id` |
| `company_name` | `company.name` |
| `report_year` | `reportYear` |
| `membership_tenure_years` | `journey.membershipTenureYears` |
| `active_contacts` | `journey.activeContacts` |
| `community_members` | `journey.communityMembers` |
| `communities` | `journey.communities` (split on `\|`) |
| `committee_members` | `journey.committeeMembers` |
| `in_person_attended` | `events.inPersonAttended` |
| `in_person_total` | `events.inPersonTotal` |
| `attendance_pct` | `events.attendancePct` |
| `webinar_count` | `events.webinarCount` |
| `trendlens_users` | `products.trendLensUsers` |
| `trendlens_contact_pct` | `products.trendLensContactPct` |
| `demandindex_groups` | `products.demandIndexGroups` |
| `demandindex_groups_total` | `products.demandIndexGroupsTotal` |
| `academy_users` | `products.academyUsers` |
| `academy_courses_completed` | `products.academyCoursesCompleted` |
| `factbook_users` | `factbook.users` |
| `factbook_contact_pct` | `factbook.contactPct` |
| `standards_subscribed_count` | `standards.subscribedCount` |
| `standards_subscribed_products` | `standards.subscribedProducts` (split on `\|`) |
| `standards_subscribed_pct` | `standards.subscribedPct` |

## Where real data comes from

| Data | Launch source | Later source |
|------|---------------|--------------|
| Most fields | Manual entry in CSV/JSON or Snowflake export | Snowflake view |
| Factbook | Manual per company | Factbook API |
| Company ID | Impexium org ID | Impexium SSO |

If Auto Care has an existing metrics export (Snowflake, CRM, or internal spreadsheet), map those columns to this template — there is no single “source Excel” in the Wrapped frontend repo.
