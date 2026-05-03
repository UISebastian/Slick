# Admin Automation Operating Model

Status: MVP operating model, aligned with automation contract `2026-04-30`.

## Purpose

The Admin Dashboard is the control room for Slick automation. n8n does the work, the Slick API owns state and validation, and the dashboard lets an operator see whether the growth machine is healthy, blocked, waiting for human decisions, or producing low-quality source material.

This document defines the operating model only. It does not specify UI components or styles.

## Operating Principles

1. The dashboard reads from Slick API state, not from raw n8n execution history.
2. Every automation object should be traceable by `correlationId`.
3. Every mutating automation action should be idempotent and audited.
4. Admin decisions and future Policy Guard decisions are first-class workflow gates.
5. Dead letters are a work queue, not a hidden log.
6. Source quality is monitored because poor evidence creates poor context and poor drafts.

## One-Glance Dashboard Requirements

The first screen should answer six questions without drilling in:

| Question | Metric | Healthy signal |
| --- | --- | --- |
| Are flows alive? | flow health and last heartbeat per flow | all critical flows `healthy` |
| Is work stuck? | oldest queue age and pending count | age below SLO per queue |
| Are humans blocking throughput? | pending approvals by review type | below agreed daily capacity |
| Is Policy Guard blocking automation? | policy denies by flow/reason | expected/low, no sudden spike |
| Is anything unrecoverable? | dead letters by flow/severity | zero critical open items |
| Is source evidence good enough? | source quality score by source/rule | above threshold and stable |

Required top-level flows:

- `signals.collect`
- `signals.import`
- `context.build`
- `draft.generate`
- `review.notify`
- `dispatch.prepare`
- `dispatch.send`
- `replies.ingest`
- `outcomes.remind`

## Health States

Flow health should be computed by the Product API from heartbeats, queue state, failures and dead letters.

| State | Meaning | Example condition |
| --- | --- | --- |
| `healthy` | Flow is running and within SLO | heartbeat fresh, failures normal, queue age OK |
| `degraded` | Flow works but needs attention | queue age above warning, retries rising |
| `down` | Flow is not making progress | heartbeat missing or repeated hard failures |
| `paused` | Flow intentionally stopped | campaign/source/tenant pause |

Recommended severity rules:

- Missing heartbeat for 2 expected intervals: `degraded`.
- Missing heartbeat for 4 expected intervals: `down`.
- Any critical dead letter: `degraded`; repeated critical dead letters: `down`.
- Queue age above warning threshold: `degraded`.
- Queue age above breach threshold: `down`.

## Queue Age Targets

Initial SLO targets can be conservative and adjusted after real volume exists.

| Queue | Warning | Breach | Owner |
| --- | --- | --- | --- |
| Signal import candidates | 30m | 2h | Automation operator |
| Signal triage approvals | 24h | 48h | Admin/reviewer |
| Context build | 30m | 2h | Automation operator |
| Draft generation | 30m | 2h | Automation operator |
| Draft approvals | 24h | 48h | Admin/reviewer |
| Dispatch approvals | 4h | 24h | Admin/reviewer |
| Dispatch send | 15m | 1h | Automation operator |
| Reply ingestion | 10m | 30m | Automation operator |
| Outcome logging | 7d | 14d | Admin/reviewer |

Queue age means oldest item age in an actionable state, not total object age.

## Required Dashboard Panels

### Flow Health

Per flow:

- state: `healthy`, `degraded`, `down`, `paused`
- last heartbeat
- last success
- last failure
- current retry count
- open dead letters
- oldest queue age
- link to filtered run/queue view

### Work Queues

Per queue:

- pending count
- oldest item age
- current status filter
- assigned owner or role
- next expected action
- correlation ID on every row/detail view

Initial queues:

- `signal.triage_requested`
- `context.queued`
- `draft.review_requested`
- `dispatch.review_requested`
- `dispatch.queued`
- replies waiting for human handling
- outcome reminders

### Pending Approvals

Group by review type:

- `approve_signal`
- `approve_draft`
- `approve_dispatch`
- `log_outcome`

For each group show:

- count
- oldest age
- due soon / overdue count
- campaign/source breakdown
- reviewer assignment if available

### Policy Denies

Policy Guard is future-facing, but the dashboard contract should reserve this lane from the start.

Show:

- deny count by flow
- deny reason code
- affected object type
- first seen / last seen
- whether the deny is expected, actionable or noisy

Examples:

- `suppression_match`
- `rate_limit_exceeded`
- `source_quality_blocked`
- `missing_required_approval`
- `tenant_paused`
- `provider_quota_exceeded`

### Dead Letters

Each dead letter needs:

- flow
- command/event type
- severity
- correlation ID
- idempotency key
- object reference
- failure code and redacted message
- retry count
- first failed / last failed
- replay eligibility
- latest payload summary, redacted

Actions:

- requeue
- resolve
- ignore with reason
- open source object
- open audit trail

Replay should create a new audit event and, when needed, a new idempotency key suffix. The dashboard should not silently replay high-risk items.

### Source Quality

Show source quality because it is the earliest warning for bad automation output.

Required metrics:

- average quality score by source type
- blocked/weak/usable/trusted distribution
- source rule with most weak results
- recent score trend
- evidence freshness
- missing source URL count
- Apify/source run failure count

