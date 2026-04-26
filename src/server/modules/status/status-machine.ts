export const workflowStatuses = [
  "signal.detected",
  "signal.triage_requested",
  "signal.approved",
  "signal.rejected",
  "context.queued",
  "context.ready",
  "context.failed",
  "draft.queued",
  "draft.ready",
  "draft.failed",
  "draft.review_requested",
  "draft.approved",
  "draft.rejected",
  "draft.changes_requested",
  "dispatch.review_requested",
  "dispatch.approved",
  "dispatch.rejected",
  "dispatch.blocked_suppressed",
  "dispatch.queued",
  "dispatch.sent",
  "dispatch.failed",
  "reply.received",
  "outcome.logged",
  "closed",
  "archived"
] as const;

export type WorkflowStatus = (typeof workflowStatuses)[number];

const allowedTransitions: Record<WorkflowStatus, readonly WorkflowStatus[]> = {
  "signal.detected": ["signal.triage_requested"],
  "signal.triage_requested": ["signal.approved", "signal.rejected"],
  "signal.approved": ["context.queued"],
  "signal.rejected": ["archived"],
  "context.queued": ["context.ready", "context.failed"],
  "context.ready": ["draft.queued"],
  "context.failed": ["context.queued", "archived"],
  "draft.queued": ["draft.ready", "draft.failed"],
  "draft.ready": ["draft.review_requested"],
  "draft.failed": ["draft.queued", "archived"],
  "draft.review_requested": ["draft.approved", "draft.rejected", "draft.changes_requested"],
  "draft.approved": ["dispatch.review_requested"],
  "draft.rejected": ["archived"],
  "draft.changes_requested": ["draft.ready"],
  "dispatch.review_requested": ["dispatch.approved", "dispatch.rejected"],
  "dispatch.approved": ["dispatch.queued", "dispatch.blocked_suppressed"],
  "dispatch.rejected": ["archived"],
  "dispatch.blocked_suppressed": ["archived"],
  "dispatch.queued": ["dispatch.sent", "dispatch.failed"],
  "dispatch.sent": ["reply.received", "outcome.logged"],
  "dispatch.failed": ["dispatch.queued", "archived"],
  "reply.received": ["outcome.logged"],
  "outcome.logged": ["closed"],
  closed: ["archived"],
  archived: []
};

export function canTransition(from: WorkflowStatus, to: WorkflowStatus) {
  return allowedTransitions[from].includes(to);
}

export function assertTransition(from: WorkflowStatus, to: WorkflowStatus) {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid workflow transition from ${from} to ${to}`);
  }
}
