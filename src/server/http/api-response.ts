import { NextResponse } from "next/server";
import { PolicyDeniedError } from "../modules/policies";
import { WorkflowApplicationError } from "../modules/workflows/errors";

export async function handleApiRoute(handler: () => Promise<Response> | Response) {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof WorkflowApplicationError) {
      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details
          }
        },
        { status: error.statusCode }
      );
    }

    if (error instanceof PolicyDeniedError) {
      return NextResponse.json(
        {
          error: {
            code: "policy_denied",
            message: "Decision denied by policy",
            details: {
              decision: error.result.decision,
              severity: error.result.severity,
              reasons: error.result.reasons,
              audit: error.result.audit
            }
          }
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "internal_server_error",
          message: "Internal server error"
        }
      },
      { status: 500 }
    );
  }
}
