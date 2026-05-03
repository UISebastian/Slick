import type { NextRequest } from "next/server";
import { apiJson } from "@/server/http/api-response";

export function GET(request: NextRequest) {
  return apiJson({
    ok: true,
    service: "slick",
    timestamp: new Date().toISOString()
  }, {}, { request });
}