Suggested initial thresholds:

- `trusted`: 85-100
- `usable`: 60-84
- `weak`: 30-59
- `blocked`: 0-29 or policy deny

Weak sources may still be useful for Admin review. Blocked sources must not auto-advance to draft or dispatch.

### Audit Timeline

Every object detail should show an audit timeline with:

- status changes
- review requests and decisions
- automation command accepted/replayed/rejected
- retries and dead letters
- policy allow/deny events
- actor and timestamp
- correlation ID

Keep audit payloads redacted and small.

## Decision Model

### Fully Automatable

These decisions can be deterministic Product API behavior or n8n orchestration:

- validate command payload shape
- reject missing idempotency/correlation metadata
- dedupe signal import candidates
- enqueue next workflow state after approved review
- retry transient provider/API failures
- dead-letter exhausted retries
- score source quality as evidence metadata
- generate draft candidates
- send notifications
- ingest replies
- create no-response reminders

### Policy Guard Required

These may become automated later, but only through explicit Policy Guard allow/deny and audit:

- auto-approve high-confidence signal triage
- auto-reject low-quality signals
- allow draft to skip human review for a tightly scoped campaign
- allow dispatch after draft approval
- sendability and suppression decisions
- tenant/campaign rate-limit decisions
- auto-log unambiguous technical outcomes, e.g. hard bounce
- replay risky dead letters

### Admin Required in MVP

These stay with Admin Dashboard users:

- approve/reject signal
- approve/reject/request changes on draft
- approve/reject dispatch
- override or resolve dead letters with customer impact
- handle positive/ambiguous replies
- mark meeting/opportunity/won/lost outcomes
- change campaign or source operating settings

## Daily Operating Rhythm

Morning check:

1. Review top-level flow health.
2. Clear critical dead letters first.
3. Check queue age breaches.
4. Review pending approvals by oldest age.
5. Inspect source quality trend for active campaigns.
6. Confirm reply ingestion freshness.

During day:

- Watch pending approvals and replies.
- Let n8n retry transient failures.
- Only manually replay after the failure reason is understood.

End of day:

- Confirm no critical queue is in breach.
- Resolve or assign open dead letters.
- Check overdue outcome reminders.

## Runbooks

### Flow Down

1. Check last heartbeat and last success.
2. Open recent failures for the same flow.
3. Compare provider status and Slick API health.
4. Pause affected campaign/source if repeated customer-impacting failures occur.
5. Requeue only after root cause is fixed.

### Queue Age Breach

1. Identify oldest item and status.
2. Check whether the item is waiting for Admin, Policy Guard, provider or API.
3. For Admin waits, escalate to assigned reviewer/owner.
4. For provider/API waits, inspect retries and dead letters.
5. For systematic status mismatch, create a backend issue with object ID and correlation ID.

### Policy Deny Spike

1. Group denies by reason.
2. Check recent policy/rule/config changes.
3. Confirm whether denies are protective or accidental.
4. For protective denies, leave blocked and communicate impact.
5. For accidental denies, fix policy/config through approved path; do not bypass in n8n.

### Dead Letter Triage

1. Read failure code, object state and retry count.
2. Decide whether the underlying object is still current.
3. If provider transient and object still current: requeue.
4. If payload invalid or policy denied: resolve after documenting.
5. If data quality is bad: open source quality view and fix the source/rule.
6. If customer-visible action may duplicate, require owner/admin confirmation before replay.

### Source Quality Drop

1. Identify source type, source rule and campaign.
2. Inspect recent examples and evidence freshness.
3. Compare source URL availability and extraction shape.
4. Pause only the affected source/rule if quality is blocked.
5. Resume after sample quality is back above threshold.

## Data Safety

Dashboard and monitoring payloads should show summaries, identifiers and redacted excerpts.

Do not display or persist in monitoring:

- secrets
- raw provider credentials
- raw scraped pages
- raw LLM prompts/completions
- full email bodies unless required by an explicit product workflow
- unredacted personal email addresses where a hash is sufficient

## API Data Requirements

To support this operating model, Product API should expose:

- flow health snapshots matching `automationFlowHealthSnapshotSchema`
- dead letter list/detail/actions matching `automationDeadLetterSchema`
- pending approval counts by review type
- queue age by workflow status
- policy deny aggregates
- source quality aggregates
- audit timeline by object and correlation ID

Recommended endpoints:

- `GET /api/automation/health`
- `GET /api/automation/dead-letters`
- `POST /api/automation/dead-letters/{id}/requeue`
- `POST /api/automation/dead-letters/{id}/resolve`
- `POST /api/automation/dead-letters/{id}/ignore`
- `GET /api/automation/source-quality`
- `GET /api/audit?correlationId=...`

The current MVP can start with existing endpoints for signals, reviews, context queue and health, then add these route adapters without changing the dashboard ownership model.

## Acceptance Criteria

The Admin Dashboard is operationally ready when an admin can:

- see if every n8n/API flow is alive
- identify the oldest stuck work item
- distinguish "waiting for human" from "automation failed"
- see all policy denies and dead letters
- replay or resolve dead letters with audit
- inspect source quality before blaming the draft generator
- follow one correlation ID from signal import to outcome
