import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url().default("postgres://slick:slick@localhost:5432/slick"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  AUTH_DEV_USER_EMAIL: z.string().email().default("owner@slick.local"),
  N8N_API_KEY: z.string().min(1).optional()
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  APP_BASE_URL: process.env.APP_BASE_URL,
  AUTH_DEV_USER_EMAIL: process.env.AUTH_DEV_USER_EMAIL,
  N8N_API_KEY: process.env.N8N_API_KEY
});
