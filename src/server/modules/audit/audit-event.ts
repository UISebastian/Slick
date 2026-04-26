export type AuditActorType = "system" | "member" | "n8n" | "api_client";

export type AuditEventInput = {
  agencyId: string;
  actorType: AuditActorType;
  actorId?: string;
  eventType: string;
  objectType: string;
  objectId: string;
  before?: unknown;
  after?: unknown;
};

export type AuditEvent = AuditEventInput & {
  id: string;
  createdAt: string;
};
