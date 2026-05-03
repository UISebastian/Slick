import { randomUUID } from "node:crypto";
import type { CurrentUser } from "../../../auth/current-user";
import { auditLog, type AuditLog } from "../../audit/audit-log";
import { runMaybeWithIdempotency } from "../../idempotency/with-idempotency";
import {
  guardSignalDecision,
  PolicyDeniedError,
  type PolicyEvaluationResult
} from "../../policies";
import { reviewRepository, type ReviewRepository } from "../../reviews/repository";
import type { ReviewDecisionRecord, ReviewRequest, ReviewRequestStatus } from "../../reviews/types";
import { assertTransition } from "../../status/status-machine";
import { conflict, notFound } from "../../workflows/errors";
import type { SignalDecisionRequest } from "../schemas";
import { signalRepository, type SignalRepository } from "../repository";
import type { SignalRecord } from "../types";

export type SignalDecisionAction = "approve" | "reject";

export type SignalDecisionCommand = {
  signalId: string;
  action: SignalDecisionAction;
  input: SignalDecisionRequest;
  idempotencyKey?: string;
  reviewRequestId?: string;
  user: CurrentUser;
};

export type SignalDecisionResult = {
  signal: SignalRecord;
  reviewRequest?: ReviewRequest;
  decision?: ReviewDecisionRecord;
  policy?: PolicyEvaluationResult;
  idempotentReplay: boolean;
  alreadyProcessed: boolean;
};

type SignalDecisionDependencies = {
  signals: SignalRepository;
  reviews: ReviewRepository;
  audit: AuditLog;
};

const defaultDependencies: SignalDecisionDependencies = {
  signals: signalRepository,
  reviews: reviewRepository,
  audit: auditLog
};

export function approveSignal(
  command: Omit<SignalDecisionCommand, "action">,
  dependencies = defaultDependencies
) {
  return decideSignal(
    {
      ...command,
      action: "approve"
    },
    dependencies
  );
}

export function rejectSignal(
  command: Omit<SignalDecisionCommand, "action">,
  dependencies = defaultDependencies
) {
  return decideSignal(
    {
      ...command,
      action: "reject"
    },
    dependencies
  );
}

export async function decideSignal(
  command: SignalDecisionCommand,
  dependencies = defaultDependencies
): Promise<SignalDecisionResult> {
  const { result, replayed } = await runMaybeWithIdempotency({
    agencyId: command.user.agencyId,
    operation: `signals.${command.action}`,
    idempotencyKey: command.idempotencyKey,
    request: {
      signalId: command.signalId,
      reviewRequestId: command.reviewRequestId,
      input: command.input
    },
    execute: () => decideSignalOnce(command, dependencies)
  });

  return {
    ...result,
    idempotentReplay: replayed
  };
}

async function decideSignalOnce(
  command: SignalDecisionCommand,
  dependencies: SignalDecisionDependencies
): Promise<Omit<SignalDecisionResult, "idempotentReplay">> {
  const signal = await dependencies.signals.findById(command.user.agencyId, command.signalId);
  if (!signal) {
    throw notFound("Signal not found");
  }

  const alreadyProcessedStatus = command.action === "approve" ? "context.queued" : "signal.rejected";
  if (signal.status === alreadyProcessedStatus) {
    return {
      signal,
      alreadyProcessed: true
    };
  }

  if (signal.status !== "signal.triage_requested") {
    await assertSignalDecisionPolicy({
      command,
      signal,
      targetStatus: alreadyProcessedStatus,
      audit: dependencies.audit
    });

    throw conflict("Signal is not waiting for triage", {
      currentStatus: signal.status
    });
  }

  const reviewRequest = await findOrCreateSignalReviewRequest(command, dependencies.reviews);
  if (reviewRequest.status !== "pending") {
    await assertSignalDecisionPolicy({
      command,
      signal,
      reviewRequest,
      targetStatus: alreadyProcessedStatus,
      audit: dependencies.audit
    });

    throw conflict("Review request is not pending", {
      currentStatus: reviewRequest.status
    });
  }

  const policy = await assertSignalDecisionPolicy({
    command,
    signal,
    reviewRequest,
    targetStatus: alreadyProcessedStatus,
    audit: dependencies.audit
  });

  const decisionValue: "approved" | "rejected" =
    command.action === "approve" ? "approved" : "rejected";
  const decisionStatus: ReviewRequestStatus = decisionValue;

  const firstStatus = command.action === "approve" ? "signal.approved" : "signal.rejected";
  const firstTransition = await transitionSignal({
    signal,
    to: firstStatus,
    eventType: "signal.status_changed",
    user: command.user,
    audit: dependencies.audit,
    signals: dependencies.signals
  });

  const finalSignal =
    command.action === "approve"
      ? await transitionSignal({
          signal: firstTransition,
          to: "context.queued",
          eventType: "signal.context_queued",
          user: command.user,
          audit: dependencies.audit,
          signals: dependencies.signals
        })
      : firstTransition;

  const updatedReviewRequest = await dependencies.reviews.updateRequestStatus({
    agencyId: command.user.agencyId,
    id: reviewRequest.id,
    status: decisionStatus
  });

  const now = new Date().toISOString();
  const decision: ReviewDecisionRecord = await dependencies.reviews.insertDecision({
    id: randomUUID(),
    agencyId: command.user.agencyId,
    reviewRequestId: reviewRequest.id,
    decision: decisionValue,
    decidedByMemberId: command.user.id,
    decisionNote: command.input.decisionNote,
    createdAt: now
  });

  await dependencies.audit.append({
    agencyId: command.user.agencyId,
    actorType: "member",
    actorId: command.user.id,
    eventType: `review.${decisionValue}`,
    objectType: "review_request",
    objectId: reviewRequest.id,
    before: {
      status: "pending"
    },
    after: {
      status: updatedReviewRequest.status,
      decisionId: decision.id,
      reviewedObjectType: "signal",
      reviewedObjectId: finalSignal.id
    }
  });

  return {
    signal: finalSignal,
    reviewRequest: updatedReviewRequest,
    decision,
    policy,
    alreadyProcessed: false
  };
}

