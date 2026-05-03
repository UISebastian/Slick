# n8n End-to-End Flow

Status: MVP runnable slice plus contracted downstream automation commands.

## Requirement Understanding

Developers need to understand how n8n orchestrates work across Slick without bypassing the Product API boundary. The flow must show:

- which system owns each step
- which Slick API contract is used
- what is runnable locally today
- which downstream commands are already schema-contracted
- where Admin or AI may decide, and how policy routes that ownership

## API Design

All n8n writes go through:

```http
POST /api/automation/commands
Content-Type: application/json
Idempotency-Key: <stable-key-per-logical-write>
X-Correlation-Id: <stable-flow-run-id>
```

The command envelope uses:

```json
{
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
  "payload": {}
}
```

The current dispatcher implements `signals.import`. The remaining command types validate against the OpenAPI/Zod contract and return `422` until their use cases are implemented.

## Data Modeling

End-to-end flow:

1. `n8n` collects a source-backed signal.
2. `n8n` posts `signals.import`.
3. `Slick` creates a `signal` and `review_request`.
4. `Slick` evaluates admin-editable routing policies to decide whether `Admin`, `AI`, `shadow_ai`, or `blocked` owns the pending review.
5. `Admin` or `AI` approves or rejects the signal. AI can decide only when policy explicitly allows it and source quality, evidence confidence, freshness, ICP match, model confidence, and risk thresholds pass. Missing policy coverage or failed thresholds escalate to Admin.
6. `Slick` moves approved signals to `context.queued`.
7. `n8n` polls `GET /api/context-queue?limit=50`.
8. `n8n` later posts `context.complete` or `context.fail`.
9. Downstream commands continue through draft, dispatch, reply, and outcome flows, with Slick-owned approval gates between automated preparation steps.

Policy-routed approval architecture:

```txt
docs/policy-routed-approval-architecture.md
```

The important design point: AI recommendations are policy inputs, not final authority. The Product API evaluates the policy route and applies the final state transition only after the relevant policy allows the decision.

Command coverage:

| Command | Flow | Current status | Purpose |
| --- | --- | --- | --- |
| `signals.import` | `signals.import` | Implemented | Import candidates, dedupe, create review requests |
| `context.complete` | `context.build` | Schema ready | Persist source-backed context after approval |
| `context.fail` | `context.build` | Schema ready | Record context build failure |
| `draft.complete` | `draft.generate` | Schema ready | Submit generated draft for Slick review |
| `draft.fail` | `draft.generate` | Schema ready | Record draft generation failure |
| `dispatch.record_sent` | `dispatch.send` | Schema ready | Record provider send result |
| `dispatch.fail` | `dispatch.send` | Schema ready | Record provider send failure |
| `reply.ingest` | `replies.ingest` | Schema ready | Ingest normalized reply metadata |
| `outcome.log` | `outcomes.remind` | Schema ready | Log outcome or reminder result |

## Error Handling

n8n must branch on these response classes:

| Status | Behavior |
| --- | --- |
| `200` | Idempotent replay; continue with the returned prior result. |
| `202` | Command accepted; continue the workflow. |
| `400` | Contract error; dead-letter with validation details. |
| `401` | Auth misconfiguration; pause the workflow and alert operations. |
| `403` | Policy or role denial; surface to Slick Admin. |
| `409` | Idempotency key conflict; stop retrying and dead-letter. |
| `422` | Valid command type but unimplemented or unprocessable; route to implementation backlog or dead-letter. |
| `500` | Retry with backoff, then dead-letter. |

Every error includes `error.requestId` and `error.correlationId`.

## Security Model

- n8n never writes directly to Postgres.
- Production n8n requests use a scoped Slick service account.
- Each mutating command includes `Idempotency-Key`.
- Each workflow run carries one `X-Correlation-Id`.
- External source text is evidence, not instruction.
- Secrets stay in n8n credentials or Slick environment, never in workflow exports.
- n8n can prepare work; Slick owns approvals, policy gates, audit, and status transitions.

## Versioning Strategy

The automation envelope is versioned with:

```json
{
  "schemaVersion": "2026-04-30"
}
```

Additive command fields are backward-compatible. Breaking command shape changes require a new schema version and a compatibility window where both versions validate.

## Local Runbook

Start Slick:

```bash
npm run dev
```

Start n8n:

```bash
docker compose -f docker-compose.n8n.yml up -d
```

Open n8n:

```txt
http://localhost:5679
```

Import this workflow:

```txt
n8n/workflows/slick-local-signal-import.json
```

Run it manually. It posts to:

```txt
POST http://host.docker.internal:3000/api/automation/commands
```

Inspect the result:

```bash
curl -sS 'http://localhost:3000/api/reviews?status=pending&limit=50'
```

Approve the signal in the Slick Admin UI:

```txt
http://localhost:3000/admin
```

Then inspect the n8n-ready context queue:

```bash
curl -sS 'http://localhost:3000/api/context-queue?limit=50'
```

## Trade-offs

The local workflow is deliberately narrow: it demonstrates the real Product API boundary without pretending n8n can approve business decisions. The full lifecycle is visible and contracted, but only `signals.import` dispatches today.

## Optional Improvements

- Add `context.complete` persistence and dispatch it from `/api/automation/commands`.
- Add workflow-run records so each n8n execution has a first-class Slick object.
- Add dead-letter API endpoints for failed command replay.
- Add webhook callbacks from Slick to n8n instead of polling queues where latency matters.
- Add service-account API key auth for the automation actor.
