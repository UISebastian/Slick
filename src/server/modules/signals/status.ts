import { assertTransition, type WorkflowStatus } from "../status/status-machine";
import type { SignalRecord } from "./types";

export function transitionSignalStatus(signal: SignalRecord, to: WorkflowStatus): SignalRecord {
  assertTransition(signal.status, to);

  return {
    ...signal,
    status: to,
    updatedAt: new Date().toISOString(),
    rowVersion: signal.rowVersion + 1
  };
}
