import { describe, expect, it } from "vitest";
import type { CurrentUser } from "../../auth/current-user";
import {
  defaultPolicySet,
  guardDeadLetterHandling,
  guardDispatchDecision,
  guardDraftDecision,
  guardReplyOutcomeClassification,
  guardSignalDecision,
  guardWorkflowRetry,
  patchPolicy
} from ".";

const baseUser = {
  id: "00000000-0000-4000-8000-000000000001",
  agencyId: "00000000-0000-4000-8000-000000000010",
  email: "user@example.com"
} satisfies Omit<CurrentUser, "role">;

function user(role: CurrentUser["role"]): CurrentUser {
  return {
    ...baseUser,
    role
  };
}

describe("policy engine guards", () => {
  it("allows reviewers to reject a pending signal", () => {
    const result = guardSignalDecision({
      action: "reject",
      user: user("reviewer"),
      context: {
        objectType: "signal",
        objectId: "sig_1",
        status: "signal.triage_requested",
        targetStatus: "signal.rejected",
        review: {
          status: "pending"
        }
      }
    });

    expect(result.allow).toBe(true);
    expect(result.requiredRole).toBe("reviewer");
    expect(result.requiredCapability).toBe("signals.review");
    expect(result.audit.result).toBe("allow");
    expect(result.audit.actor).not.toHaveProperty("email");
  });

  it("denies viewers from approving signals", () => {
    const result = guardSignalDecision({
      action: "approve",
      user: user("viewer"),
      context: {
        objectType: "signal",
        objectId: "sig_1",
        status: "signal.triage_requested",
        targetStatus: "context.queued"
      }
    });

    expect(result.allow).toBe(false);
    expect(result.severity).toBe("high");
    expect(result.requiredRole).toBe("reviewer");
    expect(result.requiredCapability).toBe("signals.review");
    expect(result.reasons.map((reason) => reason.code)).toContain("policy.role_required");
    expect(result.reasons.map((reason) => reason.code)).toContain("policy.capability_required");
    expect(result.audit.result).toBe("deny");
  });

  it("blocks dispatch approval when sendability policy fails", () => {
    const result = guardDispatchDecision({
      action: "approve",
      user: user("reviewer"),
      context: {
        objectType: "dispatch",
        objectId: "dispatch_1",
        status: "dispatch.review_requested",
        targetStatus: "dispatch.queued",
        sendability: {
          hasEmail: true,
          suppressed: true,
          bounced: false,
          unsubscribed: false,
          duplicateFirstTouch: false,
          hasPlainTextBody: true,
          hasOptOut: true
        }
      }
    });

    expect(result.allow).toBe(false);
    expect(result.severity).toBe("critical");
    expect(result.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "dispatch.not_suppressed",
          path: "sendability.suppressed"
        })
      ])
    );
  });

  it("allows automation to block a dispatch with an explicit sendability reason", () => {
    const result = guardDispatchDecision({
      action: "block",
      user: user("automation"),
      context: {
        objectType: "dispatch",
        objectId: "dispatch_1",
        status: "dispatch.approved",
        targetStatus: "dispatch.blocked_suppressed",
        blockReason: "suppressed"
      }
    });

    expect(result.allow).toBe(true);
    expect(result.requiredCapability).toBe("dispatch.block");
  });

  it("allows automation to classify supported reply outcomes above confidence threshold", () => {
    const result = guardReplyOutcomeClassification({
      user: user("automation"),
      context: {
        objectType: "reply",
        objectId: "reply_1",
        status: "reply.received",
        classification: "positive",
        classificationConfidence: 0.91,
        outcomeType: "positive_reply"
      }
    });

    expect(result.allow).toBe(true);
    expect(result.requiredCapability).toBe("replies.classify_outcome");
  });

  it("guards workflow retry and dead-letter handling separately", () => {
    const retryResult = guardWorkflowRetry({
      user: user("automation"),
      context: {
        objectType: "dead_letter_item",
        objectId: "dead_1",
        deadLetter: {
          status: "open"
        },
        failure: {
          kind: "technical"
        },
        retryCount: 2
      }
    });

    const resolveResult = guardDeadLetterHandling({
      action: "resolve",
      user: user("reviewer"),
      context: {
        objectType: "dead_letter_item",
        objectId: "dead_1",
        deadLetter: {
          status: "open"
        },
        resolutionNote: "Resolved manually."
      }
    });

    expect(retryResult.allow).toBe(true);
    expect(resolveResult.allow).toBe(false);
    expect(resolveResult.requiredRole).toBe("operator");
    expect(resolveResult.requiredCapability).toBe("dead_letters.handle");
  });

  it("changes draft approval behavior when policy data is updated", () => {
    const draftApprovePolicy = defaultPolicySet.policies.find((policy) => policy.id === "draft.approve");
    expect(draftApprovePolicy).toBeDefined();

    const stricterPolicySet = patchPolicy(defaultPolicySet, "draft.approve", {
      constraints: draftApprovePolicy!.constraints?.map((condition) =>
        condition.code === "draft.quality_score_minimum" ? { ...condition, value: 90 } : condition
      )
    });

    const context = {
      objectType: "message_draft",
      objectId: "draft_1",
      status: "draft.review_requested",
      targetStatus: "draft.approved",
      quality: {
        score: 80
      }
    };

    const defaultResult = guardDraftDecision({
      action: "approve",
      user: user("reviewer"),
      context
    });
    const stricterResult = guardDraftDecision({
      action: "approve",
      user: user("reviewer"),
      context,
      policySet: stricterPolicySet
    });

    expect(defaultResult.allow).toBe(true);
    expect(stricterResult.allow).toBe(false);
    expect(stricterResult.audit.policySetVersion).toBe(defaultPolicySet.version + 1);
    expect(stricterResult.reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: "draft.quality_score_minimum",
          expected: 90,
          actual: 80
        })
      ])
    );
  });
});
