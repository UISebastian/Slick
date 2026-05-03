import { beforeEach, describe, expect, it } from "vitest";
import { resetWorkflowMemoryStore } from "../workflows/in-memory-store";
import { runWithIdempotency } from "./with-idempotency";

const agencyId = "00000000-0000-4000-8000-000000000010";

describe("runWithIdempotency", () => {
  beforeEach(() => {
    resetWorkflowMemoryStore();
  });

  it("replays a completed operation when the key and request body match", async () => {
    let executions = 0;

    const first = await runWithIdempotency({
      agencyId,
      operation: "signals.import",
      idempotencyKey: "idem-replay-test",
      request: {
        dedupeKey: "example.com:role:2026-04-26"
      },
      execute: async () => {
        executions += 1;
        return {
          importedCount: 1
        };
      }
    });

    const replay = await runWithIdempotency({
      agencyId,
      operation: "signals.import",
      idempotencyKey: "idem-replay-test",
      request: {
        dedupeKey: "example.com:role:2026-04-26"
      },
      execute: async () => {
        executions += 1;
        return {
          importedCount: 2
        };
      }
    });

    expect(executions).toBe(1);
    expect(first.replayed).toBe(false);
    expect(replay.replayed).toBe(true);
    expect(replay.result).toEqual({
      importedCount: 1
    });
  });

  it("rejects an idempotency key reused with a different request body", async () => {
    await runWithIdempotency({
      agencyId,
      operation: "signals.import",
      idempotencyKey: "idem-body-mismatch-test",
      request: {
        dedupeKey: "example.com:first"
      },
      execute: async () => ({
        importedCount: 1
      })
    });

    await expect(
      runWithIdempotency({
        agencyId,
        operation: "signals.import",
        idempotencyKey: "idem-body-mismatch-test",
        request: {
          dedupeKey: "example.com:changed"
        },
        execute: async () => ({
          importedCount: 1
        })
      })
    ).rejects.toMatchObject({
      code: "conflict",
      statusCode: 409
    });
  });
});

