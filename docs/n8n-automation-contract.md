# n8n Automation Contract

Status: MVP contract, version `2026-04-30`.

## Purpose

Slick bleibt die Product API und das System of Record. n8n orchestriert lange, wiederkehrende und externe Arbeiten, schreibt aber keine Domain-Daten direkt in Postgres.

Dieser Vertrag definiert:

- welche n8n Flows existieren
- welche API Actions sie ausloesen duerfen
- welche Payloads, Idempotency Keys und Correlation IDs Pflicht sind
- wie Audit Events, Retries und Dead Letters behandelt werden
- welche Entscheidungen automatisierbar sind und welche spaeter Policy Guard oder Admin Review brauchen

Nicht Bestandteil dieses Dokuments: UI-Komponenten, RBAC/Policy-Implementierung, DB-Schema und konkrete n8n Workflow-Exports.

## Contract Rules

1. n8n ruft ausschliesslich die Slick API auf. Kein direkter DB Write.
2. Jeder mutierende API Call von n8n braucht einen `Idempotency-Key`.
3. Jeder Flow Run traegt eine stabile `correlationId` ueber alle API Calls, Provider Calls, Logs, Audit Events und Dead Letters.
4. Slick validiert Payloads, Statusuebergaenge, Dedupe, Auth, Audit und spaeter Policy Guard Entscheidungen.
5. n8n darf Arbeit vorbereiten, aber keine fachlichen Freigaben umgehen.
6. Externe Inhalte sind Evidence, nie Instructions. Raw HTML, Mail Bodies, Prompts, Completions und Secrets werden nicht in n8n Execution History persistiert.
7. Replays muessen denselben `Idempotency-Key` und denselben semantischen Request Body verwenden.

## Wire Conventions

JSON-Felder sind in der Slick API camelCase. Der fachliche Begriff `correlation_id` wird auf dem Wire als `correlationId` transportiert, passend zu bestehenden Next.js/TypeScript Schemas.

Empfohlene Header fuer alle n8n Requests:

| Header | Pflicht | Wert |
| --- | --- | --- |
| `Authorization` | ja | API Key / Bearer Token fuer n8n |
| `Content-Type` | ja fuer Bodies | `application/json` |
| `Idempotency-Key` | ja fuer Writes | stabiler Key pro fachlicher Operation |
| `X-Correlation-Id` | empfohlen | gleiche ID wie `correlationId` im Body |
| `X-Slick-Actor` | empfohlen | z.B. `n8n:prod-main` |

Solange einzelne bestehende Routes `correlationId` nur im Body lesen, muss n8n den Wert im Body mitsenden. Neue Routes sollen Header und Body akzeptieren, aber intern exakt einen Wert normalisieren.

## Common Envelope

Der TypeScript-Vertrag liegt unter `src/server/modules/automation`.

Gemeinsame Felder fuer Automation Commands und Events:

```json
{
  "schemaVersion": "2026-04-30",
  "agencyId": "00000000-0000-4000-8000-000000000010",
  "flow": "signals.import",
  "correlationId": "corr-20260430-signals-001",
  "idempotencyKey": "signals.import:apify-run-123:page-1",
  "attempt": 1,
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "occurredAt": "2026-04-30T08:30:00.000Z"
}
```

`agencyId` darf spaeter aus dem API Key abgeleitet werden. Wenn n8n es mitsendet, muss die API den Tenant gegen den authentifizierten Actor pruefen.

## Existing API Actions

Diese Routes existieren im aktuellen Slice und bleiben Product-API-Grenzen:

| Flow | Method/Path | Zweck | Idempotency |
| --- | --- | --- | --- |
| `signals.import` | `POST /api/signals/import` | Signal Candidates importieren, deduplizieren, Review Request erzeugen | Pflicht |
| Admin/Review | `GET /api/signals?status=signal.triage_requested&limit=50` | Signale listen | nein |
| Admin/Review | `POST /api/signals/{id}/approve` | Signal via Review-Rolle freigeben | empfohlen |
| Admin/Review | `POST /api/signals/{id}/reject` | Signal ablehnen | empfohlen |
| Admin/Review | `GET /api/reviews?status=pending&limit=50` | Review Queue | nein |
| Admin/Review | `POST /api/reviews/{id}/decision` | Review entscheiden | empfohlen |
| `context.build` | `GET /api/context-queue?limit=50` | freigegebene Signale fuer Context Build pollen | nein |
| Monitoring | `GET /api/health` | API Health | nein |

