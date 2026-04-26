export type IdempotencyStatus = "started" | "succeeded" | "failed";

export type IdempotencyRecord = {
  id: string;
  agencyId: string;
  idempotencyKey: string;
  operation: string;
  requestHash: string;
  response?: unknown;
  responseObjectType?: string;
  responseObjectId?: string;
  status: IdempotencyStatus;
  createdAt: string;
  updatedAt: string;
};
