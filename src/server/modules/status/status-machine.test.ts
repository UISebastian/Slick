import { describe, expect, it } from "vitest";
import { canTransition } from "./status-machine";

describe("workflow status machine", () => {
  it("allows configured transitions", () => {
    expect(canTransition("signal.detected", "signal.triage_requested")).toBe(true);
  });

  it("rejects ad hoc jumps", () => {
    expect(canTransition("signal.detected", "dispatch.sent")).toBe(false);
  });
});
