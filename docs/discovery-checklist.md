# Partner Discovery Checklist

Use this checklist in Snowflake and Impexium / re:members meetings before production deployment.

## Snowflake partners

- [ ] Source table or view name for Wrapped metrics (one row per company per year?)
- [ ] Canonical company key aligned with Impexium (org ID, CRM account ID, member number)
- [ ] Data pre-aggregated in Snowflake vs computed on read
- [ ] Refresh cadence (nightly, streaming, manual)
- [ ] Access pattern: Snowpark Python, JDBC + secure view, or SQL REST API
- [ ] Row-level security in Snowflake vs API-only filtering
- [ ] Behavior when a company has no row (404 vs empty defaults)

## Impexium / re:members team

- [ ] SSO flow on my.autocare.org (OAuth2, SAML, OpenID Connect)
- [ ] Claims after login (org ID, org name, user display name, roles)
- [ ] Org-level vs user-level report access
- [ ] Register Wrapped as relying party on existing SSO tenant
- [ ] Session model (shared cookie domain vs BFF token exchange)
- [ ] Redirect URLs for dev, staging, and production

## Auto Care infrastructure

- [ ] Hosting path (e.g. `my.autocare.org/wrapped`)
- [ ] API service owner for `GET /api/wrapped/report`
- [ ] Secrets management for Snowflake service account
- [ ] Staging companies for UAT: zero events, average, high engagement

## Sign-off

| Area | Owner | Date | Notes |
|------|-------|------|-------|
| Snowflake schema | | | |
| Impexium SSO | | | |
| API deployment | | | |
