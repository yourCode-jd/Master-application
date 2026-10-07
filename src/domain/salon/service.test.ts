import { describe, expect, it } from "vitest";
import { appointmentEnd, assertTransition } from "../../lib/salon-rules";

describe("salon appointment rules", () => {
  it("calculates a snapshot service end time", () => {
    expect(appointmentEnd(new Date("2026-10-06T10:00:00Z"), 45).toISOString()).toBe("2026-10-06T10:45:00.000Z");
  });

  it("allows the normal appointment lifecycle", () => {
    expect(() => assertTransition("PENDING", "CONFIRMED")).not.toThrow();
    expect(() => assertTransition("CONFIRMED", "ARRIVED")).not.toThrow();
    expect(() => assertTransition("ARRIVED", "IN_SERVICE")).not.toThrow();
    expect(() => assertTransition("IN_SERVICE", "COMPLETED")).not.toThrow();
  });

  it("blocks invalid lifecycle jumps", () => {
    expect(() => assertTransition("PENDING", "COMPLETED")).toThrow("cannot move");
    expect(() => assertTransition("COMPLETED", "CONFIRMED")).toThrow("cannot move");
  });
});