Neue n8n-Write-Actions sollten bevorzugt ueber `POST /api/automation/commands` laufen und dort gegen `automationCommandSchema` validiert werden. Route Adapter duerfen danach in modulare Use Cases dispatchen.

## Command Types

Mutierende n8n Commands sind im Code als discriminated union modelliert:

- `signals.import`
- `context.complete`
- `context.fail`
- `draft.complete`
- `draft.fail`
- `dispatch.record_sent`
- `dispatch.fail`
- `reply.ingest`
- `outcome.log`

Alle Commands brauchen `correlationId`, `idempotencyKey`, `flow`, `actor` und `payload`.

## Flow 1: Signal Collection and Import

Trigger:

- Schedule in n8n, z.B. alle 1-6 Stunden pro aktive Kampagne.
- Optional manueller Replay aus Admin Dead Letter Ansicht.
- Optional externer Webhook, wenn eine Quelle neue Kandidaten meldet.

n8n Schritte:

1. Lade aktive Signal Rules ueber einen zukuenftigen Read-Endpunkt.
2. Starte Apify Actor oder externe Quelle.
3. Normalisiere Resultate zu Signal Candidates.
4. Berechne `dedupeKey` deterministisch aus Tenant, Source, Company/Domain, Signal Rule und Observed Date.
5. Sende Batch an Slick API.

Current API request:

```http
POST /api/signals/import
Idempotency-Key: signals.import:apify-run-123:page-1
X-Correlation-Id: corr-20260430-signals-001
Content-Type: application/json
```

```json
{
  "correlationId": "corr-20260430-signals-001",
  "signals": [
    {
      "campaignId": "00000000-0000-4000-8000-000000000020",
      "signalRuleId": "00000000-0000-4000-8000-000000000030",
      "sourceType": "apify",
      "sourceUrl": "https://example.com/jobs/cro",
      "sourceRunId": "apify-run-123",
      "observedAt": "2026-04-30T08:15:00.000Z",
      "companyName": "Example GmbH",
      "companyDomain": "example.com",
      "personRole": "Head of Ecommerce",
      "signalSummary": "Example GmbH is hiring for a CRO role.",
      "evidence": {
        "snippets": ["Hiring CRO role"],
        "sourceCapturedAt": "2026-04-30T08:15:00.000Z"
      },
      "icpMatchScore": 82,
      "dedupeKey": "example.com:cro-role:2026-04-30"
    }
  ]
}
```

Expected response:

```json
{
  "signals": [
    {
      "signalId": "00000000-0000-4000-8000-000000000040",
      "reviewRequestId": "00000000-0000-4000-8000-000000000050",
      "dedupeKey": "example.com:cro-role:2026-04-30",
      "status": "signal.triage_requested",
      "created": true
    }
  ],
  "importedCount": 1,
  "dedupedCount": 0,
  "correlationId": "corr-20260430-signals-001",
  "idempotentReplay": false
}
```

Audit events:

- `signal.imported`
- `signal.import_deduped`
- `signal.status_changed`
- `review.requested`

Until audit events support top-level correlation fields, include `correlationId` and `idempotencyKey` in the audit `after` payload for n8n-originated writes.

## Flow 2: Signal Triage

Trigger:

- Admin opens review queue.
- n8n may notify reviewers when pending review count crosses a threshold.

n8n allowed:

- Poll pending reviews for notification purposes.
- Send Slack/Email notification linking to Admin Dashboard.

n8n not allowed:

- Approve or reject signals directly.
- Put approve/reject buttons into Slack/Email notifications in the MVP.

Decision owner:

- Admin Dashboard today.
- Policy Guard later, only when explicit policy rules allow auto-triage.

## Flow 3: Context Build

Trigger:

- n8n polls `GET /api/context-queue?limit=50`.
- Items are signals in `context.queued`.

Queue item fields currently returned:

```json
{
  "id": "00000000-0000-4000-8000-000000000040",
  "agencyId": "00000000-0000-4000-8000-000000000010",
  "signalId": "00000000-0000-4000-8000-000000000040",
  "campaignId": "00000000-0000-4000-8000-000000000020",
  "signalRuleId": "00000000-0000-4000-8000-000000000030",
  "status": "context.queued",
  "sourceType": "apify",
  "sourceUrl": "https://example.com/jobs/cro",
  "sourceRunId": "apify-run-123",
  "observedAt": "2026-04-30T08:15:00.000Z",
  "companyName": "Example GmbH",
  "companyDomain": "example.com",
  "signalSummary": "Example GmbH is hiring for a CRO role.",
  "createdAt": "2026-04-30T08:16:00.000Z",
  "updatedAt": "2026-04-30T08:18:00.000Z"
}
```

