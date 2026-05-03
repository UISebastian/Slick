import { beforeEach, describe, expect, it } from "vitest";
import type { CurrentUser } from "../../auth/current-user";
import { listReviews } from "../reviews/use-cases/list-reviews";
import { resetWorkflowMemoryStore } from "../workflows/in-memory-store";
import { executeAutomationCommand } from "./execute-command";

const user: CurrentUser = {
  id: "00000000-0000-4000-8000-000000000001",
  agencyId: "00000000-0000-4000-8000-000000000010",
  email: "owner@example.com",
  role: "owner"
};

describe("executeAutomationCommand", () => {
  beforeEach(() => {
    resetWorkflowMemoryStore();
  });

  it("dispatches n8n signal import commands into the signal import use case", async () => {
    const result = await executeAutomationCommand({
      user,
      command: {
        schemaVersion: "2026-04-30",
        commandType: "signals.import",
        flow: "signals.import",
        correlationId: "corr-local-n8n-test",
        idempotencyKey: "idem-local-n8n-test",
        attempt: 1,
        actor: {
          type: "n8n",
          id: "local-n8n"
        },
        occurredAt: "2026-04-30T10:00:00.000Z",
        payload: {
          signals: [
            {
              campaignId: "00000000-0000-4000-8000-000000000020",
              signalRuleId: "00000000-0000-4000-8000-000000000030",
              sourceType: "api",
              sourceUrl: "https://example.com/partners/northstar",
              sourceRunId: "n8n-local-run-1",
              observedAt: "2026-04-30T10:00:00.000Z",
              companyName: "Northstar Cart Labs",
              companyDomain: "northstar-cart.example",
              personRole: "Head of Ecommerce",
              signalSummary: "Partner profile references Shopify Plus checkout optimization.",
              evidence: {
                sourceName: "Local n8n smoke test",
                snippets: ["Shopify Plus checkout optimization"]
              },
              icpMatchScore: 88,
              dedupeKey: "northstar-cart.example:n8n-local-run-1"
            }
          ]
        }
      }
    });

    expect(result.commandType).toBe("signals.import");
    expect(result.correlationId).toBe("corr-local-n8n-test");

    const reviews = await listReviews({
      input: {
        status: "pending",
        limit: 50
      },
      user
    });

    expect(reviews.count).toBe(1);
  });
});
