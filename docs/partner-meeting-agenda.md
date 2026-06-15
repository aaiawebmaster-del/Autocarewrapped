# Auto Care Wrapped — Partner Discovery Meeting Agenda

Companion to [discovery-checklist.md](./discovery-checklist.md). Use this for structured conversations with Snowflake partners, Impexium / re:members, and Auto Care infrastructure.

**Suggested format:** 90-minute session (or split into two 45-minute calls: Snowflake + Identity)

| Time | Topic | Goal |
|------|-------|------|
| 0:00–0:10 | Context & architecture overview | Align on SPA + API + Snowflake model |
| 0:10–0:35 | Snowflake data & access | Confirm view, keys, refresh, security |
| 0:35–0:55 | Impexium SSO & tenant mapping | Confirm login flow and company ID |
| 0:55–1:15 | Infrastructure & UAT | Hosting, API owner, staging companies |
| 1:15–1:30 | Decisions, owners, next steps | Fill sign-off table in checklist |

---

## 1. Opening (all attendees)

**Say this:** Auto Care Wrapped is a React SPA on my.autocare.org. It does not connect to Snowflake or Impexium directly. A backend API validates SSO, resolves the user's company, queries Snowflake, and returns a single JSON report per company.

**Questions**

1. Who owns the production API that will serve `GET /api/wrapped/report`?
2. What is our target URL (e.g. `my.autocare.org/wrapped`) and timeline for staging vs production?
3. Who can grant access to Snowflake dev/staging and Impexium SSO client registration?

**Follow-ups if answers are vague**

- Can we get a named technical owner and backup for each system before we schedule implementation?
- Is there an existing integration pattern (similar report or dashboard) we should copy?
- What environments exist today (dev / staging / prod) and who provisions them?

---

## 2. Snowflake partners (≈25 min)