Target completion command:

```json
{
  "schemaVersion": "2026-04-30",
  "commandType": "context.complete",
  "flow": "context.build",
  "correlationId": "corr-20260430-context-001",
  "idempotencyKey": "context.complete:signal-00000040:v1",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "signalId": "00000000-0000-4000-8000-000000000040",
    "accountContext": "Short factual account context.",
    "personContext": "Short factual person/role context.",
    "offerBridge": "Why this signal connects to the campaign offer.",
    "sourceRefs": [
      {
        "sourceType": "apify",
        "sourceUrl": "https://example.com/jobs/cro",
        "sourceRunId": "apify-run-123",
        "observedAt": "2026-04-30T08:15:00.000Z",
        "excerpt": "Hiring CRO role"
      }
    ],
    "quality": {
      "score": 74,
      "verdict": "usable",
      "reasons": ["source_url_present", "recent_observation"]
    }
  }
}
```

Failure command:

```json
{
  "commandType": "context.fail",
  "flow": "context.build",
  "correlationId": "corr-20260430-context-001",
  "idempotencyKey": "context.fail:signal-00000040:attempt-5",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "signalId": "00000000-0000-4000-8000-000000000040",
    "failure": {
      "code": "apify_timeout",
      "message": "Apify run timed out",
      "retriable": true,
      "provider": "apify"
    }
  }
}
```

## Flow 4: Draft Generation

Trigger:

- Context snapshot becomes ready.

n8n allowed:

- Fetch context, campaign, ICP, offer, persona and default copy framework through API.
- Call LLM provider through an adapter flow.
- Submit generated draft as `draft.complete` or `draft.fail`.

n8n not allowed:

- Mark draft approved.
- Send the draft.
- Let scraped content override system/developer instructions.

Target completion payload:

```json
{
  "commandType": "draft.complete",
  "flow": "draft.generate",
  "correlationId": "corr-20260430-draft-001",
  "idempotencyKey": "draft.complete:signal-00000040:framework-v1",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "signalId": "00000000-0000-4000-8000-000000000040",
    "contextSnapshotId": "00000000-0000-4000-8000-000000000060",
    "subject": "CRO hiring at Example GmbH",
    "bodyText": "Plain text draft body.",
    "model": "provider-model-name",
    "promptVersion": "default_signal_outreach_v1",
    "quality": {
      "score": 81,
      "verdict": "usable",
      "reasons": ["specific_signal_used", "no_unverified_claims"]
    }
  }
}
```

Expected Slick behavior:

- Persist draft.
- Request draft review.
- Write `draft.ready`, `draft.review_requested`, and `review.requested` audit events.

## Flow 5: Review Notifications

Trigger:

- New pending review request.
- Pending approvals are older than threshold.

n8n allowed:

- Send Slack/Email notification with object summary and Admin Dashboard link.
- Escalate stale approvals to owner/admin channels.

n8n not allowed:

- Include approve/reject action buttons in MVP.
- Mutate review status.

## Flow 6: Dispatch Preparation and Send

Trigger:

- Dispatch is approved through Admin Dashboard or future Policy Guard.

n8n allowed:

- Prepare provider-specific message payload.
- Call SMTP/mailserver after Slick confirms suppression, rate limit and sendability checks.
- Record sent state via `dispatch.record_sent`.
- Record provider send failure via `dispatch.fail`.

n8n not allowed:

- Send without an approved dispatch object.
- Override suppression.
- Retry recipient-level hard bounces as normal sends.

`dispatch.record_sent` payload:

```json
{
  "commandType": "dispatch.record_sent",
  "flow": "dispatch.send",
  "correlationId": "corr-20260430-dispatch-001",
  "idempotencyKey": "dispatch.record_sent:dispatch-00000070:message-id",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "dispatchId": "00000000-0000-4000-8000-000000000070",
    "messageDraftId": "00000000-0000-4000-8000-000000000080",
    "provider": "smtp",
    "providerMessageId": "smtp-provider-id",
    "messageIdHeader": "<message-id@example.com>",
    "sentAt": "2026-04-30T09:00:00.000Z"
  }
}
```

## Flow 7: Reply Ingestion

Trigger:

- IMAP polling.
- Provider webhook later.

n8n allowed:

- Parse provider headers.
- Hash sender email before sending if raw email is not needed.
- Submit reply via `reply.ingest`.
- Add unsubscribe/bounce classification as suggested metadata.

