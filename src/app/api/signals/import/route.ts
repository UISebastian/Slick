import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseJsonBody } from "@/server/http/validation";
import { importSignalsRequestSchema } from "@/server/modules/signals/schemas";
import { importSignals } from "@/server/modules/signals/use-cases/import-signals";
import { badRequest } from "@/server/modules/workflows/errors";

const idempotencyKeySchema = z.string().trim().min(8).max(200);

export async function POST(request: NextRequest) {
  return handleApiRoute(async () => {
    const input = await parseJsonBody(request, importSignalsRequestSchema);
    const user = await requireCurrentUser("admin");
    const idempotencyKey = parseIdempotencyKey(request, input.idempotencyKey);

    const result = await importSignals({
      input,
      idempotencyKey,
      user
    });

    return NextResponse.json(result, {
      status: result.idempotentReplay ? 200 : 201
    });
  });
}

function parseIdempotencyKey(request: NextRequest, bodyKey?: string) {
  const headerKey = request.headers.get("idempotency-key") ?? undefined;
  const parsed = idempotencyKeySchema.safeParse(headerKey ?? bodyKey);
  if (!parsed.success) {
    throw badRequest("Idempotency-Key header or idempotencyKey body field is required");
  }

  return parsed.data;
}
