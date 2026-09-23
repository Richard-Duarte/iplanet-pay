/**
 * Reminder day-of-month helpers (America/Sao_Paulo).
 * Day 1–30; months without that day clamp to last day of month.
 */

export const REMINDER_TZ = "America/Sao_Paulo";
export const REMINDER_HOUR = 10; // 10:00 local

/** Last calendar day of year/month (month 0-indexed). */
export function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Clamp day 1–30 to a real day in the given month. */
export function clampReminderDay(
  year: number,
  monthIndex: number,
  day: number,
): number {
  const wanted = Math.min(30, Math.max(1, Math.round(day)));
  return Math.min(wanted, daysInMonth(year, monthIndex));
}

/**
 * Build a Date for reminder_day at 10:00 America/Sao_Paulo
 * in the given calendar year/month (month 0-indexed, SP wall clock).
 */
export function reminderAtInMonth(
  year: number,
  monthIndex: number,
  reminderDay: number,
): Date {
  const day = clampReminderDay(year, monthIndex, reminderDay);
  // Construct as SP local via Intl offset trick: format parts then Date.UTC adjust
  // Use temporal-ish approach: create ISO string with fixed offset -03:00
  // (Sao Paulo is UTC-3 year-round, no DST since 2019)
  const mm = String(monthIndex + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const hh = String(REMINDER_HOUR).padStart(2, "0");
  return new Date(`${year}-${mm}-${dd}T${hh}:00:00-03:00`);
}

/** Next reminder_at from today onward for the given day-of-month. */
export function nextReminderAt(reminderDay: number, from: Date = new Date()): Date {
  const day = Math.min(30, Math.max(1, Math.round(reminderDay)));
  // Get current Y/M/D in America/Sao_Paulo
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REMINDER_TZ,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    hour12: false,
  }).formatToParts(from);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  let year = get("year");
  let monthIndex = get("month") - 1;
  const currentDay = get("day");
  let hour = get("hour");
  if (hour === 24) hour = 0;

  let candidate = reminderAtInMonth(year, monthIndex, day);
  const clampedThisMonth = clampReminderDay(year, monthIndex, day);
  const alreadyPassed =
    currentDay > clampedThisMonth ||
    (currentDay === clampedThisMonth && hour >= REMINDER_HOUR);

  if (alreadyPassed || candidate.getTime() <= from.getTime()) {
    monthIndex += 1;
    if (monthIndex > 11) {
      monthIndex = 0;
      year += 1;
    }
    candidate = reminderAtInMonth(year, monthIndex, day);
  }
  return candidate;
}

/** Advance one month from a fired reminder, same day clamp. */
export function advanceReminderAt(
  reminderDay: number,
  after: Date = new Date(),
): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: REMINDER_TZ,
    year: "numeric",
    month: "numeric",
  }).formatToParts(after);
  const get = (t: string) =>
    Number(parts.find((p) => p.type === t)?.value ?? "0");
  let year = get("year");
  let monthIndex = get("month") - 1 + 1;
  if (monthIndex > 11) {
    monthIndex = 0;
    year += 1;
  }
  return reminderAtInMonth(year, monthIndex, reminderDay);
}

export function parseReminderDay(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const day = Math.round(n);
  if (day < 1 || day > 30) return null;
  return day;
}
