import { z } from "zod";
import { importSignalCandidateSchema } from "../signals/schemas";

export const automationSchemaVersion = "2026-04-30" as const;

export const correlationIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^\S+$/, "Correlation IDs must not contain whitespace");

export const automationIdempotencyKeySchema = z
  .string()
  .trim()
  .min(8)
  .max(200)
  .regex(/^\S+$/, "Idempotency keys must not contain whitespace");

export const automationFlowSchema = z.enum([
  "signals.collect",
  "signals.import",
  "context.build",
  "draft.generate",
  "review.notify",
  "dispatch.prepare",
  "dispatch.send",
  "replies.ingest",
  "outcomes.remind",
  "monitoring.health",
  "dead_letters.replay"
]);

export const automationCommandTypeSchema = z.enum([
  "signals.import",
  "context.complete",
  "context.fail",
  "draft.complete",
  "draft.fail",
  "dispatch.record_sent",
  "dispatch.fail",
  "reply.ingest",
  "outcome.log"
]);

export const automationEventTypeSchema = z.enum([
  "automation.command.accepted",
  "automation.command.replayed",
  "automation.command.rejected",
  "automation.flow.started",
  "automation.flow.succeeded",
  "automation.flow.failed",
  "automation.flow.dead_lettered",
  "automation.retry_scheduled",
  "policy.decision_allowed",
  "policy.decision_denied",
  "review.requested",
  "review.decided",
  "source.quality_scored"
]);

export const automationObjectTypeSchema = z.enum([
  "signal",
  "review_request",
  "context_snapshot",
  "message_draft",
  "dispatch",
  "reply",
  "outcome",
  "workflow_run",
  "dead_letter_item"
]);

export const automationActorSchema = z
  .object({
    type: z.enum(["n8n", "api_client", "system"]),
    id: z.string().trim().min(1).max(200)
  })
  .strict();

export const automationObjectRefSchema = z
  .object({
    type: automationObjectTypeSchema,
    id: z.string().uuid()
  })
  .strict();

export const automationEnvelopeSchema = z
  .object({
    schemaVersion: z.literal(automationSchemaVersion).default(automationSchemaVersion),
    agencyId: z.string().uuid().optional(),
    flow: automationFlowSchema,
    correlationId: correlationIdSchema,
    idempotencyKey: automationIdempotencyKeySchema.optional(),
    attempt: z.number().int().min(1).max(50).default(1),
    actor: automationActorSchema,
    occurredAt: z.string().datetime().default(() => new Date().toISOString())
  })
  .strict();

export const automationSourceRefSchema = z
  .object({
    sourceType: z.enum(["apify", "api", "manual_import", "bulk_import", "mailserver", "llm"]),
    sourceUrl: z.string().url().optional(),
    sourceRunId: z.string().trim().min(1).max(200).optional(),
    observedAt: z.string().datetime(),
    title: z.string().trim().min(1).max(300).optional(),
    excerpt: z.string().trim().min(1).max(2000).optional(),
    checksum: z.string().trim().min(8).max(128).optional()
  })
  .strict();

export const automationSourceQualitySchema = z
  .object({
    score: z.number().int().min(0).max(100),
    verdict: z.enum(["trusted", "usable", "weak", "blocked"]),
    reasons: z.array(z.string().trim().min(1).max(240)).max(20).default([]),
    checkedAt: z.string().datetime().default(() => new Date().toISOString())
  })
  .strict();

export const automationFailureSchema = z
  .object({
    code: z.string().trim().min(1).max(120),
    message: z.string().trim().min(1).max(1000),
    retriable: z.boolean(),
    provider: z.string().trim().min(1).max(120).optional(),
    details: z.unknown().optional()
  })
  .strict();

const mutatingAutomationCommandBaseSchema = automationEnvelopeSchema
  .extend({
    idempotencyKey: automationIdempotencyKeySchema
  })
  .strict();

export const signalImportAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("signals.import"),
    flow: z.literal("signals.import"),
    payload: z
      .object({
        signals: z.array(importSignalCandidateSchema).min(1).max(100)
      })
      .strict()
  })
  .strict();

export const contextCompleteAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("context.complete"),
    flow: z.literal("context.build"),
    payload: z
      .object({
        signalId: z.string().uuid(),
        accountContext: z.string().trim().min(1).max(4000).optional(),
        personContext: z.string().trim().min(1).max(4000).optional(),
        offerBridge: z.string().trim().min(1).max(4000).optional(),
        sourceRefs: z.array(automationSourceRefSchema).min(1).max(50),
        quality: automationSourceQualitySchema
      })
      .strict()
  })
  .strict();

export const contextFailAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("context.fail"),
    flow: z.literal("context.build"),
    payload: z
      .object({
        signalId: z.string().uuid(),
        failure: automationFailureSchema
      })
      .strict()
  })
  .strict();

export const draftCompleteAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("draft.complete"),
    flow: z.literal("draft.generate"),
    payload: z
      .object({
        signalId: z.string().uuid(),
        contextSnapshotId: z.string().uuid().optional(),
        subject: z.string().trim().min(1).max(300),
        bodyText: z.string().trim().min(1).max(12000),
        model: z.string().trim().min(1).max(120).optional(),
        promptVersion: z.string().trim().min(1).max(120).optional(),
        sourceRefs: z.array(automationSourceRefSchema).max(50).default([]),
        quality: automationSourceQualitySchema
      })
      .strict()
  })
  .strict();

export const draftFailAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("draft.fail"),
    flow: z.literal("draft.generate"),
    payload: z
      .object({
        signalId: z.string().uuid(),
        contextSnapshotId: z.string().uuid().optional(),
        failure: automationFailureSchema
      })
      .strict()
  })
  .strict();

