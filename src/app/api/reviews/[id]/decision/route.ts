import { NextResponse, type NextRequest } from "next/server";
import { handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseData, parseJsonBody } from "@/server/http/validation";
import {
  reviewDecisionRequestSchema,
  reviewIdParamsSchema
} from "@/server/modules/reviews/schemas";
import { decideReview } from "@/server/modules/reviews/use-cases/decide-review";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return handleApiRoute(async () => {
    const params = parseData(await context.params, reviewIdParamsSchema);
    const input = await parseJsonBody(request, reviewDecisionRequestSchema);
    const user = await requireCurrentUser("viewer");
    const result = await decideReview({
      reviewRequestId: params.id,
      input,
      idempotencyKey: request.headers.get("idempotency-key") ?? input.idempotencyKey,
      user
    });

    return NextResponse.json(result);
  });
}
