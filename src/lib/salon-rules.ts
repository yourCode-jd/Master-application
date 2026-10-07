const transitions: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "NO_SHOW"],
  CONFIRMED: ["ARRIVED", "CANCELLED", "NO_SHOW"],
  ARRIVED: ["IN_SERVICE", "CANCELLED"],
  IN_SERVICE: ["COMPLETED", "CANCELLED"],
};

export function assertTransition(from: string, to: string) {
  if (!transitions[from]?.includes(to)) throw new Error(`This appointment cannot move from ${from} to ${to}.`);
}

export function appointmentEnd(startAt: Date, durationMinutes: number) {
  return new Date(startAt.getTime() + durationMinutes * 60_000);
}
