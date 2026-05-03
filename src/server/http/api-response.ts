import { NextResponse } from "next/server";
import { PolicyDeniedError } from "../modules/policies";
import { WorkflowApplicationError } from "../modules/workflows/errors";

type ApiRouteContext = {
  request?: Request;
  requestId?: string;
  correlationId?: string;
};

type ApiMetadata = {
  requestId: string;
  correlationId: string;
};

export async function handleApiRoute(
  handler: (metadata: ApiMetadata) => Promise<Response> | Response,
  context: ApiRouteContext = {}
) {
  const metadata = getApiMetadata(context);

  try {
    return await handler(metadata);
  } catch (error) {
    if (error instanceof WorkflowApplicationError) {
      return apiError(
        {
          code: error.code,
          message: error.message,
          details: error.details
        },
        {
          status: error.statusCode,
          metadata
        }
      );
    }

    if (error instanceof PolicyDeniedError) {
      return apiError(
        {
          code: "policy_denied",
          message: "Decision denied by policy",
          details: {
            decision: error.result.decision,
            severity: error.result.severity,
            reasons: error.result.reasons,
            audit: error.result.audit
          }
        },
        {
          status: 403,
          metadata
        }
      );
    }

    return apiError(
      {
        code: "internal_server_error",
        message: "Internal server error"
      },
      {
        status: 500,
        metadata
      }
    );
  }
}

export function apiJson(body: unknown, init: ResponseInit = {}, context: ApiRouteContext = {}) {
  return NextResponse.json(body, withApiHeaders(init, getApiMetadata(context)));
}

function apiError(
  error: {
    code: string;
    message: string;
    details?: unknown;
  },
  options: {
    status: number;
    metadata: ApiMetadata;
  }
) {
  return NextResponse.json(
    {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        requestId: options.metadata.requestId,
        correlationId: options.metadata.correlationId
      }
    },
    withApiHeaders(
      {
        status: options.status,
        headers: {
          "cache-control": "no-store"
        }
      },
      options.metadata
    )
  );
}

function getApiMetadata(context: ApiRouteContext): ApiMetadata {
  const requestId =
    context.requestId ??
    context.request?.headers.get("x-request-id") ??
    context.request?.headers.get("x-correlation-id") ??
    crypto.randomUUID();
  const correlationId =
    context.correlationId ?? context.request?.headers.get("x-correlation-id") ?? requestId;

  return {
    requestId,
    correlationId
  };
}

function withApiHeaders(init: ResponseInit, metadata: ApiMetadata): ResponseInit {
  const headers = new Headers(init.headers);
  headers.set("x-request-id", metadata.requestId);
  headers.set("x-correlation-id", metadata.correlationId);

  return {
    ...init,
    headers
  };
}
