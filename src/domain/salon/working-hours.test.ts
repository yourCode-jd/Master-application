import { describe, expect, it } from "vitest";
import { assertWithinWorkingHours, readWorkingHours } from "./working-hours";

const within = (startAt: string, endAt: string, locationHours: object | null = null) => () => assertWithinWorkingHours({
  startAt: new Date(startAt), endAt: new Date(endAt), timezone: "Asia/Kolkata", businessHours: null, locationHours,
});

describe("working-hour booking guard", () => {
  it("allows an appointment wholly inside the normal business day", () => {
    expect(within("2026-10-08T04:30:00.000Z", "2026-10-08T05:00:00.000Z")).not.toThrow();
  });

  it("rejects bookings after closing and on a closed day", () => {
    expect(within("2026-10-08T12:45:00.000Z", "2026-10-08T13:15:00.000Z")).toThrow("09:00–18:00");
    expect(within("2026-10-11T04:30:00.000Z", "2026-10-11T05:00:00.000Z")).toThrow("another day");
  });

  it("uses a valid location override without changing the business default", () => {
    const locationHours = { "4": { open: "11:00", close: "20:00", closed: false } };
    expect(readWorkingHours(locationHours)["4"]).toEqual({ open: "11:00", close: "20:00", closed: false });
    expect(within("2026-10-08T04:30:00.000Z", "2026-10-08T05:00:00.000Z", locationHours)).toThrow("11:00–20:00");
    expect(within("2026-10-08T06:00:00.000Z", "2026-10-08T06:30:00.000Z", locationHours)).not.toThrow();
  });
});
