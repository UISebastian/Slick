import { randomUUID } from "node:crypto";
import type { ReviewObjectType, ReviewRequest, ReviewRequestType } from "./types";

export type CreateReviewRequestInput = {
  agencyId: string;
  objectType: ReviewObjectType;
  objectId: string;
  requestType: ReviewRequestType;
  requestedBy?: ReviewRequest["requestedBy"];
  now?: string;
};

export function createReviewRequest(input: CreateReviewRequestInput): ReviewRequest {
  const now = input.now ?? new Date().toISOString();

  return {
    id: randomUUID(),
    agencyId: input.agencyId,
    objectType: input.objectType,
    objectId: input.objectId,
    requestType: input.requestType,
    status: "pending",
    requestedBy: input.requestedBy ?? "system",
    createdAt: now,
    updatedAt: now,
    rowVersion: 1
  };
}
