import { describe, expect, it } from "vitest";
import {
  automationCommandSchema,
  automationDeadLetterSchema,
  automationFlowHealthSnapshotSchema
} from "./schemas";

const baseCommand = {
  correlationId: "corr-automation-test-1",
  idempotencyKey: "idem-automation-test-1",
  actor: {
    type: "n8n",
    id: "n8n-main"
  }
} as const;

describe("automation contract schemas", () => {
  it("accepts a valid n8n signal import command and applies envelope defaults", () => {
    const parsed = automationCommandSchema.safeParse({
      ...baseCommand,
      commandType: "signals.import",
      flow: "signals.import",
      payload: {
        signals: [
          {
            campaignId: "00000000-0000-4000-8000-000000000020",
            signalRuleId: "00000000-0000-4000-8000-000000000030",
            sourceType: "apify",
            sourceUrl: "https://example.com/jobs/cro",
            sourceRunId: "apify-run-1",
            observedAt: "2026-04-26T10:00:00.000Z",
            companyName: "Example GmbH",
            companyDomain: "example.com",
            personRole: "Head of Ecommerce",
            signalSummary: "Example GmbH is hiring for a CRO role.",
            evidence: {
              snippets: ["Hiring CRO role"]
            },
            icpMatchScore: 82,
            dedupeKey: "example.com:cro-role:2026-04-26"
          }
        ]
      }
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    expect(parsed.data.schemaVersion).toBe("2026-04-30");
    expect(parsed.data.attempt).toBe(1);
    expect(parsed.data.occurredAt).toEqual(expect.any(String));
  });

  it("requires idempotency for mutating automation commands", () => {
    const parsed = automationCommandSchema.safeParse({
      correlationId: "corr-automation-test-2",
      actor: {
        type: "n8n",
        id: "n8n-main"
      },
      commandType: "context.fail",
      flow: "context.build",
      payload: {
        signalId: "00000000-0000-4000-8000-000000000040",
        failure: {
          code: "apify_timeout",
          message: "Apify run timed out",
          retriable: true,
          provider: "apify"
        }
      }
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects command and flow mismatches", () => {
    const parsed = automationCommandSchema.safeParse({
      ...baseCommand,
      commandType: "context.complete",
      flow: "signals.import",
      payload: {
        signalId: "00000000-0000-4000-8000-000000000040",
        sourceRefs: [
          {
            sourceType: "apify",
            sourceRunId: "apify-run-2",
            observedAt: "2026-04-26T10:00:00.000Z"
          }
        ],
        quality: {
          score: 74,
          verdict: "usable"
        }
      }
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts a dead letter item with retry metadata", () => {
    const parsed = automationDeadLetterSchema.safeParse({
      agencyId: "00000000-0000-4000-8000-000000000010",
      flow: "context.build",
      commandType: "context.complete",
      correlationId: "corr-automation-test-3",
      idempotencyKey: "idem-automation-test-3",
      object: {
        type: "signal",
        id: "00000000-0000-4000-8000-000000000040"
      },
      failure: {
        code: "source_quality_blocked",
        message: "All source references were below the minimum quality threshold",
        retriable: false
      },
      payload: {
        signalId: "00000000-0000-4000-8000-000000000040"
      },
      firstFailedAt: "2026-04-26T10:01:00.000Z",
      lastFailedAt: "2026-04-26T10:03:00.000Z",
      retryCount: 2
    });

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error(parsed.error.message);
    }

    expect(parsed.data.status).toBe("open");
  });

  it("rejects impossible dashboard health metrics", () => {
    const parsed = automationFlowHealthSnapshotSchema.safeParse({
      flow: "context.build",
      status: "healthy",
      queueAgeSeconds: -1,
      pendingCount: 0,
      deadLetterCount: 0,
      policyDenyCount: 0,
      pendingApprovalCount: 0
    });

    expect(parsed.success).toBe(false);
  });
});
