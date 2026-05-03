import type { NextRequest } from "next/server";
import { apiJson } from "@/server/http/api-response";
import { openApiSpec } from "@/server/openapi/spec";

export function GET(request: NextRequest) {
  return apiJson(openApiSpec, {}, { request });
}
