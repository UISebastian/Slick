import { randomUUID } from "node:crypto";
import type { CurrentUser } from "../../../auth/current-user";
import { auditLog, type AuditLog } from "../../audit/audit-log";
import { runMaybeWithIdempotency } from "../../idempotency/with-idempotency";
import { decideSignal } from "../../signals/use-cases/decide-signal";
import { requireRole } from "../../workflows/authorization";
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
  requireRole(command.user, "reviewer");

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
    object: {
      type: reviewRequest.objectType,
      id: reviewRequest.objectId
    }
  };
}
