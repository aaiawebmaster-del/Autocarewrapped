# Reference API (Auto Care stack integration)

Production `GET /api/wrapped/report` responsibilities:

1. **Auth middleware** — validate Impexium SSO session from cookie; return 401 if missing.
2. **Tenant resolution** — read org ID from SSO claims; map to Snowflake `company_id` server-side.
3. **Snowflake query** — `SELECT * FROM WRAPPED.V_COMPANY_REPORT_YYYY WHERE company_id = ?`
4. **Response** — map row to `WrappedReport` JSON (see `src/types/wrappedReport.ts`).

See [`docs/snowflake-column-mapping.md`](../docs/snowflake-column-mapping.md) for field mapping.

## Local reference server

```bash
node server/reference-api.mjs
```

Test with cookie:

```bash
curl -H "Cookie: mock_auth=1" http://localhost:8787/api/wrapped/report
```

## Dev SPA

Vite serves the same endpoints via `server/vite-plugin.ts` when running `npm run dev`.

Set `VITE_USE_MOCK_AUTH=true` in `.env.development` to skip SSO and use sample fixtures.

## Snowflake (Snowpark)

Use [Snowpark API](https://docs.snowflake.com/en/developer-guide/snowpark) on the server only — never in the browser.

```python
# Example sketch (Python Snowpark on Auto Care API service)
session.table("WRAPPED.V_COMPANY_REPORT_2026").filter(col("COMPANY_ID") == company_id)
```
