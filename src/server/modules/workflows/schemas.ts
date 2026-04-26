import { z } from "zod";
import { workflowStatuses } from "../status/status-machine";

export const workflowStatusSchema = z.enum(workflowStatuses);

export const reviewStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "changes_requested",
  "expired",
  "cancelled"
]);

export const reviewDecisionSchema = z.enum(["approved", "rejected", "changes_requested"]);

export const limitQuerySchema = z.coerce.number().int().min(1).max(100).default(50);
