import type { AuditEvent } from "../audit/audit-event";
import type { IdempotencyRecord } from "../idempotency/types";
import type { ReviewDecisionRecord, ReviewRequest } from "../reviews/types";
import type { SignalRecord } from "../signals/types";

export type WorkflowMemoryStore = {
  signals: Map<string, SignalRecord>;
  signalsByDedupeKey: Map<string, string>;
  reviewRequests: Map<string, ReviewRequest>;
  reviewDecisions: Map<string, ReviewDecisionRecord>;
  auditEvents: Map<string, AuditEvent>;
  idempotencyRecords: Map<string, IdempotencyRecord>;
};

const globalForWorkflowStore = globalThis as typeof globalThis & {
  slickWorkflowMemoryStore?: WorkflowMemoryStore;
};

function createWorkflowMemoryStore(): WorkflowMemoryStore {
  return {
    signals: new Map(),
    signalsByDedupeKey: new Map(),
    reviewRequests: new Map(),
    reviewDecisions: new Map(),
    auditEvents: new Map(),
    idempotencyRecords: new Map()
  };
}

export function getWorkflowMemoryStore() {
  if (!globalForWorkflowStore.slickWorkflowMemoryStore) {
    globalForWorkflowStore.slickWorkflowMemoryStore = createWorkflowMemoryStore();
  }

  return globalForWorkflowStore.slickWorkflowMemoryStore;
}

export function resetWorkflowMemoryStore() {
  globalForWorkflowStore.slickWorkflowMemoryStore = createWorkflowMemoryStore();
}
