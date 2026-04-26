import type { ZodType } from "zod";
import { badRequest } from "../modules/workflows/errors";

type ParseJsonBodyOptions = {
  allowEmpty?: boolean;
};

export async function parseJsonBody<T>(
  request: Request,
  schema: ZodType<T>,
  options: ParseJsonBodyOptions = {}
) {
  let body: unknown = {};
  const text = await request.text();

  if (text.length > 0) {
    try {
      body = JSON.parse(text);
    } catch {
      throw badRequest("Request body must be valid JSON");
    }
  } else if (!options.allowEmpty) {
    throw badRequest("Request body is required");
  }

  return parseData(body, schema);
}

export function parseSearchParams<T>(searchParams: URLSearchParams, schema: ZodType<T>) {
  const data: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    data[key] = value;
  });

  return parseData(data, schema);
}

export function parseData<T>(data: unknown, schema: ZodType<T>) {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw badRequest("Request validation failed", {
      issues: parsed.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    });
  }

  return parsed.data;
}