Reference: [snowflake-column-mapping.md](./snowflake-column-mapping.md), [Snowpark docs](https://docs.snowflake.com/en/developer-guide/snowpark)

### 2a. Data model & source of truth

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | What is the source table or view for Wrapped metrics? One row per company per year? | Defines API query shape |
| 2 | Is there already a view like `WRAPPED.V_COMPANY_REPORT_2026`, or do we need to build it? | Scope and timeline |
| 3 | Which fields are pre-aggregated vs calculated at query time? | Page load performance |
| 4 | What is the refresh cadence (nightly batch, weekly, manual)? | Stale data expectations |
| 5 | What happens when a company has no row — new member, lapsed, or data gap? | 404 vs partial defaults |

**Follow-ups**

- Can you share a sample row (anonymized) for one test company?
- Are event attendance and webinar hours from the same pipeline or different sources?
- Do `attendancePct` and `inPersonAttended`/`inPersonTotal` need to stay in sync, or can the API derive one from the other?
- Is `standards.missingProducts` an array in Snowflake or a delimited string we must parse?
- What is the SLA for data corrections if a member disputes a number?

### 2b. Company key & Impexium alignment

| # | Question | Why it matters |
|---|----------|----------------|
| 6 | What is the canonical company key in Snowflake (`COMPANY_ID`)? | Must match SSO mapping |
| 7 | Does that key match Impexium org ID, CRM account ID, or member number? | Prevents wrong-company reports |
| 8 | Is there an existing mapping table between Impexium and Snowflake? | Reuse vs new build |
| 9 | Can one Impexium org map to multiple Snowflake companies (or vice versa)? | Edge cases |

**Follow-ups**

- Who maintains the mapping if IDs differ across systems?
- How are mergers, acquisitions, or parent/subsidiary orgs handled?
- Do we need a one-time backfill or ongoing sync job for the mapping table?

### 2c. Access pattern & security

| # | Question | Why it matters |
|---|----------|----------------|
| 10 | Preferred access: Snowpark Python on API server, JDBC, or Snowflake SQL REST API? | Matches Auto Care stack |
| 11 | Can row-level security enforce `company_id` in Snowflake, or does the API filter only? | Defense in depth |
| 12 | What service account / role should the API use? Where are credentials stored? | Secrets management |
| 13 | Are there IP allowlists, PrivateLink, or network policies we must satisfy? | Deployment constraints |
| 14 | What audit logging exists for queries by company? | Compliance |

**Follow-ups**

- Can we get a read-only role scoped to the Wrapped view only?
- What is the expected query latency and warehouse sizing for ~N concurrent users?
- Should we cache API responses per company (e.g. 5–15 min TTL)? Any objection from data freshness rules?
- Who approves schema changes to the view after launch?

---

## 3. Impexium / re:members team (≈20 min)

Reference: existing my.autocare.org SSO

### 3a. SSO protocol & registration

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | Which SSO flow is live on my.autocare.org — OAuth2, SAML, OpenID Connect? | Integration approach |
| 2 | Can Wrapped register as a relying party on the same tenant, or need a new OAuth client? | Lead time |
| 3 | What redirect URLs are required for dev, staging, and production? | Avoid login loops |
| 4 | Is PKCE required for public clients, or is this cookie-only via same domain? | SPA security |

**Follow-ups**

- Can you share the IdP metadata / discovery document URL for staging?
- Who submits the client registration request and typical turnaround?
- Are there IP or domain restrictions on redirect URIs?
- Do we need separate clients per environment or one client with multiple redirects?

### 3b. Claims, session, and access model

| # | Question | Why it matters |
|---|----------|----------------|
| 5 | What claims are available after login (org ID, org name, user display name, roles)? | Tenant resolution + greeting |
| 6 | Is the report org-level (any logged-in user at company sees same data) or user-level? | Product decision |
| 7 | Session model: shared cookie on `.autocare.org`, or BFF token exchange? | Frontend auth design |
| 8 | Session lifetime and idle timeout? | UX when session expires mid-report |
| 9 | How do we test SSO in dev without production credentials? | Developer workflow |

**Follow-ups**

- Which claim field should we treat as authoritative for `company.id` in our API?
- Can we get a test user in each of three UAT companies (zero / average / high engagement)?
- What happens if a user belongs to multiple orgs — pick primary, show selector, or deny?
- Are non-member or staff/admin accounts allowed to view Wrapped, and under what rules?
- If cookie domain cannot be shared, is a BFF on my.autocare.org acceptable to the Impexium team?

### 3c. API validation

| # | Question | Why it matters |
|---|----------|----------------|
| 10 | How should the backend validate the session — introspect token, validate cookie, call Impexium API? | Middleware implementation |
| 11 | Is there an existing endpoint my.autocare.org uses today we should reuse? | Consistency |

**Follow-ups**

- Can you point us to sample code or middleware from an existing Auto Care app?
- What HTTP status should we return for valid login but no Snowflake row — 404 vs 403?
- Is there rate limiting on session validation we should plan for?

---

## 4. Auto Care infrastructure (≈20 min)

| # | Question | Why it matters |
|---|----------|----------------|
| 1 | Confirm hosting path (e.g. `my.autocare.org/wrapped`) | SSO cookies, CORS |
| 2 | Who deploys the static SPA (`npm run build` → CDN or web server)? | Release process |
| 3 | Who deploys and monitors `GET /api/wrapped/report`? | On-call |
| 4 | Where do Snowflake credentials live (Vault, Azure Key Vault, etc.)? | Security review |
| 5 | Same-origin API vs separate API subdomain? | CORS and cookies |
| 6 | Three staging companies for UAT — can we name them now? | Test plan |

**Follow-ups**

- Is there a standard CI/CD pipeline we plug into, or net-new?
- Who performs security review before production?
- What analytics or logging is required (access by user + company)?
- Disaster recovery: if Snowflake or Impexium is down, what should the SPA show?

---

## 5. Decisions to capture before leaving

Fill in [discovery-checklist.md](./discovery-checklist.md) sign-off table.

| Decision | Options | Our choice | Owner | Date |
|----------|---------|------------|-------|------|
| Snowflake access pattern | Snowpark / JDBC / SQL API | | | |
| Company key source | Impexium org ID / CRM ID / other | | | |
| SSO integration | Shared cookie / BFF / new client | | | |
| Report access scope | Org-level / user-level | | | |
| Missing data behavior | 404 / empty report / support message | | | |
| API cache TTL | None / 5 min / 15 min | | | |
| Staging go-live date | | | | |

---

## 6. Pre-meeting handouts (send 24h ahead)

1. One-page architecture diagram (SPA → API → Impexium + Snowflake)
2. [wrappedReport.ts](../src/types/wrappedReport.ts) JSON contract (or exported PDF)
3. [snowflake-column-mapping.md](./snowflake-column-mapping.md)
4. List of three UAT scenarios: zero events, average (Dayco-like), high engagement

---

## 7. Post-meeting actions

- [ ] Update `snowflake-column-mapping.md` with confirmed column names
- [ ] Update `WrappedReport` type if fields added/removed
- [ ] Create Impexium SSO client(s) for staging
- [ ] Provision Snowflake service account + secure view
- [ ] Schedule API implementation kickoff with infra owner
- [ ] Book UAT with named test companies
