import { randomUUID } from "node:crypto";
import type { AuditEvent, AuditEventInput } from "./audit-event";
import { getWorkflowMemoryStore } from "../workflows/in-memory-store";

export type AuditLog = {
  append(input: AuditEventInput): Promise<AuditEvent>;
  listForObject(input: {
    agencyId: string;
    objectType: string;
    objectId: string;
  }): Promise<AuditEvent[]>;
};

// TODO(db-domain): write through to audit_events once the table is available.
export function createInMemoryAuditLog(): AuditLog {
  return {
    async append(input) {
      const now = new Date().toISOString();
      const event: AuditEvent = {
        ...input,
        id: randomUUID(),
        createdAt: now
      };

      getWorkflowMemoryStore().auditEvents.set(event.id, event);
      return event;
    },

    async listForObject(input) {
      return Array.from(getWorkflowMemoryStore().auditEvents.values())
        .filter(
          (event) =>
            event.agencyId === input.agencyId &&
            event.objectType === input.objectType &&
            event.objectId === input.objectId
        )
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt));
    }
  };
}

export const auditLog = createInMemoryAuditLog();

export function appendAuditEvent(input: AuditEventInput) {
  return auditLog.append(input);
}