n8n not allowed:

- Autorespond to a human reply.
- Mark sales outcome as won/lost without explicit source or Admin action.

`reply.ingest` payload:

```json
{
  "commandType": "reply.ingest",
  "flow": "replies.ingest",
  "correlationId": "corr-20260430-reply-001",
  "idempotencyKey": "reply.ingest:imap-uid-12345",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "receivedAt": "2026-04-30T10:00:00.000Z",
    "provider": "imap",
    "messageIdHeader": "<reply-id@example.com>",
    "inReplyToHeader": "<message-id@example.com>",
    "referencesHeader": "<message-id@example.com>",
    "senderEmailHash": "sha256-redacted",
    "subject": "Re: CRO hiring at Example GmbH",
    "bodyText": "Redacted or minimized reply body.",
    "classification": "positive"
  }
}
```

## Flow 8: Outcome Logging

Trigger:

- Admin marks outcome.
- n8n sends reminders for stale sent messages or positive replies without outcome.
- Future integrations emit CRM/outreach outcome events.

n8n allowed:

- Create reminders.
- Submit machine-observed outcomes with evidence, e.g. bounce/no_response windows.

Policy/Admin gated:

- Meeting booked/completed, opportunity created, won, lost, or ambiguous outcome updates.

`outcome.log` payload:

```json
{
  "commandType": "outcome.log",
  "flow": "outcomes.remind",
  "correlationId": "corr-20260430-outcome-001",
  "idempotencyKey": "outcome.log:dispatch-00000070:no-response-14d",
  "actor": {
    "type": "n8n",
    "id": "n8n-prod-main"
  },
  "payload": {
    "object": {
      "type": "dispatch",
      "id": "00000000-0000-4000-8000-000000000070"
    },
    "outcomeType": "no_response",
    "occurredAt": "2026-05-14T09:00:00.000Z",
    "notes": "No reply after 14 days."
  }
}
```

## Idempotency

Idempotency scope:

- Tenant/agency
- Operation/command type
- Idempotency key
- Stable request hash

Recommended key format:

```text
{commandType}:{primary-object-or-provider-run}:{semantic-version-or-page}
```

Examples:

- `signals.import:apify-run-123:page-1`
- `context.complete:signal-00000040:v1`
- `draft.complete:signal-00000040:framework-v1`
- `dispatch.record_sent:dispatch-00000070:message-id`
- `reply.ingest:imap-uid-12345`

Expected responses:

- Same key + same body + previous success: return previous result with `idempotentReplay: true`.
- Same key + different body: `409 conflict`.
- Same key + in-progress/failed record: `409 conflict` until replay/dead-letter handling is explicit.

## Correlation IDs

One correlation ID follows the full causal chain:

```text
signal collection -> import -> review -> context -> draft -> review -> dispatch -> reply -> outcome
```

If a flow starts from an existing object, derive the correlation ID from the upstream object when available. If no upstream exists, n8n creates one:

```text
corr-{yyyyMMdd}-{flow}-{short-run-id}
```

Correlation IDs must be present in:

- API request body or `X-Correlation-Id`
- n8n execution metadata
- provider call logs where possible
- audit `after` payload until top-level audit correlation exists
- dead letter items
- Admin monitoring events

## Retries

Retryable:

- Network timeout
- Provider 408/429/5xx
- Slick API 5xx
- Temporary provider quota/rate limit
- `failure.retriable: true`

Do not retry automatically:

- 400 validation errors
- 401/403 auth or RBAC failures
- 404 object not found
- 409 idempotency hash mismatch
- 422 domain rule failure
- Policy deny
- Source quality `blocked`

Default n8n retry schedule:

| Attempt | Delay |
| --- | --- |
| 1 | immediate |
| 2 | 30s plus jitter |
| 3 | 2m plus jitter |
| 4 | 10m plus jitter |
| 5 | 30m plus jitter |

After the final retry, create a dead letter item. A flow may use shorter limits for expensive LLM/provider calls.

## Dead Letters

Dead letters are not just error logs. They are replayable work items with enough context for Admin triage.

Required fields:

```json
{
  "schemaVersion": "2026-04-30",
  "agencyId": "00000000-0000-4000-8000-000000000010",
  "flow": "context.build",
  "commandType": "context.complete",
  "correlationId": "corr-20260430-context-001",
  "idempotencyKey": "context.complete:signal-00000040:v1",
  "object": {
    "type": "signal",
    "id": "00000000-0000-4000-8000-000000000040"
  },
  "failure": {
    "code": "source_quality_blocked",
    "message": "All source references were below the minimum quality threshold",
    "retriable": false
  },
  "payload": {
    "redacted": true
  },
  "firstFailedAt": "2026-04-30T08:30:00.000Z",
  "lastFailedAt": "2026-04-30T08:45:00.000Z",
  "retryCount": 5,
  "status": "open"
}
```

