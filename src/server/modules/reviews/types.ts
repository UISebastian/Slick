export type ReviewObjectType = "signal" | "message_draft" | "dispatch" | "outcome";

export type ReviewRequestType =
  | "approve_signal"
  | "approve_draft"
  | "approve_dispatch"
  | "log_outcome";

export type ReviewRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "expired"
  | "cancelled";

export type ReviewDecision = "approved" | "rejected" | "changes_requested";

export type ReviewRequest = {
  id: string;
  agencyId: string;
  objectType: ReviewObjectType;
  objectId: string;
  requestType: ReviewRequestType;
  status: ReviewRequestStatus;
  requestedBy: "system" | "member";
  assignedToMemberId?: string;
  notificationSentAt?: string;
  decisionDueAt?: string;
  createdAt: string;
  updatedAt: string;
  rowVersion: number;
};

export type ReviewDecisionRecord = {
  id: string;
  agencyId: string;
  reviewRequestId: string;
  decision: ReviewDecision;
  decidedByMemberId: string;
  decisionNote?: string;
  changes?: unknown;
  createdAt: string;
};
