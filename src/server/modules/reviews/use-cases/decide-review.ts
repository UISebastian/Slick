import { randomUUID } from "node:crypto";
import type { CurrentUser } from "../../../auth/current-user";
import { auditLog, type AuditLog } from "../../audit/audit-log";
import { runMaybeWithIdempotency } from "../../idempotency/with-idempotency";
import {
  appendPolicyAudit,
  guardDispatchDecision,
  guardDraftDecision,
  guardReplyOutcomeClassification,
  PolicyDeniedError,
  type PolicyEvaluationContext,
  type PolicyEvaluationResult
} from "../../policies";
import { decideSignal } from "../../signals/use-cases/decide-signal";
import { conflict, notFound, unprocessableEntity } from "../../workflows/errors";
import { reviewRepository, type ReviewRepository } from "../repository";
import type { ReviewDecisionRecord, ReviewRequest, ReviewRequestStatus } from "../types";
import type { ReviewDecisionRequest } from "../schemas";

export type DecideReviewCommand = {
  reviewRequestId: string;
  input: ReviewDecisionRequest;
  idempotencyKey?: string;
  user: CurrentUser;
};

export type DecideReviewResult = {
  reviewRequest: ReviewRequest;
  decision?: ReviewDecisionRecord;
  object?: {
    type: string;
    id: string;
    status?: string;
  };
  policy?: PolicyEvaluationResult;
  idempotentReplay: boolean;
};

type DecideReviewDependencies = {
  reviews: ReviewRepository;
  audit: AuditLog;
};

const defaultDependencies: DecideReviewDependencies = {
  reviews: reviewRepository,
  audit: auditLog
};

export async function decideReview(
  command: DecideReviewCommand,
  dependencies = defaultDependencies
): Promise<DecideReviewResult> {
  const { result, replayed } = await runMaybeWithIdempotency({
    agencyId: command.user.agencyId,
    operation: "reviews.decision",
    idempotencyKey: command.idempotencyKey,
    request: {
      reviewRequestId: command.reviewRequestId,
      input: command.input
    },
    execute: () => decideReviewOnce(command, dependencies)
  });

  return {
    ...result,
    idempotentReplay: replayed
  };
}

async function decideReviewOnce(
  command: DecideReviewCommand,
  dependencies: DecideReviewDependencies
): Promise<Omit<DecideReviewResult, "idempotentReplay">> {
  const reviewRequest = await dependencies.reviews.findById(
    command.user.agencyId,
    command.reviewRequestId
  );

  if (!reviewRequest) {
    throw notFound("Review request not found");
  }

  if (reviewRequest.status !== "pending") {
    throw conflict("Review request is not pending", {
      currentStatus: reviewRequest.status
    });
  }

  if (reviewRequest.objectType === "signal" && reviewRequest.requestType === "approve_signal") {
    if (command.input.decision === "changes_requested") {
      throw unprocessableEntity("Signal reviews can only be approved or rejected");
    }

    const signalDecision = await decideSignal({
      signalId: reviewRequest.objectId,
      reviewRequestId: reviewRequest.id,
      action: command.input.decision === "approved" ? "approve" : "reject",
      input: {
        decisionNote: command.input.decisionNote
      },
      user: command.user
    });

    return {
      reviewRequest: signalDecision.reviewRequest ?? reviewRequest,
      decision: signalDecision.decision,
      policy: signalDecision.policy,
      object: {
        type: "signal",
        id: signalDecision.signal.id,
        status: signalDecision.signal.status
      }
    };
  }

  return decideGenericReview(command, dependencies, reviewRequest);
}

async function decideGenericReview(
  command: DecideReviewCommand,
  dependencies: DecideReviewDependencies,
  reviewRequest: ReviewRequest
): Promise<Omit<DecideReviewResult, "idempotentReplay">> {
  const policy = await assertGenericReviewPolicy({
    command,
    reviewRequest,
    audit: dependencies.audit
  });

  const status: ReviewRequestStatus = command.input.decision;
  const updatedReviewRequest = await dependencies.reviews.updateRequestStatus({
    agencyId: command.user.agencyId,
    id: reviewRequest.id,
    status
  });

  const decision = await dependencies.reviews.insertDecision({
    id: randomUUID(),
    agencyId: command.user.agencyId,
    reviewRequestId: reviewRequest.id,
    decision: command.input.decision,
    decidedByMemberId: command.user.id,
    decisionNote: command.input.decisionNote,
    changes: command.input.changes,
    createdAt: new Date().toISOString()
  });

  await dependencies.audit.append({
    agencyId: command.user.agencyId,
    actorType: "member",
    actorId: command.user.id,
    eventType: `review.${command.input.decision}`,
    objectType: "review_request",
    objectId: reviewRequest.id,
    before: {
      status: "pending"
    },
    after: {
      status,
      decisionId: decision.id,
      reviewedObjectType: reviewRequest.objectType,
      reviewedObjectId: reviewRequest.objectId
    }
  });

  return {
    reviewRequest: updatedReviewRequest,
    decision,
    policy,
    object: {
      type: reviewRequest.objectType,
      id: reviewRequest.objectId
    }
  };
}

async function assertGenericReviewPolicy(input: {
  command: DecideReviewCommand;
  reviewRequest: ReviewRequest;
  audit: AuditLog;
}) {
  const result = evaluateGenericReviewPolicy(input.command, input.reviewRequest);

  await appendPolicyAudit({
    audit: input.audit,
    result,
    user: input.command.user,
    objectType: input.reviewRequest.objectType,
    objectId: input.reviewRequest.objectId
  });

  if (!result.allow) {
    throw new PolicyDeniedError(result);
  }

  return result;
}

function evaluateGenericReviewPolicy(command: DecideReviewCommand, reviewRequest: ReviewRequest) {
  const changes = asRecord(command.input.changes);
  const baseContext: PolicyEvaluationContext = {
    objectType: reviewRequest.objectType,
    objectId: reviewRequest.objectId
  };

  if (reviewRequest.requestType === "approve_draft") {
    return guardDraftDecision({
      action: command.input.decision === "approved" ? "approve" : "reject",
      user: command.user,
      context: {
        ...baseContext,
        status: "draft.review_requested",
        targetStatus:
          command.input.decision === "approved"
            ? "draft.approved"
            : command.input.decision === "changes_requested"
              ? "draft.changes_requested"
              : "draft.rejected",
        ...(changes.quality && typeof changes.quality === "object"
          ? { quality: changes.quality }
          : {})
      }
    });
  }

  if (reviewRequest.requestType === "approve_dispatch") {
    const approved = command.input.decision === "approved";

    return guardDispatchDecision({
      action: approved ? "approve" : "block",
      user: command.user,
      context: {
        ...baseContext,
        status: "dispatch.review_requested",
        targetStatus: approved ? "dispatch.approved" : "dispatch.rejected",
        ...(changes.sendability && typeof changes.sendability === "object"
          ? { sendability: changes.sendability }
          : {}),
        blockReason: typeof changes.blockReason === "string" ? changes.blockReason : "manual_risk"
      }
    });
  }

  return guardReplyOutcomeClassification({
    user: command.user,
    context: {
      ...baseContext,
      status: "reply.received",
      targetStatus: "outcome.logged",
      classification: changes.classification,
      classificationConfidence: changes.classificationConfidence,
      outcomeType: changes.outcomeType
    }
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
