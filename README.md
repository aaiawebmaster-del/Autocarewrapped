
  # Auto Care Wrapped

  Company-scoped engagement report SPA with Impexium SSO auth and Snowflake-backed data.

  Original Figma prototype: https://www.figma.com/design/iuOOFAZJ1u5vTsRYNlIM3N/Engagement-Tool-Prototype-1

  ## Running locally

  ```bash
  npm i
  npm run dev
  ```

  Local dev loads the **Dayco Incorporated** report (`1101050`) from `public/data/reports/1101050.json` via `.env.development`.

  Switch mock scenarios with `VITE_MOCK_REPORT_SCENARIO=zero-events` (requires removing or clearing `VITE_DEV_RECORD_NUMBER`).

  ## Public demo (no SSO)

  A fictional **Demo Company** report is available for judges, stakeholders, and share links:

  - Local: [http://localhost:5173/demo](http://localhost:5173/demo) (or `/?record=9999999&embed=1`)
  - Production Netlify: `https://<your-site>/demo`

  Data lives in [`public/data/reports/9999999.json`](public/data/reports/9999999.json). Demo traffic is excluded from usage analytics and omitted from the admin report catalog.

  ## Integration docs

  - [Architecture brief (HTML)](docs/architecture-brief.html)
  - [Architecture brief (PDF)](docs/auto-care-wrapped-architecture.pdf)
  - [Discovery checklist](docs/discovery-checklist.md)
  - [Snowflake column mapping](docs/snowflake-column-mapping.md)
  - [Reference API](server/README.md)
  - [Staging UAT](docs/staging-uat.md)

  ## Production build

  ```bash
  npm run build
  ```

  Configure `.env.production` from `.env.example` before deploying to my.autocare.org.
