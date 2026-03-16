const NY_TIMEZONE = "America/New_York";

function parseDate(date) {
  if (typeof date === "string") {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Date(date + "T12:00:00");
    return new Date(date);
  }
  return date;
}

export function toLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getEndOfDayNY(dateStr) {
  const localMidnight = new Date(dateStr + "T00:00:00");
  const nyDateStr = localMidnight.toLocaleString("en-US", { timeZone: NY_TIMEZONE });
  const nyDate = new Date(nyDateStr);
  const offsetMs = localMidnight.getTime() - nyDate.getTime();
  const next = new Date(dateStr + "T00:00:00");
  next.setDate(next.getDate() + 1);
  return new Date(next.getTime() + offsetMs - 1).toISOString();
}

export function getStartOfDayNY(dateStr) {
  const localMidnight = new Date(dateStr + "T00:00:00");
  const nyDateStr = localMidnight.toLocaleString("en-US", { timeZone: NY_TIMEZONE });
  const nyDate = new Date(nyDateStr);
  const offsetMs = localMidnight.getTime() - nyDate.getTime();
  return new Date(localMidnight.getTime() + offsetMs).toISOString();
}

export function formatDateTime(date) {
  const d = parseDate(date);
  return d.toLocaleString("en-US", { timeZone: NY_TIMEZONE, month:"2-digit", day:"2-digit", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
}
export function formatDateTime12h(date) { return formatDateTime(date); }

export function formatDate(date) {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", { timeZone: NY_TIMEZONE, month:"2-digit", day:"2-digit", year:"numeric" });
}

export function formatTime(date) {
  const d = parseDate(date);
  return d.toLocaleTimeString("en-US", { timeZone: NY_TIMEZONE, hour:"numeric", minute:"2-digit", hour12:true });
}
export function formatTime12h(date) { return formatTime(date); }

export function formatDateLong(date) {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", { timeZone: NY_TIMEZONE, month:"long", day:"2-digit", year:"numeric" });
}

export function formatDateTimeLong(date) {
  const d = parseDate(date);
  return d.toLocaleString("en-US", { timeZone: NY_TIMEZONE, month:"long", day:"2-digit", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
}

export function formatDateShort(date) {
  const d = parseDate(date);
  return d.toLocaleDateString("en-US", { timeZone: NY_TIMEZONE, month:"short", day:"2-digit", year:"numeric" });
}

export function formatDateTimeShort(date) {
  const d = parseDate(date);
  return d.toLocaleString("en-US", { timeZone: NY_TIMEZONE, month:"short", day:"2-digit", year:"numeric", hour:"numeric", minute:"2-digit", hour12:true });
}

export function getNowNY() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: NY_TIMEZONE }));
}

export function formatDateRange(startDate, endDate) {
  const start = parseDate(startDate);
  const end   = parseDate(endDate);
  const s = start.toLocaleDateString("en-US", { timeZone: NY_TIMEZONE, month:"short", day:"2-digit" });
  const e = end.toLocaleDateString("en-US",   { timeZone: NY_TIMEZONE, month:"short", day:"2-digit", year:"numeric" });
  return `${s} - ${e}`;
}
