import { randomUUID } from "node:crypto";
import type { CurrentUser } from "../../../auth/current-user";
import { type AuditLog, auditLog } from "../../audit/audit-log";
import { runWithIdempotency } from "../../idempotency/with-idempotency";
import { reviewRepository, type ReviewRepository } from "../../reviews/repository";
import type { ReviewRequest } from "../../reviews/types";
import { requireRole } from "../../workflows/authorization";
import type { ImportSignalsRequest } from "../schemas";
import { signalRepository, type SignalRepository } from "../repository";
import { transitionSignalStatus } from "../status";
import type { SignalRecord } from "../types";

export type ImportSignalsCommand = {
  input: ImportSignalsRequest;
  idempotencyKey: string;
  user: CurrentUser;
};

export type ImportedSignalResult = {
  signalId: string;
  reviewRequestId: string;
  dedupeKey: string;
  status: SignalRecord["status"];
  created: boolean;
};

export type ImportSignalsResult = {
  signals: ImportedSignalResult[];
  importedCount: number;
  dedupedCount: number;
  correlationId?: string;
  idempotentReplay: boolean;
};

type ImportSignalsDependencies = {
  signals: SignalRepository;
  reviews: ReviewRepository;
  audit: AuditLog;
};

const defaultDependencies: ImportSignalsDependencies = {
  signals: signalRepository,
  reviews: reviewRepository,
  audit: auditLog
};

export async function importSignals(
  command: ImportSignalsCommand,
  dependencies = defaultDependencies
): Promise<ImportSignalsResult> {
  requireRole(command.user, "admin");

  const { result, replayed } = await runWithIdempotency({
    agencyId: command.user.agencyId,
    operation: "signals.import",
    idempotencyKey: command.idempotencyKey,
    request: command.input,
    execute: () => importSignalsOnce(command, dependencies)
  });

  return {
    ...result,
    idempotentReplay: replayed
  };
}

async function importSignalsOnce(
  command: ImportSignalsCommand,
  dependencies: ImportSignalsDependencies
): Promise<Omit<ImportSignalsResult, "idempotentReplay">> {
  const results: ImportedSignalResult[] = [];
  let importedCount = 0;
  let dedupedCount = 0;

  for (const candidate of command.input.signals) {
    const existing = await dependencies.signals.findByDedupeKey(
      command.user.agencyId,
      candidate.dedupeKey
    );

    if (existing) {
      dedupedCount += 1;
      const existingReview = await dependencies.reviews.findPendingForObject({
        agencyId: command.user.agencyId,
        objectType: "signal",
        objectId: existing.id,
        requestType: "approve_signal"
      });

      results.push({
        signalId: existing.id,
        reviewRequestId: existingReview?.id ?? "",
        dedupeKey: existing.dedupeKey,
        status: existing.status,
        created: false
      });

      await dependencies.audit.append({
        agencyId: command.user.agencyId,
        actorType: "member",
        actorId: command.user.id,
        eventType: "signal.import_deduped",
        objectType: "signal",
        objectId: existing.id,
        after: {
          dedupeKey: existing.dedupeKey,
          correlationId: command.input.correlationId
        }
      });
      continue;
    }

    const now = new Date().toISOString();
    const detectedSignal: SignalRecord = {
      id: randomUUID(),
      agencyId: command.user.agencyId,
      campaignId: candidate.campaignId,
      signalRuleId: candidate.signalRuleId,
      accountId: candidate.accountId,
      contactId: candidate.contactId,
      status: "signal.detected",
      sourceType: candidate.sourceType,
      sourceUrl: candidate.sourceUrl,
      sourceRunId: candidate.sourceRunId,
      observedAt: candidate.observedAt,
      companyName: candidate.companyName,
      companyDomain: candidate.companyDomain,
      personName: candidate.personName,
      personRole: candidate.personRole,
      signalSummary: candidate.signalSummary,
      evidence: candidate.evidence,
      icpMatchScore: candidate.icpMatchScore,
      recommendedPersonaId: candidate.recommendedPersonaId,
      dedupeKey: candidate.dedupeKey,
      createdAt: now,
      updatedAt: now,
      rowVersion: 1
    };

    const insertedSignal = await dependencies.signals.insert(detectedSignal);
    const triageTransition = transitionSignalStatus(insertedSignal, "signal.triage_requested");
    const triageSignal = await dependencies.signals.updateStatus({
      agencyId: triageTransition.agencyId,
      id: triageTransition.id,
      status: triageTransition.status
    });

    const reviewRequest = await createSignalReviewRequest(
      command.user.agencyId,
      triageSignal.id,
      dependencies.reviews
    );

    await dependencies.audit.append({
      agencyId: command.user.agencyId,
      actorType: "member",
      actorId: command.user.id,
      eventType: "signal.imported",
      objectType: "signal",
      objectId: triageSignal.id,
      after: {
        status: "signal.detected",
        dedupeKey: triageSignal.dedupeKey,
        correlationId: command.input.correlationId
      }
    });

    await dependencies.audit.append({
      agencyId: command.user.agencyId,
      actorType: "member",
      actorId: command.user.id,
      eventType: "signal.status_changed",
      objectType: "signal",
      objectId: triageSignal.id,
      before: {
        status: "signal.detected"
      },
      after: {
        status: "signal.triage_requested"
      }
    });

    await dependencies.audit.append({
      agencyId: command.user.agencyId,
      actorType: "member",
      actorId: command.user.id,
      eventType: "review.requested",
      objectType: "review_request",
      objectId: reviewRequest.id,
      after: {
        objectType: "signal",
        objectId: triageSignal.id,
        requestType: "approve_signal"
      }
    });

    importedCount += 1;
    results.push({
      signalId: triageSignal.id,
      reviewRequestId: reviewRequest.id,
      dedupeKey: triageSignal.dedupeKey,
      status: triageSignal.status,
      created: true
    });
  }

  return {
    signals: results,
    importedCount,
    dedupedCount,
    correlationId: command.input.correlationId
  };
}

async function createSignalReviewRequest(
  agencyId: string,
  signalId: string,
  reviews: ReviewRepository
) {
  const now = new Date().toISOString();
  const reviewRequest: ReviewRequest = {
    id: randomUUID(),
    agencyId,
    objectType: "signal",
    objectId: signalId,
    requestType: "approve_signal",
    status: "pending",
    requestedBy: "system",
    createdAt: now,
    updatedAt: now,
    rowVersion: 1
  };

  return reviews.insertRequest(reviewRequest);
}
