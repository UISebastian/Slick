import { z } from "zod";
import { limitQuerySchema, reviewDecisionSchema, reviewStatusSchema } from "../workflows/schemas";

export const listReviewsQuerySchema = z.object({
  status: reviewStatusSchema.default("pending"),
  limit: limitQuerySchema
});

export const reviewDecisionRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
  decision: reviewDecisionSchema,
  decisionNote: z.string().trim().max(2000).optional(),
  changes: z.unknown().optional()
});

export const reviewIdParamsSchema = z.object({
  id: z.string().uuid()
});

export type ListReviewsQuery = z.infer<typeof listReviewsQuerySchema>;
export type ReviewDecisionRequest = z.infer<typeof reviewDecisionRequestSchema>;