export const dispatchRecordSentAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("dispatch.record_sent"),
    flow: z.literal("dispatch.send"),
    payload: z
      .object({
        dispatchId: z.string().uuid(),
        messageDraftId: z.string().uuid(),
        provider: z.string().trim().min(1).max(120),
        providerMessageId: z.string().trim().min(1).max(300).optional(),
        messageIdHeader: z.string().trim().min(1).max(500).optional(),
        sentAt: z.string().datetime()
      })
      .strict()
  })
  .strict();

export const dispatchFailAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("dispatch.fail"),
    flow: z.literal("dispatch.send"),
    payload: z
      .object({
        dispatchId: z.string().uuid(),
        messageDraftId: z.string().uuid().optional(),
        failure: automationFailureSchema
      })
      .strict()
  })
  .strict();

export const replyIngestAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("reply.ingest"),
    flow: z.literal("replies.ingest"),
    payload: z
      .object({
        receivedAt: z.string().datetime(),
        provider: z.string().trim().min(1).max(120).optional(),
        providerMessageId: z.string().trim().min(1).max(300).optional(),
        messageIdHeader: z.string().trim().min(1).max(500).optional(),
        inReplyToHeader: z.string().trim().min(1).max(500).optional(),
        referencesHeader: z.string().trim().min(1).max(2000).optional(),
        senderEmailHash: z.string().trim().min(8).max(128).optional(),
        subject: z.string().trim().max(500).optional(),
        bodyText: z.string().trim().min(1).max(20000),
        classification: z
          .enum(["positive", "neutral", "objection", "unsubscribe", "bounce", "unknown"])
          .default("unknown")
      })
      .strict()
  })
  .strict();

export const outcomeLogAutomationCommandSchema = mutatingAutomationCommandBaseSchema
  .extend({
    commandType: z.literal("outcome.log"),
    flow: z.literal("outcomes.remind"),
    payload: z
      .object({
        object: automationObjectRefSchema,
        outcomeType: z.enum([
          "meeting_booked",
          "meeting_completed",
          "opportunity_created",
          "won",
          "lost",
          "not_interested",
          "no_response",
          "manual_note"
        ]),
        occurredAt: z.string().datetime(),
        notes: z.string().trim().max(4000).optional(),
        sourceRefs: z.array(automationSourceRefSchema).max(20).default([])
      })
      .strict()
  })
  .strict();

export const automationCommandSchema = z.discriminatedUnion("commandType", [
  signalImportAutomationCommandSchema,
  contextCompleteAutomationCommandSchema,
  contextFailAutomationCommandSchema,
  draftCompleteAutomationCommandSchema,
  draftFailAutomationCommandSchema,
  dispatchRecordSentAutomationCommandSchema,
  dispatchFailAutomationCommandSchema,
  replyIngestAutomationCommandSchema,
  outcomeLogAutomationCommandSchema
]);

export const automationEventSchema = automationEnvelopeSchema
  .extend({
    eventType: automationEventTypeSchema,
    object: automationObjectRefSchema.optional(),
    payload: z.record(z.string(), z.unknown()).default({})
  })
  .strict();

export const automationAuditEventSchema = z
  .object({
    agencyId: z.string().uuid(),
    actorType: z.enum(["system", "n8n", "api_client"]),
    actorId: z.string().trim().min(1).max(200).optional(),
    eventType: automationEventTypeSchema.or(z.string().trim().min(1).max(200)),
    objectType: automationObjectTypeSchema.or(z.string().trim().min(1).max(120)),
    objectId: z.string().uuid(),
    correlationId: correlationIdSchema,
    idempotencyKey: automationIdempotencyKeySchema.optional(),
    before: z.unknown().optional(),
    after: z.unknown().optional(),
    occurredAt: z.string().datetime().default(() => new Date().toISOString())
  })
  .strict();

export const automationDeadLetterSchema = z
  .object({
    schemaVersion: z.literal(automationSchemaVersion).default(automationSchemaVersion),
    agencyId: z.string().uuid(),
    deadLetterId: z.string().uuid().optional(),
    flow: automationFlowSchema,
    commandType: automationCommandTypeSchema.optional(),
    eventType: automationEventTypeSchema.optional(),
    correlationId: correlationIdSchema,
    idempotencyKey: automationIdempotencyKeySchema.optional(),
    object: automationObjectRefSchema.optional(),
    failure: automationFailureSchema,
    payload: z.unknown(),
    firstFailedAt: z.string().datetime(),
    lastFailedAt: z.string().datetime(),
    retryCount: z.number().int().min(0).max(50),
    nextRetryAt: z.string().datetime().optional(),
    status: z.enum(["open", "requeued", "resolved", "ignored"]).default("open")
  })
  .strict();

export const automationFlowHealthSnapshotSchema = z
  .object({
    flow: automationFlowSchema,
    status: z.enum(["healthy", "degraded", "down", "paused"]),
    observedAt: z.string().datetime().default(() => new Date().toISOString()),
    lastHeartbeatAt: z.string().datetime().optional(),
    lastSuccessAt: z.string().datetime().optional(),
    lastFailureAt: z.string().datetime().optional(),
    queueAgeSeconds: z.number().int().min(0),
    pendingCount: z.number().int().min(0),
    deadLetterCount: z.number().int().min(0),
    policyDenyCount: z.number().int().min(0),
    pendingApprovalCount: z.number().int().min(0),
    sourceQualityScore: z.number().int().min(0).max(100).optional()
  })
  .strict();
