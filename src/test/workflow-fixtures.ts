import type { CurrentUser } from "@/server/auth/current-user";
import type { ImportSignalCandidate } from "@/server/modules/signals/types";

export const testAgencyId = "00000000-0000-4000-8000-000000000010";

export function testUser(role: CurrentUser["role"] = "owner"): CurrentUser {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    agencyId: testAgencyId,
    email: `${role}@example.com`,
    role
  };
}

export function signalCandidate(
  overrides: Partial<ImportSignalCandidate> = {}
): ImportSignalCandidate {
  return {
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
    dedupeKey: "example.com:cro-role:2026-04-26",
    ...overrides
  };
}

