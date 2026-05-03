import type { NextRequest } from "next/server";
import { apiJson, handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseSearchParams } from "@/server/http/validation";
import { listReviewsQuerySchema } from "@/server/modules/reviews/schemas";
import { listReviews } from "@/server/modules/reviews/use-cases/list-reviews";

export async function GET(request: NextRequest) {
  return handleApiRoute(async () => {
    const input = parseSearchParams(request.nextUrl.searchParams, listReviewsQuerySchema);
    const user = await requireCurrentUser("viewer");
    const result = await listReviews({ input, user });

    return apiJson(result, {}, { request });
  }, { request });
}
