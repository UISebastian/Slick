# Local n8n Test

This local setup runs n8n next to the Slick Next.js app and connects n8n to Slick through the Product API.

## Local URLs

- Slick Admin: `http://localhost:3000/admin`
- Slick Developer Portal: `http://localhost:3000/developers`
- Slick API Docs: `http://localhost:3000/docs/api#n8n-flow`
- Slick OpenAPI: `http://localhost:3000/api/openapi.json`
- n8n: `http://localhost:5679`
- n8n to Slick API from Docker: `http://host.docker.internal:3000`

`host.docker.internal` is important on macOS because the n8n container cannot call the host app through its own `localhost`.

## Start

Start Slick:

```bash
npm run dev
```

Start n8n:

```bash
docker compose -f docker-compose.n8n.yml up -d
```

Open n8n, create the local owner account in the browser, then import:

```txt
n8n/workflows/slick-local-signal-import.json
```

Run the workflow manually. It sends a `signals.import` command to:

```txt
POST http://host.docker.internal:3000/api/automation/commands
```

The command includes:

- `schemaVersion`
- `commandType`
- `flow`
- `correlationId`
- `idempotencyKey`
- `actor`
- `payload.signals[]`

The Slick API validates the automation command, dispatches `signals.import`, creates a signal review request, and returns the import result.

## End-to-End Slice

The local workflow covers the first runnable n8n orchestration slice:

```txt
n8n manual trigger
  -> build signals.import command
  -> POST /api/automation/commands
  -> Slick creates signal + review request
  -> human approval in Slick Admin
  -> n8n polls GET /api/context-queue?limit=50
```

The full end-to-end lifecycle is documented in:

```txt
docs/n8n-end-to-end-flow.md
```

The visual API docs version is available at:

```txt
http://localhost:3000/docs/api#n8n-flow
```

## Smoke Test Without n8n

You can test the same Product API boundary with curl:

```bash
curl -sS -X POST http://localhost:3000/api/automation/commands \
  -H 'Content-Type: application/json' \
  -H 'Idempotency-Key: slick-local-import-001' \
  -H 'X-Correlation-Id: corr-slick-local-001' \
  --data '{
    "schemaVersion": "2026-04-30",
    "commandType": "signals.import",
    "flow": "signals.import",
    "correlationId": "corr-slick-local-001",
    "idempotencyKey": "slick-local-import-001",
    "attempt": 1,
    "actor": {
      "type": "n8n",
      "id": "local-n8n"
    },
    "payload": {
      "signals": [
        {
          "campaignId": "00000000-0000-4000-8000-000000000020",
          "signalRuleId": "00000000-0000-4000-8000-000000000030",
          "sourceType": "api",
          "sourceUrl": "https://example.com/partners/northstar-cart-labs",
          "sourceRunId": "n8n-local-001",
          "observedAt": "2026-04-30T10:00:00.000Z",
          "companyName": "Northstar Cart Labs",
          "companyDomain": "northstar-cart.example",
          "personRole": "Head of Ecommerce",
          "signalSummary": "Local n8n smoke test imported a partner-directory style ecommerce growth signal.",
          "evidence": {
            "sourceType": "partner_directory",
            "sourceName": "Local n8n smoke test",
            "evidenceUrl": "https://example.com/partners/northstar-cart-labs",
            "snippets": [
              "Partner profile references Shopify Plus checkout optimization and CRO services."
            ]
          },
          "icpMatchScore": 88,
          "dedupeKey": "northstar-cart.example:n8n-local-001"
        }
      ]
    }
  }'
```

## Production Boundary

For MVP production hardening:

- n8n authenticates through a scoped service account.
- Slick validates every command through `automationCommandSchema`.
- Mutating commands require `Idempotency-Key`.
- All runs carry `X-Correlation-Id`.
- n8n never writes to Postgres directly.
- Business decisions stay policy-gated in Slick.
- Sensitive data does not go into n8n execution logs.
