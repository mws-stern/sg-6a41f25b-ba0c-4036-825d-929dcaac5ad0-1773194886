/**
 * Centralized date/time utilities for New York timezone (America/New_York)
 * All dates and times in the app should use these utilities for consistency
 */

const NY_TIMEZONE = "America/New_York";

/**
 * INTERNAL: Parse a date value safely.
 * Plain "YYYY-MM-DD" strings are treated as LOCAL midnight (not UTC midnight)
 * to avoid the classic "off-by-one-day" UTC-shift bug.
 * Full ISO strings that already contain a time/timezone are parsed as-is.
 */
function parseDate(date: Date | string): Date {
  if (typeof date === "string") {
    // Plain date-only string (YYYY-MM-DD) - no time, no timezone.
    // JavaScript parses these as UTC midnight, which causes a display shift
    // when the user's machine or the NY timezone is behind UTC.
    // Fix: append T12:00:00 so the midday anchor is safely inside the intended day
    // regardless of any UTC offset.
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return new Date(date + "T12:00:00");
    }
    return new Date(date);
  }
  return date;
}

/**
 * Get a local YYYY-MM-DD string from a Date object without UTC conversion.
 * Use this instead of date.toISOString().split("T")[0] which returns the UTC date
 * and can show tomorrow/yesterday due to timezone offset.
 * Example: new Date() at 11 PM NY -> "2026-03-15" (not "2026-03-16")
 */
export function toLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Get the end-of-day ISO timestamp for a YYYY-MM-DD string in the NY timezone.
 * Use this for Supabase queries so that clock-in entries from 7 PM-midnight
 * NY time (which are stored as next-day UTC) are NOT missed.
 * EST example: "2026-03-15" -> "2026-03-16T04:59:59.999Z"
 * EDT example: "2026-03-15" -> "2026-03-16T03:59:59.999Z"
 */
export function getEndOfDayNY(dateStr: string): string {
  // Build "end of day" as a local-NY time by finding the UTC offset for that date.
  // We create a reference timestamp at 23:59:59 "as if" local, then compute the
  // actual UTC equivalent using Intl to detect the NY offset (handles DST).
  const localMidnight = new Date(dateStr + "T00:00:00");
  // Get the NY offset in minutes for this specific date (handles EST vs EDT)
  const nyDateStr = localMidnight.toLocaleString("en-US", { timeZone: NY_TIMEZONE });
  const nyDate = new Date(nyDateStr);
  const offsetMs = localMidnight.getTime() - nyDate.getTime();
  // End of day NY = midnight of next day in NY, minus 1ms
  const nextDayLocalMidnight = new Date(dateStr + "T00:00:00");
  nextDayLocalMidnight.setDate(nextDayLocalMidnight.getDate() + 1);
  const endOfDayUTC = new Date(nextDayLocalMidnight.getTime() + offsetMs - 1);
  return endOfDayUTC.toISOString();
}

/**
 * Get the start-of-day ISO timestamp for a YYYY-MM-DD string in the NY timezone.
 * EST example: "2026-03-15" -> "2026-03-15T05:00:00.000Z"
 */
export function getStartOfDayNY(dateStr: string): string {
  const localMidnight = new Date(dateStr + "T00:00:00");
  const nyDateStr = localMidnight.toLocaleString("en-US", { timeZone: NY_TIMEZONE });
  const nyDate = new Date(nyDateStr);
  const offsetMs = localMidnight.getTime() - nyDate.getTime();
  const startOfDayUTC = new Date(localMidnight.getTime() + offsetMs);
  return startOfDayUTC.toISOString();
}

/**
 * Format date and time in 12-hour format with NY timezone
 * Example: "03/02/2026, 8:23 PM"
 */
export function formatDateTime(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Alias for formatDateTime - 12-hour format with NY timezone
 * Example: "03/02/2026, 8:23 PM"
 */
export function formatDateTime12h(date: Date | string): string {
  return formatDateTime(date);
}

/**
 * Format date only (no time) with NY timezone
 * Example: "03/02/2026"
 */
export function formatDate(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "2-digit",
    day: "2-digit",
    year: "numeric"
  });
}

/**
 * Format time only (no date) in 12-hour format with NY timezone
 * Example: "8:23 PM"
 */
export function formatTime(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleTimeString("en-US", {
    timeZone: NY_TIMEZONE,
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Alias for formatTime - 12-hour format with NY timezone
 * Example: "8:23 PM"
 */
export function formatTime12h(date: Date | string): string {
  return formatTime(date);
}

/**
 * Format date in long format for reports
 * Example: "March 02, 2026"
 */
export function formatDateLong(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "long",
    day: "2-digit",
    year: "numeric"
  });
}

/**
 * Format date and time for reports with long date
 * Example: "March 02, 2026, 8:23 PM"
 */
export function formatDateTimeLong(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "long",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Format date for PDF reports
 * Example: "Mar 02, 2026"
 */
export function formatDateShort(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
}

/**
 * Format date and time for PDF reports
 * Example: "Mar 02, 2026 8:23 PM"
 */
export function formatDateTimeShort(date: Date | string): string {
  const d = parseDate(date);
  return d.toLocaleString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  });
}

/**
 * Get current date/time in NY timezone
 */
export function getNowNY(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: NY_TIMEZONE }));
}

/**
 * Format date range for reports
 * Example: "Mar 16 - Mar 02, 2026"
 */
export function formatDateRange(startDate: Date | string, endDate: Date | string): string {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  const startFormatted = start.toLocaleDateString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "short",
    day: "2-digit"
  });
  
  const endFormatted = end.toLocaleDateString("en-US", {
    timeZone: NY_TIMEZONE,
    month: "short",
    day: "2-digit",
    year: "numeric"
  });
  
  return `${startFormatted} - ${endFormatted}`;
}