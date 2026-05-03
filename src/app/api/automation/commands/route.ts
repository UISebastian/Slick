import { NextResponse, type NextRequest } from "next/server";
import { handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseJsonBody } from "@/server/http/validation";
import { automationCommandSchema, executeAutomationCommand } from "@/server/modules/automation";
import { conflict } from "@/server/modules/workflows/errors";

export async function POST(request: NextRequest) {
  return handleApiRoute(async () => {
    const command = await parseJsonBody(request, automationCommandSchema);
    const headerIdempotencyKey = request.headers.get("idempotency-key");
    const headerCorrelationId = request.headers.get("x-correlation-id");

    if (headerIdempotencyKey && headerIdempotencyKey !== command.idempotencyKey) {
      throw conflict("Idempotency-Key header does not match command idempotencyKey");
    }

    if (headerCorrelationId && headerCorrelationId !== command.correlationId) {
      throw conflict("X-Correlation-Id header does not match command correlationId");
    }

    const user = await requireCurrentUser("viewer");
    const result = await executeAutomationCommand({
      command,
      user
    });

    return NextResponse.json(result, {
      status:
        command.commandType === "signals.import" &&
        typeof result.result === "object" &&
        result.result !== null &&
        "idempotentReplay" in result.result &&
        result.result.idempotentReplay === true
          ? 200
          : 202
    });
  });
}
