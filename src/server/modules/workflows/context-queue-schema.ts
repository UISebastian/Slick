import { z } from "zod";
import { limitQuerySchema } from "./schemas";

export const contextQueueQuerySchema = z.object({
  limit: limitQuerySchema
});

export type ContextQueueQuery = z.infer<typeof contextQueueQuerySchema>;
