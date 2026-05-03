# Slick

Signal-driven growth operating system for CRO and performance agencies.

## Local Development

Required:

- Node.js `22.13+`
- npm
- Docker

Start Postgres:

```bash
docker compose up -d postgres
```

Install dependencies:

```bash
npm install
```

Run the app:

```bash
npm run dev
```

API documentation:

- Human-readable reference: `http://localhost:3000/docs/api`
- n8n end-to-end flow: `http://localhost:3000/docs/api#n8n-flow`
- OpenAPI JSON: `http://localhost:3000/api/openapi.json`
- OpenAPI JSON download: `http://localhost:3000/api/openapi.json?download=1`
- Developer portal: `http://localhost:3000/developers`

Verify:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run the local commit gate:

```bash
npm run verify:commit
```

Run the full CI-equivalent gate:

```bash
npm run verify
```

## Commit Gate

This repo uses a committed Git pre-commit hook in `.githooks/pre-commit`.

Install hooks for the current checkout:

```bash
npm run hooks:install
```

`npm install` also runs the hook installation through `prepare`.

Before a commit is created, the hook runs:

```bash
npm run verify:commit
```

That means lint, typecheck, and tests must pass before Git creates the commit. The full GitHub Actions pipeline still runs the production build.

## Test Results

CI runs tests with a generated report:

```bash
npm run test:ci
```

The report is written to `reports/test-results.md` locally. In GitHub Actions, the same report is published into the workflow summary and uploaded as the `test-results` artifact.

## Architecture

- [MVP Architecture](docs/mvp-architecture.md)
- [Implementation Strategy](docs/implementation-strategy.md)
- [Architecture Sketch](docs/architecture-sketch.md)
- [n8n End-to-End Flow](docs/n8n-end-to-end-flow.md)
- [Policy-Routed Approval Architecture](docs/policy-routed-approval-architecture.md)

## Secrets

Do not commit real secrets. Use `.env.local` for local runtime values and keep `.env.example` as the documented shape only.
