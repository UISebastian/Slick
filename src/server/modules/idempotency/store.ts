import { randomUUID } from "node:crypto";
import { getWorkflowMemoryStore } from "../workflows/in-memory-store";
import type { IdempotencyRecord, IdempotencyStatus } from "./types";

export type IdempotencyStore = {
  find(input: {
    agencyId: string;
    operation: string;
    idempotencyKey: string;
  }): Promise<IdempotencyRecord | undefined>;
  start(input: {
    agencyId: string;
    operation: string;
    idempotencyKey: string;
    requestHash: string;
  }): Promise<IdempotencyRecord>;
  complete(input: {
    id: string;
    status: IdempotencyStatus;
    response?: unknown;
    responseObjectType?: string;
    responseObjectId?: string;
  }): Promise<IdempotencyRecord>;
};

function recordKey(input: { agencyId: string; operation: string; idempotencyKey: string }) {
  return `${input.agencyId}:${input.operation}:${input.idempotencyKey}`;
}

// TODO(db-domain): persist these records in the idempotency_keys table once the
// schema branch lands; the interface is intentionally table-shaped.
export function createInMemoryIdempotencyStore(): IdempotencyStore {
  return {
    async find(input) {
      return getWorkflowMemoryStore().idempotencyRecords.get(recordKey(input));
    },

    async start(input) {
      const now = new Date().toISOString();
      const record: IdempotencyRecord = {
        id: randomUUID(),
        agencyId: input.agencyId,
        idempotencyKey: input.idempotencyKey,
        operation: input.operation,
        requestHash: input.requestHash,
        status: "started",
        createdAt: now,
        updatedAt: now
      };

      getWorkflowMemoryStore().idempotencyRecords.set(recordKey(input), record);
      return record;
    },

    async complete(input) {
      const store = getWorkflowMemoryStore();
      const existing = Array.from(store.idempotencyRecords.values()).find(
        (record) => record.id === input.id
      );

      if (!existing) {
        throw new Error("Idempotency record not found");
      }

      const updated: IdempotencyRecord = {
        ...existing,
        status: input.status,
        response: input.response,
        responseObjectType: input.responseObjectType,
        responseObjectId: input.responseObjectId,
        updatedAt: new Date().toISOString()
      };

      store.idempotencyRecords.set(recordKey(updated), updated);
      return updated;
    }
  };
}

export const idempotencyStore = createInMemoryIdempotencyStore();
