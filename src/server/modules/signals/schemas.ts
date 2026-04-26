import { z } from "zod";
import { limitQuerySchema, workflowStatusSchema } from "../workflows/schemas";

export const signalSourceTypeSchema = z.enum(["apify", "api", "manual_import", "bulk_import"]);

export const importSignalCandidateSchema = z.object({
  campaignId: z.string().uuid(),
  signalRuleId: z.string().uuid(),
  accountId: z.string().uuid().optional(),
  contactId: z.string().uuid().optional(),
  sourceType: signalSourceTypeSchema,
  sourceUrl: z.string().url().optional(),
  sourceRunId: z.string().min(1).max(200).optional(),
  observedAt: z.string().datetime().default(() => new Date().toISOString()),
  companyName: z.string().trim().min(1).max(240),
  companyDomain: z.string().trim().min(1).max(240).optional(),
  personName: z.string().trim().min(1).max(240).optional(),
  personRole: z.string().trim().min(1).max(240).optional(),
  signalSummary: z.string().trim().min(1).max(2000),
  evidence: z.unknown().default({}),
  icpMatchScore: z.number().int().min(0).max(100).optional(),
  recommendedPersonaId: z.string().uuid().optional(),
  dedupeKey: z.string().trim().min(1).max(500)
});

export const importSignalsRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
  correlationId: z.string().trim().min(1).max(200).optional(),
  signals: z.array(importSignalCandidateSchema).min(1).max(100)
});

export const listSignalsQuerySchema = z.object({
  status: workflowStatusSchema.default("signal.triage_requested"),
  limit: limitQuerySchema
});

export const signalDecisionRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
  decisionNote: z.string().trim().max(2000).optional()
});

export const signalIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type ImportSignalsRequest = z.infer<typeof importSignalsRequestSchema>;
export type ListSignalsQuery = z.infer<typeof listSignalsQuerySchema>;
export type SignalDecisionRequest = z.infer<typeof signalDecisionRequestSchema>;
