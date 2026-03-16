import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a date string to readable format without timezone conversion
 * Input: "2026-02-19" (YYYY-MM-DD)
 * Output: "Feb 19, 2026" or "2/19/2026"
 */
export function formatDateString(dateString: string): string {
  if (!dateString) return "";
  
  // Split the date string to avoid timezone conversion
  const [year, month, day] = dateString.split("-").map(Number);
  
  // Create date in local timezone (month is 0-indexed)
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

/**
 * Formats a time string to 12-hour format (e.g., "2:30 PM")
 * Accepts: "HH:MM:SS", "HH:MM", or ISO timestamp
 */
export function formatTime12h(timeString: string | null | undefined): string {
  if (!timeString) return "-";
  
  try {
    // Extract time portion if it's a full timestamp
    let time = timeString;
    if (timeString.includes("T")) {
      time = timeString.split("T")[1].split(".")[0]; // Get HH:MM:SS from ISO
    }
    
    // Parse HH:MM:SS or HH:MM
    const [hours, minutes] = time.split(":").map(Number);
    
    // Convert to 12-hour format
    const period = hours >= 12 ? "PM" : "AM";
    const hour12 = hours % 12 || 12; // Convert 0 to 12 for midnight
    
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`;
  } catch (error) {
    console.error("Error formatting time:", error, timeString);
    return timeString;
  }
}

/**
 * Formats a date and time to 12-hour format (e.g., "Feb 19, 2026 2:30 PM")
 * Uses provided date to prevent timezone-related date shifts
 */
export function formatDateTime12h(timestamp: string, dateOverride?: string): string {
  const date = dateOverride || timestamp.split('T')[0];
  const formattedDate = formatDate(date);
  const time = formatTime12h(timestamp);
  return `${formattedDate} ${time}`;
}

/**
 * Formats a date string to readable format (e.g., "Feb 19, 2026")
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}
