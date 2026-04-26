import { NextResponse, type NextRequest } from "next/server";
import { handleApiRoute } from "@/server/http/api-response";
import { requireCurrentUser } from "@/server/http/auth";
import { parseSearchParams } from "@/server/http/validation";
import { listSignalsQuerySchema } from "@/server/modules/signals/schemas";
import { listSignals } from "@/server/modules/signals/use-cases/list-signals";

export async function GET(request: NextRequest) {
  return handleApiRoute(async () => {
    const input = parseSearchParams(request.nextUrl.searchParams, listSignalsQuerySchema);
    const user = await requireCurrentUser("viewer");
    const result = await listSignals({ input, user });

    return NextResponse.json(result);
  });
}