Admin actions:

- `requeue`: replay with a new idempotency key suffix if the original failed before success.
- `resolve`: mark handled without replay.
- `ignore`: suppress noisy non-actionable item with reason.
- `open source/object`: inspect source quality and object state.

## Audit Events

Every mutating Product API use case should append an audit event.

Minimum event families:

| Event | Actor | When |
| --- | --- | --- |
| `signal.imported` | `n8n` or current member until API keys exist | New signal created |
| `signal.import_deduped` | `n8n` or current member | Candidate matched existing dedupe key |
| `signal.status_changed` | API/use case actor | Status transition |
| `review.requested` | `system` | Human/Policy gate opened |
| `review.approved` / `review.rejected` | member or future policy actor | Gate decided |
| `automation.command.accepted` | `n8n` | API accepted n8n command |
| `automation.command.replayed` | API | Idempotent replay returned |
| `automation.command.rejected` | API | Validation/domain rejection |
| `automation.retry_scheduled` | `n8n` | Retry planned |
| `automation.flow.dead_lettered` | `n8n` | Dead letter created |
| `policy.decision_denied` | policy actor | Policy blocked automation |

Audit payloads must be redacted. Store identifiers, status, counts, failure codes and source references; avoid raw scraped pages, raw email bodies, prompts, completions and credentials.

## Decision Boundaries

Automatable now:

- schema validation
- idempotent replay
- signal dedupe
- queue polling
- source fetches
- source quality scoring as recommendation
- context build as draft evidence
- LLM draft generation as unapproved draft
- notification sending
- retry/dead-letter classification
- reply ingestion and non-final classification
- no-response reminders

Admin or Policy Guard required:

- auto-approving signal triage
- rejecting a signal for business reasons
- approving, rejecting or requesting changes to drafts
- approving dispatch
- overriding suppression or sendability blocks
- changing rate limits
- deciding ambiguous replies/outcomes
- marking meeting/opportunity/won/lost outcomes
- replaying or ignoring high-risk dead letters

Admin-only in MVP:

- Signal approve/reject
- Draft review decisions
- Dispatch approval
- Reply handling after a human response
- Manual outcome truth

Future Policy Guard may automate some of these, but only through explicit policy evaluation and audit events. n8n must call the API and receive an allow/deny decision; it must not duplicate policy logic in workflow nodes.

## Monitoring Contract

The Admin Dashboard needs one-glance health from API-owned data, not from raw n8n execution pages.

Per flow health snapshot:

```json
{
  "flow": "context.build",
  "status": "degraded",
  "observedAt": "2026-04-30T09:05:00.000Z",
  "lastHeartbeatAt": "2026-04-30T09:04:30.000Z",
  "lastSuccessAt": "2026-04-30T08:58:00.000Z",
  "lastFailureAt": "2026-04-30T09:02:00.000Z",
  "queueAgeSeconds": 960,
  "pendingCount": 12,
  "deadLetterCount": 1,
  "policyDenyCount": 0,
  "pendingApprovalCount": 7,
  "sourceQualityScore": 74
}
```

Required dashboard metrics:

- flow health by flow
- oldest queue age by queue
- pending approval count by review type
- policy deny count by flow and reason
- dead letter count by flow and severity
- source quality score by source type/rule
- import created vs deduped count
- retry count and retry age
- last successful heartbeat

## Integration Recommendations

API routes:

- Add `POST /api/automation/commands` and validate with `automationCommandSchema`.
- Add `POST /api/automation/events` and validate with `automationEventSchema`.
- Add `GET /api/automation/health` returning `automationFlowHealthSnapshotSchema[]`.
- Add `GET /api/automation/dead-letters` and admin actions for requeue/resolve/ignore.
- Normalize `Idempotency-Key` and `X-Correlation-Id` in shared HTTP helpers before dispatching use cases.
- Keep module-specific routes as thin adapters; do not place n8n-specific branching in domain use cases.

Dashboard:

- Read monitoring from Product API only.
- Show correlation ID on every object detail and dead letter detail.
- Link each health tile to its queue, recent failures, pending approvals and dead letters.
- Make replay/resolve actions explicit Admin actions, not automatic background behavior.
