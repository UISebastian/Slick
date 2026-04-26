import { NextResponse } from "next/server";
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
