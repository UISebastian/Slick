import { createHash } from "node:crypto";
import { conflict } from "../workflows/errors";
import { idempotencyStore, type IdempotencyStore } from "./store";

export type IdempotencyResult<T> = {
  result: T;
  replayed: boolean;
};

export type RunWithIdempotencyInput<T> = {
  agencyId: string;
  operation: string;
  idempotencyKey: string;
  request: unknown;
  store?: IdempotencyStore;
  execute: () => Promise<T>;
};

export type RunMaybeWithIdempotencyInput<T> = Omit<
  RunWithIdempotencyInput<T>,
  "idempotencyKey"
> & {
  idempotencyKey?: string;
};

export async function runWithIdempotency<T>(input: RunWithIdempotencyInput<T>) {
  const store = input.store ?? idempotencyStore;
  const requestHash = hashRequest(input.request);
  const existing = await store.find({
    agencyId: input.agencyId,
    operation: input.operation,
    idempotencyKey: input.idempotencyKey
  });

  if (existing) {
    if (existing.requestHash !== requestHash) {
      throw conflict("Idempotency key was already used for a different request");
    }

    if (existing.status === "succeeded") {
      return {
        result: existing.response as T,
        replayed: true
      };
    }

    throw conflict("Idempotent request is already in progress or failed", {
      status: existing.status
    });
  }

  const record = await store.start({
    agencyId: input.agencyId,
    operation: input.operation,
    idempotencyKey: input.idempotencyKey,
    requestHash
  });

  try {
    const result = await input.execute();
    await store.complete({
      id: record.id,
      status: "succeeded",
      response: result
    });

    return {
      result,
      replayed: false
    };
  } catch (error) {
    await store.complete({
      id: record.id,
      status: "failed"
    });
    throw error;
  }
}

export async function runMaybeWithIdempotency<T>(input: RunMaybeWithIdempotencyInput<T>) {
  if (!input.idempotencyKey) {
    return {
      result: await input.execute(),
      replayed: false
    };
  }

  return runWithIdempotency({
    ...input,
    idempotencyKey: input.idempotencyKey
  });
}

function hashRequest(request: unknown) {
  return createHash("sha256").update(stableStringify(request)).digest("hex");
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.keys(record)
      .sort()
      .reduce<Record<string, unknown>>((sorted, key) => {
        sorted[key] = sortValue(record[key]);
        return sorted;
      }, {});
  }

  return value;
}
