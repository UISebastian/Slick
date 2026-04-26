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

Verify:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Architecture

- [MVP Architecture](docs/mvp-architecture.md)
- [Implementation Strategy](docs/implementation-strategy.md)
- [Architecture Sketch](docs/architecture-sketch.md)

## Secrets

Do not commit real secrets. Use `.env.local` for local runtime values and keep `.env.example` as the documented shape only.
