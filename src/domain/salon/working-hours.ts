import { Prisma } from "@prisma/client";

export type DayHours = { closed: boolean; open: string; close: string };
export type WorkingHours = Record<string, DayHours>;
export const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const defaultWorkingHours = (): WorkingHours => Object.fromEntries(dayNames.map((_, day) => [String(day), { closed: day === 0, open: "09:00", close: "18:00" }]));
const time = (value: unknown) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value) ? value : null;

export function readWorkingHours(value: Prisma.JsonValue | null | undefined): WorkingHours {
  const fallback = defaultWorkingHours();
  if (!value || typeof value !== "object" || Array.isArray(value)) return fallback;
  for (const day of Object.keys(fallback)) {
    const row = (value as Record<string, unknown>)[day];
    if (!row || typeof row !== "object" || Array.isArray(row)) continue;
    const open = time((row as Record<string, unknown>).open); const close = time((row as Record<string, unknown>).close);
    if (open && close && open < close) fallback[day] = { closed: Boolean((row as Record<string, unknown>).closed), open, close };
  }
  return fallback;
}

export function workingHoursFromForm(form: FormData): WorkingHours {
  const hours = defaultWorkingHours();
  for (const day of Object.keys(hours)) {
    const open = time(String(form.get(`hours_${day}_open`) ?? "")); const close = time(String(form.get(`hours_${day}_close`) ?? ""));
    if (!open || !close || open >= close) throw new Error(`${dayNames[Number(day)]} needs an opening time before its closing time.`);
    hours[day] = { open, close, closed: form.get(`hours_${day}_closed`) === "on" };
  }
  return hours;
}

function zonedParts(value: Date, zone: string) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: zone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { weekday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(pick("weekday")), minute: Number(pick("hour")) * 60 + Number(pick("minute")) };
}

export function assertWithinWorkingHours(input: { startAt: Date; endAt: Date; timezone: string; businessHours: Prisma.JsonValue | null; locationHours: Prisma.JsonValue | null }) {
  const hours = readWorkingHours(input.locationHours ?? input.businessHours);
  const start = zonedParts(input.startAt, input.timezone), end = zonedParts(input.endAt, input.timezone);
  const day = hours[String(start.weekday)]; const open = Number(day.open.slice(0, 2)) * 60 + Number(day.open.slice(3)); const close = Number(day.close.slice(0, 2)) * 60 + Number(day.close.slice(3));
  if (start.weekday !== end.weekday || day.closed || start.minute < open || end.minute > close) throw new Error(`This location is open ${day.closed ? "on another day" : `${day.open}–${day.close}`} on ${dayNames[start.weekday]}. Choose a time within its opening hours.`);
}
