import type { WorkflowStatus } from "../status/status-machine";
import { conflict, notFound } from "../workflows/errors";
import { getWorkflowMemoryStore } from "../workflows/in-memory-store";
import type { SignalRecord } from "./types";

export type SignalListFilters = {
  agencyId: string;
  status?: WorkflowStatus;
  limit?: number;
};

export type SignalRepository = {
  findById(agencyId: string, id: string): Promise<SignalRecord | undefined>;
  findByDedupeKey(agencyId: string, dedupeKey: string): Promise<SignalRecord | undefined>;
  insert(signal: SignalRecord): Promise<SignalRecord>;
  updateStatus(input: {
    agencyId: string;
    id: string;
    status: WorkflowStatus;
  }): Promise<SignalRecord>;
  list(filters: SignalListFilters): Promise<SignalRecord[]>;
};

// TODO(db-domain): replace the in-memory adapter with a Drizzle/Postgres
// implementation once signal tables are reconciled into this branch.
function dedupeIndexKey(agencyId: string, dedupeKey: string) {
  return `${agencyId}:${dedupeKey}`;
}

export function createInMemorySignalRepository(): SignalRepository {
  return {
    async findById(agencyId, id) {
      const signal = getWorkflowMemoryStore().signals.get(id);
      return signal?.agencyId === agencyId ? signal : undefined;
    },

    async findByDedupeKey(agencyId, dedupeKey) {
      const store = getWorkflowMemoryStore();
      const id = store.signalsByDedupeKey.get(dedupeIndexKey(agencyId, dedupeKey));
      if (!id) {
        return undefined;
      }

      const signal = store.signals.get(id);
      return signal?.agencyId === agencyId ? signal : undefined;
    },

    async insert(signal) {
      const store = getWorkflowMemoryStore();
      const indexKey = dedupeIndexKey(signal.agencyId, signal.dedupeKey);
      if (store.signalsByDedupeKey.has(indexKey)) {
        throw conflict("Signal dedupe key already exists", { dedupeKey: signal.dedupeKey });
      }

      store.signals.set(signal.id, signal);
      store.signalsByDedupeKey.set(indexKey, signal.id);
      return signal;
    },

    async updateStatus(input) {
      const store = getWorkflowMemoryStore();
      const signal = store.signals.get(input.id);
      if (!signal || signal.agencyId !== input.agencyId) {
        throw notFound("Signal not found");
      }

      const updated: SignalRecord = {
        ...signal,
        status: input.status,
        updatedAt: new Date().toISOString(),
        rowVersion: signal.rowVersion + 1
      };

      store.signals.set(updated.id, updated);
      return updated;
    },

    async list(filters) {
      return Array.from(getWorkflowMemoryStore().signals.values())
        .filter((signal) => signal.agencyId === filters.agencyId)
        .filter((signal) => !filters.status || signal.status === filters.status)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, filters.limit ?? 50);
    }
  };
}

export const signalRepository = createInMemorySignalRepository();
