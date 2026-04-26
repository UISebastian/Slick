import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentUser } from "../../../auth/current-user";
import { decideReview } from "../../reviews/use-cases/decide-review";
import { listReviews } from "../../reviews/use-cases/list-reviews";
import { resetWorkflowMemoryStore } from "../../workflows/in-memory-store";
import { listContextQueue } from "../../workflows/use-cases/list-context-queue";
import { importSignals } from "./import-signals";
import { listSignals } from "./list-signals";

const user: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  agencyId: "00000000-0000-4000-8000-000000000010",
  email: "owner@example.com",
  role: "owner"
};

const importInput = {
  correlationId: "corr-signal-review-test",
  signals: [
    {
      campaignId: "00000000-0000-4000-8000-000000000020",
      signalRuleId: "00000000-0000-4000-8000-000000000030",
      sourceType: "apify" as const,
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
};

describe("signal review flow", () => {
  beforeEach(() => {
    resetWorkflowMemoryStore();
  });

  it("imports a signal, creates a review request, and queues context after approval", async () => {
    const imported = await importSignals({
      input: importInput,
      idempotencyKey: "signal-import-test-1",
      user
    });

    expect(imported.importedCount).toBe(1);
    expect(imported.signals[0]?.status).toBe("signal.triage_requested");

    const replayedImport = await importSignals({
      input: importInput,
      idempotencyKey: "signal-import-test-1",
      user
    });

    expect(replayedImport.idempotentReplay).toBe(true);

    const triageSignals = await listSignals({
      input: {
        status: "signal.triage_requested",
        limit: 50
      },
      user
    });
    expect(triageSignals.count).toBe(1);

    const pendingReviews = await listReviews({
      input: {
        status: "pending",
        limit: 50
      },
      user
    });
    expect(pendingReviews.count).toBe(1);

    const decided = await decideReview({
      reviewRequestId: pendingReviews.reviews[0]!.id,
      input: {
        decision: "approved",
        decisionNote: "Looks relevant."
      },
      idempotencyKey: "review-decision-test-1",
      user
    });

    expect(decided.reviewRequest.status).toBe("approved");
    expect(decided.object?.status).toBe("context.queued");

    const contextQueue = await listContextQueue({
      input: {
        limit: 50
      },
      user
    });

    expect(contextQueue.count).toBe(1);
    expect(contextQueue.items[0]?.signalId).toBe(imported.signals[0]?.signalId);
  });
});
