import { NextResponse, type NextRequest } from "next/server";
import { handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseData, parseJsonBody } from "@/server/http/validation";
import {
  signalDecisionRequestSchema,
  signalIdParamsSchema
} from "@/server/modules/signals/schemas";
import { rejectSignal } from "@/server/modules/signals/use-cases/decide-signal";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  return handleApiRoute(async () => {
    const params = parseData(await context.params, signalIdParamsSchema);
    const input = await parseJsonBody(request, signalDecisionRequestSchema, {
      allowEmpty: true
    });
    const user = await requireCurrentUser("reviewer");
    const result = await rejectSignal({
      signalId: params.id,
      input,
      idempotencyKey: request.headers.get("idempotency-key") ?? input.idempotencyKey,
      user
    });

    return NextResponse.json(result);
  });
}