async function assertSignalDecisionPolicy(input: {
  command: SignalDecisionCommand;
  signal: SignalRecord;
  reviewRequest?: ReviewRequest;
  targetStatus: SignalRecord["status"];
  audit: AuditLog;
}) {
  const result = guardSignalDecision({
    action: input.command.action,
    user: input.command.user,
    context: {
      objectType: "signal",
      objectId: input.signal.id,
      status: input.signal.status,
      targetStatus: input.targetStatus,
      ...(input.reviewRequest
        ? {
            review: {
              status: input.reviewRequest.status
            }
          }
        : {})
    }
  });

  await appendPolicyAudit({
    audit: input.audit,
    result,
    user: input.command.user,
    objectType: "signal",
    objectId: input.signal.id
  });

  if (!result.allow) {
    throw new PolicyDeniedError(result);
  }

  return result;
}

async function findOrCreateSignalReviewRequest(
  command: SignalDecisionCommand,
  reviews: ReviewRepository
) {
  if (command.reviewRequestId) {
    const reviewRequest = await reviews.findById(command.user.agencyId, command.reviewRequestId);
    if (!reviewRequest) {
      throw notFound("Review request not found");
    }

    if (
      reviewRequest.objectType !== "signal" ||
      reviewRequest.objectId !== command.signalId ||
      reviewRequest.requestType !== "approve_signal"
    ) {
      throw conflict("Review request does not belong to this signal");
    }

    return reviewRequest;
  }

  const existing = await reviews.findPendingForObject({
    agencyId: command.user.agencyId,
    objectType: "signal",
    objectId: command.signalId,
    requestType: "approve_signal"
  });

  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  return reviews.insertRequest({
    id: randomUUID(),
    agencyId: command.user.agencyId,
    objectType: "signal",
    objectId: command.signalId,
    requestType: "approve_signal",
    status: "pending",
    requestedBy: "system",
    createdAt: now,
    updatedAt: now,
    rowVersion: 1
  });
}

async function transitionSignal(input: {
  signal: SignalRecord;
  to: SignalRecord["status"];
  eventType: string;
  user: CurrentUser;
  audit: AuditLog;
  signals: SignalRepository;
}) {
  const from = input.signal.status;
  assertTransition(from, input.to);

  const updated = await input.signals.updateStatus({
    agencyId: input.user.agencyId,
    id: input.signal.id,
    status: input.to
  });

  await input.audit.append({
    agencyId: input.user.agencyId,
    actorType: "member",
    actorId: input.user.id,
    eventType: input.eventType,
    objectType: "signal",
    objectId: input.signal.id,
    before: {
      status: from
    },
    after: {
      status: input.to
    }
  });

  return updated;
}

async function appendPolicyAudit(input: {
  audit: AuditLog;
  result: PolicyEvaluationResult;
  user: CurrentUser;
  objectType: string;
  objectId: string;
}) {
  await input.audit.append({
    agencyId: input.user.agencyId,
    actorType: input.user.role === "automation" ? "api_client" : "member",
    actorId: input.user.id,
    eventType: input.result.allow ? "policy.decision_allowed" : "policy.decision_denied",
    objectType: input.objectType,
    objectId: input.objectId,
    after: {
      decision: input.result.decision,
      result: input.result.audit.result,
      severity: input.result.severity,
      reasons: input.result.reasons,
      policySetId: input.result.audit.policySetId,
      policySetVersion: input.result.audit.policySetVersion,
      policyIds: input.result.audit.policyIds
    }
  });
}
