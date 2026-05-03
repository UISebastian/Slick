import type { z } from "zod";
import type {
  automationAuditEventSchema,
  automationCommandSchema,
  automationCommandTypeSchema,
  automationDeadLetterSchema,
  automationEnvelopeSchema,
  automationEventSchema,
  automationEventTypeSchema,
  automationFlowHealthSnapshotSchema,
  automationFlowSchema,
  automationObjectRefSchema,
  automationObjectTypeSchema,
  automationSourceQualitySchema,
  automationSourceRefSchema
} from "./schemas";

export type AutomationFlow = z.infer<typeof automationFlowSchema>;
export type AutomationCommandType = z.infer<typeof automationCommandTypeSchema>;
export type AutomationEventType = z.infer<typeof automationEventTypeSchema>;
export type AutomationObjectType = z.infer<typeof automationObjectTypeSchema>;
export type AutomationEnvelope = z.infer<typeof automationEnvelopeSchema>;
export type AutomationObjectRef = z.infer<typeof automationObjectRefSchema>;
export type AutomationSourceRef = z.infer<typeof automationSourceRefSchema>;
export type AutomationSourceQuality = z.infer<typeof automationSourceQualitySchema>;
export type AutomationCommand = z.infer<typeof automationCommandSchema>;
export type AutomationEvent = z.infer<typeof automationEventSchema>;
export type AutomationAuditEvent = z.infer<typeof automationAuditEventSchema>;
export type AutomationDeadLetter = z.infer<typeof automationDeadLetterSchema>;
export type AutomationFlowHealthSnapshot = z.infer<typeof automationFlowHealthSnapshotSchema>;
