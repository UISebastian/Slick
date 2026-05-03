import type { NextRequest } from "next/server";
import { apiJson } from "@/server/http/api-response";
import { openApiSpec } from "@/server/openapi/spec";

export function GET(request: NextRequest) {
  return apiJson(openApiSpec, openApiResponseInit(request), { request });
}

function openApiResponseInit(request: NextRequest): ResponseInit {
  if (request.nextUrl.searchParams.get("download") !== "1") {
    return {};
  }

  return {
    headers: {
      "content-disposition": 'attachment; filename="slick-openapi.json"'
    }
  };
}
