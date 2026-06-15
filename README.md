
  # Auto Care Wrapped

  Company-scoped engagement report SPA with Impexium SSO auth and Snowflake-backed data.

  Original Figma prototype: https://www.figma.com/design/iuOOFAZJ1u5vTsRYNlIM3N/Engagement-Tool-Prototype-1

  ## Running locally

  ```bash
  npm i
  npm run dev
  ```

  Local dev uses mock auth and sample data (see `.env.development`). Switch scenarios with `VITE_MOCK_REPORT_SCENARIO=zero-events`.

  ## Integration docs

  - [Architecture brief (print to PDF)](docs/architecture-brief.html)
  - [Discovery checklist](docs/discovery-checklist.md)
  - [Snowflake column mapping](docs/snowflake-column-mapping.md)
  - [Reference API](server/README.md)
  - [Staging UAT](docs/staging-uat.md)

  ## Production build

  ```bash
  npm run build
  ```

  Configure `.env.production` from `.env.example` before deploying to my.autocare.org.
