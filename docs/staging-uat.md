# Staging and UAT Checklist

## Environment setup

- [ ] Deploy SPA to staging path on my.autocare.org
- [ ] Deploy `GET /api/wrapped/report` with Snowflake secure view
- [ ] Configure Impexium SSO redirect URLs for staging
- [ ] Set production env vars from [`.env.example`](../.env.example)

## Auth and tenant isolation

- [ ] Unauthenticated user receives 401 and sees sign-in gate
- [ ] User A cannot access User B's company report
- [ ] API ignores client-supplied `company_id` (derived from SSO only)

## Sample companies

| Scenario | Env / cookie | Expected UI |
|----------|--------------|-------------|
| Default (Dayco) | `VITE_MOCK_REPORT_SCENARIO=default` | 25% attendance, standard copy |
| Zero events | `VITE_MOCK_REPORT_SCENARIO=zero-events` | 0% attendance, zero-event copy |
| High engagement | `VITE_MOCK_REPORT_SCENARIO=high-engagement` | 75% attendance, celebratory copy |

## Local mock API test

```bash
npm run dev
# VITE_USE_MOCK_AUTH=true uses fixtures without SSO

# Reference API (cookie auth):
node server/reference-api.mjs
curl -H "Cookie: mock_auth=1" http://localhost:8787/api/wrapped/report
```

## Sign-off

- [ ] Snowflake data matches expected metrics for test companies
- [ ] Content variants reviewed by marketing
- [ ] Performance: report API < 2s p95
