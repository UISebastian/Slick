import { conflict, notFound } from "../workflows/errors";
import { getWorkflowMemoryStore } from "../workflows/in-memory-store";
import type {
  ReviewDecisionRecord,
  ReviewObjectType,
  ReviewRequest,
  ReviewRequestStatus,
  ReviewRequestType
} from "./types";

export type ReviewListFilters = {
  agencyId: string;
  status?: ReviewRequestStatus;
  limit?: number;
};

export type ReviewRepository = {
  findById(agencyId: string, id: string): Promise<ReviewRequest | undefined>;
  findPendingForObject(input: {
    agencyId: string;
    objectType: ReviewObjectType;
    objectId: string;
    requestType?: ReviewRequestType;
  }): Promise<ReviewRequest | undefined>;
  insertRequest(reviewRequest: ReviewRequest): Promise<ReviewRequest>;
  updateRequestStatus(input: {
    agencyId: string;
    id: string;
    status: ReviewRequestStatus;
  }): Promise<ReviewRequest>;
  insertDecision(decision: ReviewDecisionRecord): Promise<ReviewDecisionRecord>;
  list(filters: ReviewListFilters): Promise<ReviewRequest[]>;
};

// TODO(db-domain): replace the in-memory adapter with a Drizzle/Postgres
// implementation once review tables are reconciled into this branch.
export function createInMemoryReviewRepository(): ReviewRepository {
  return {
    async findById(agencyId, id) {
      const reviewRequest = getWorkflowMemoryStore().reviewRequests.get(id);
      return reviewRequest?.agencyId === agencyId ? reviewRequest : undefined;
    },

    async findPendingForObject(input) {
      return Array.from(getWorkflowMemoryStore().reviewRequests.values()).find(
        (reviewRequest) =>
          reviewRequest.agencyId === input.agencyId &&
          reviewRequest.objectType === input.objectType &&
          reviewRequest.objectId === input.objectId &&
          reviewRequest.status === "pending" &&
          (!input.requestType || reviewRequest.requestType === input.requestType)
      );
    },

    async insertRequest(reviewRequest) {
      const store = getWorkflowMemoryStore();
      if (store.reviewRequests.has(reviewRequest.id)) {
        throw conflict("Review request already exists", { id: reviewRequest.id });
      }

      store.reviewRequests.set(reviewRequest.id, reviewRequest);
      return reviewRequest;
    },

    async updateRequestStatus(input) {
      const store = getWorkflowMemoryStore();
      const reviewRequest = store.reviewRequests.get(input.id);
      if (!reviewRequest || reviewRequest.agencyId !== input.agencyId) {
        throw notFound("Review request not found");
      }

      const updated: ReviewRequest = {
        ...reviewRequest,
        status: input.status,
        updatedAt: new Date().toISOString(),
        rowVersion: reviewRequest.rowVersion + 1
      };

      store.reviewRequests.set(updated.id, updated);
      return updated;
    },

    async insertDecision(decision) {
      const store = getWorkflowMemoryStore();
      if (store.reviewDecisions.has(decision.id)) {
        throw conflict("Review decision already exists", { id: decision.id });
      }

      store.reviewDecisions.set(decision.id, decision);
      return decision;
    },

    async list(filters) {
      return Array.from(getWorkflowMemoryStore().reviewRequests.values())
        .filter((reviewRequest) => reviewRequest.agencyId === filters.agencyId)
        .filter((reviewRequest) => !filters.status || reviewRequest.status === filters.status)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, filters.limit ?? 50);
    }
  };
}

export const reviewRepository = createInMemoryReviewRepository();
