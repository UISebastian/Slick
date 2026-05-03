# Slick Quality Engineering and TDD Playbook

## 1. Requirement Understanding

Slick Release 0.1, "Signal Foundry", must turn external buying signals into controlled review work:

- import signal candidates from n8n/API/manual sources
- deduplicate repeated candidates by tenant and deterministic dedupe key
- create a pending signal review request for newly imported signals
- allow only permitted users to approve or reject pending reviews
- move approved signals into `context.queued`
- keep rejected signals out of the context queue
- preserve idempotency, auditability, correlation IDs, and Product API ownership

Correctness is behavioral, not coverage-driven. A change is not done because lines are covered; it is done when the relevant workflow contract, invalid states, and failure propagation are tested.

## 2. Risk Analysis

High-risk areas for this MVP:

- Idempotency: replaying the same operation must be safe, while reusing a key for a different body must fail.
- Status transitions: ad hoc jumps can corrupt queues and make n8n act on the wrong work.
- Authorization and policy: viewers must never approve business decisions; automation must not bypass human review.
- Dedupe: repeated source data must not create duplicate review work.
- Review decisions: approval, rejection, and changes-requested behavior differs by object type.
- Contract validation: n8n payloads must reject malformed IDs, missing idempotency keys, unknown command types, and untrusted extra fields.
- Tenant boundaries: all reads and writes must be scoped by `agencyId`.
- Audit and correlation: important state changes must leave enough evidence to investigate failures.
- In-memory adapters: current tests can pass while future Postgres adapters introduce transaction, uniqueness, or ordering bugs.
- Dashboard mock data: UI confidence must not be mistaken for production end-to-end behavior.

## 3. Test Strategy

Use a test pyramid with workflow behavior at the center:

- Unit tests for pure logic: schemas, policy guards, status transition tables, idempotency hashing/conflict behavior, mappers.
- Use-case tests for business workflows: import, review decision, context queue, failure paths, authorization.
- API contract tests for route envelopes: status codes, error shape, request/correlation headers, idempotency headers.
- Integration tests once Postgres adapters land: uniqueness constraints, transaction rollback, tenant isolation, ordering, migration validation.
- E2E smoke tests once dashboard actions are wired: import fixture data, open Admin Signal Review, approve/reject, verify queue counts.
- Non-functional checks before release: build, lint, typecheck, CI report, basic load/concurrency probes around idempotent writes.

Default local loop:

```bash
npm run test:watch
```

Pre-commit confidence gate:

```bash
npm run verify:commit
```

Release confidence gate:

```bash
npm run verify
```

## 4. Test Cases

### Signal Import

- Scenario: new valid signal candidate is imported.
- Steps: reset the workflow store; call `importSignals` with a unique idempotency key and one valid candidate.
- Expected result: one signal is created in `signal.triage_requested`; one pending `approve_signal` review exists; audit includes import and status events.

### Import Replay

- Scenario: n8n retries the same import after a network timeout.
- Steps: call `importSignals` twice with the same idempotency key and identical body.
- Expected result: second response has `idempotentReplay: true`; no duplicate signal or review is created.

### Idempotency Key Misuse

- Scenario: caller reuses an idempotency key with a changed request body.
- Steps: execute an idempotent operation, then execute again with the same key and different body.
- Expected result: operation fails with `409 conflict`; no second side effect occurs.

### Dedupe Without Replay

- Scenario: same source signal arrives in a later batch with a different idempotency key.
- Steps: import candidate A; import candidate A again with a new idempotency key.
- Expected result: `dedupedCount` increments; existing signal is returned with `created: false`; no duplicate review is created.

### Review Approval

- Scenario: reviewer approves a pending signal review.
- Steps: import a signal; list pending reviews; call `decideReview` with `approved`.
- Expected result: review is approved; signal moves through `signal.approved` to `context.queued`; context queue contains the signal.

### Review Rejection

- Scenario: reviewer rejects a pending signal review.
- Steps: import a signal; decide the pending review with `rejected`.
- Expected result: review is rejected; signal is `signal.rejected`; context queue remains empty.

### Unauthorized Decision

- Scenario: viewer attempts to approve a pending signal.
- Steps: import a signal as owner/admin; call `decideReview` as viewer.
- Expected result: `PolicyDeniedError`; signal and review remain pending; no context queue item is created.

### Invalid Signal Decision

- Scenario: caller requests changes on a signal review.
- Steps: import a signal; call `decideReview` with `changes_requested`.
- Expected result: `422 unprocessable_entity`; signal reviews only support approve/reject.

### Automation Command Contract

- Scenario: n8n sends `signals.import` through `/api/automation/commands`.
- Steps: parse a command with schema version, correlation ID, idempotency key, actor, and payload.
- Expected result: command validates and dispatches into the signal import use case.

### API Error Contract

- Scenario: route validation fails.
- Steps: call a route through `handleApiRoute` with `x-request-id` and `x-correlation-id`.
- Expected result: response includes stable error code, status, details, request ID, and correlation ID.

## 5. Edge Cases

- Empty import batch, over-100 import batch, and partially invalid batch.
- `icpMatchScore` at `0`, `100`, missing, negative, and above `100`.
- Missing optional company domain where dedupe still has to work.
- Whitespace-only strings after Zod trimming.
- Source URLs that are syntactically invalid or point to unsupported schemes.
- Duplicate dedupe keys inside one batch.
- Existing deduped signal with no pending review request.
- Review request already decided before a replayed or late decision arrives.
- Approval on `signal.detected`, `signal.rejected`, `context.queued`, or unrelated statuses.
- Cross-tenant access: valid object ID from another agency.
- Concurrent imports using the same dedupe key or idempotency key.
- Failed idempotent operation followed by retry.
- Automation command with mismatched `flow` and `commandType`.
- Correlation ID present in header but missing or different in body.
- Scraped evidence containing prompt-injection text, huge payloads, or unexpected object shapes.
- n8n provider timeout after Slick committed the state change.

## 6. Automation Plan

Automate these first:

- Schema and contract tests for every public API/n8n command shape.
- Use-case workflow tests for import, review decision, context queue, rejection, dedupe, and authorization.
- Idempotency tests for replay, key/body mismatch, failed operations, and operation scoping.
- Policy guard matrix tests for roles, capabilities, and critical constraints.
- Status transition table tests for every allowed transition and representative rejected jumps.
- API route tests for response envelopes and header propagation.

Add these when infrastructure is ready:

- Postgres integration tests using migrations against an isolated test database.
- Transaction rollback tests for review decision failures.
- Playwright smoke tests for the Admin review flow once buttons call live APIs.
- Lightweight concurrency tests around import dedupe and idempotency.
- CI migration validation, including forward-only migration checks.

## 7. Optional Improvements

- Add `src/test/workflow-fixtures.ts` as the shared source for users and Signal Foundry candidates.
- Prefer Given/When/Then test names that describe business behavior.
- Require every new use case PR to include at least one happy path, one policy failure, one invalid-state failure, and one idempotency or replay case when applicable.
- Keep test data realistic but minimal; large fixture files should be reserved for contract or E2E tests.
- Mark tests that are intentionally pending for future Postgres or dashboard wiring with clear TODOs and owner context.
- Use the generated `reports/test-results.md` as the release discussion artifact, not as a coverage trophy.
