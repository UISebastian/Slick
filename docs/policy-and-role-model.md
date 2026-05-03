# Policy And Role Model

Slick policy checks live in `src/server/modules/policies`. The MVP keeps policy
definitions as TypeScript data so behavior can change by replacing the policy
set passed to the engine. A later DB-backed policy loader can use the same
`PolicySet` shape.

## Roles And Capabilities

Roles are defined in `src/server/auth/current-user.ts`; capabilities are defined
in `src/server/auth/permissions.ts`.

| Role | Purpose |
| --- | --- |
| `owner` | Full agency control, including future policy management. |
| `admin` | Human admin with review, dispatch, workflow, and dead-letter authority. |
| `reviewer` | Human reviewer for signal, draft, dispatch, and reply outcome decisions. |
| `operator` | Workflow operator for retry, dead-letter, and blocking operations. |
| `viewer` | Read-only queue and audit visibility. |
| `automation` | n8n/API actor for guarded automation paths such as dispatch blocking, reply classification, and workflow retry. |

Use capabilities for new guarded decisions. Legacy `requireRole` still supports
minimum human access checks, but policies provide the narrower control surface.

## Guarded Decisions

The default policy set covers these decision IDs:

| Decision | Guard helper |
| --- | --- |
| `signal.approve`, `signal.reject` | `guardSignalDecision` |
| `draft.approve`, `draft.reject` | `guardDraftDecision` |
| `dispatch.approve`, `dispatch.block` | `guardDispatchDecision` |
| `reply.classify_outcome` | `guardReplyOutcomeClassification` |
| `workflow.retry` | `guardWorkflowRetry` |
| `dead_letter.resolve`, `dead_letter.ignore` | `guardDeadLetterHandling` |

Each guard returns `allow`, `reasons`, `severity`, `requiredRole`,
`requiredCapability`, and audit metadata. API routes and n8n-facing use cases
should evaluate the guard immediately before changing status or writing a
decision record. On deny, return a forbidden or validation response with the
redacted `reasons` array and append the audit metadata where appropriate.

## Updating Policies

Runtime code should call `evaluatePolicy` or a guard with an explicit `policySet`
when the agency has stored overrides. The test suite demonstrates changing the
draft approval threshold from `70` to `90` by patching policy data; the guard
code path does not change.
