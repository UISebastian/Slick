import type { NextRequest } from "next/server";
import { apiJson, handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseSearchParams } from "@/server/http/validation";
import { contextQueueQuerySchema } from "@/server/modules/workflows/context-queue-schema";
import { listContextQueue } from "@/server/modules/workflows/use-cases/list-context-queue";

export async function GET(request: NextRequest) {
  return handleApiRoute(async () => {
    const input = parseSearchParams(request.nextUrl.searchParams, contextQueueQuerySchema);
    const user = await requireCurrentUser("admin");
    const result = await listContextQueue({ input, user });

    return apiJson(result, {}, { request });
  }, { request });
}
