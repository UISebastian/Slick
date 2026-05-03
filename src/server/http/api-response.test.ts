import { describe, expect, it } from "vitest";
import { handleApiRoute } from "./api-response";
import { badRequest } from "../modules/workflows/errors";

describe("API response contract", () => {
  it("echoes request and correlation IDs on structured errors", async () => {
    const request = new Request("http://localhost/api/signals", {
      headers: {
        "x-request-id": "req-api-contract-test",
        "x-correlation-id": "corr-api-contract-test"
      }
    });

    const response = await handleApiRoute(() => {
      throw badRequest("Request validation failed", {
        issues: [
          {
            path: "signals.0.companyName",
            message: "Required"
          }
        ]
      });
    }, { request });

    expect(response.status).toBe(400);
    expect(response.headers.get("x-request-id")).toBe("req-api-contract-test");
    expect(response.headers.get("x-correlation-id")).toBe("corr-api-contract-test");
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "bad_request",
        message: "Request validation failed",
        details: {
          issues: [
            {
              path: "signals.0.companyName",
              message: "Required"
            }
          ]
        },
        requestId: "req-api-contract-test",
        correlationId: "corr-api-contract-test"
      }
    });
  });
});
