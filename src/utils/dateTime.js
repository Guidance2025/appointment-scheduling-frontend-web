const PH_TIMEZONE = "Asia/Manila";

/**
 * Parse UTC ISO string -> PH Date object
 */
export const parseUTCToPH = (isoString) => {
  if (!isoString) return null;
  const dateUTC = new Date(isoString.endsWith("Z") ? isoString : `${isoString}Z`);
  if (isNaN(dateUTC.getTime())) return null;
  const phDateStr = dateUTC.toLocaleString("en-US", { timeZone: PH_TIMEZONE });
  return new Date(phDateStr);
};

/**
 * Get current PH time as Date object
 */
export const getCurrentPHTime = () => {
  const now = new Date();
  const phDateStr = now.toLocaleString("en-US", { timeZone: PH_TIMEZONE });
  return new Date(phDateStr);
};

/**
 * Convert PH Date object → UTC ISO string for backend
 */
export const convertLocalToUTCISO = (localDate) => {
  if (!localDate || isNaN(localDate.getTime())) return null;
  // Use the actual UTC components of the local PH date
  const iso = new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000).toISOString();
  return iso.split(".")[0]; // "YYYY-MM-DDTHH:mm:ss"
};

/**
 * Combine date + time inputs -> Date object in PH timezone
 * dateStr: "2025-12-15", timeStr: "14:30"
 */
export const combineDateAndTimePH = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  // Create a PH-local Date object (no UTC offset hack)
  const phDate = new Date(`${dateStr}T${timeStr}:00`);
  const offset = phDate.getTimezoneOffset(); // minutes difference from local
  // Convert local JS time to PH timezone
  const phTime = new Date(phDate.getTime() + offset * 60000);
  return phTime;
};

/**
 * Format date in PH timezone
 */
export const formatDatePH = (dateInput, options = {}) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleDateString("en-US", { timeZone: PH_TIMEZONE, ...options });
};

/**
 * Format time in PH timezone
 */
export const formatTimePH = (dateInput, options = {}) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return "N/A";
  return date.toLocaleTimeString("en-US", {
    timeZone: PH_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    ...options,
  });
};

/**
 * Format full appointment
 */
export const formatAppointmentDateTime = (start, end) => {
  const startDate = parseUTCToPH(start);
  if (!startDate || isNaN(startDate.getTime())) return { date: "N/A", timeRange: "N/A" };
  const formattedDate = formatDatePH(startDate, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const startTime = formatTimePH(startDate);
  if (!end) return { date: formattedDate, timeRange: startTime };
  const endTime = formatTimePH(end);
  return { date: formattedDate, timeRange: `${startTime} - ${endTime}` };
};

/**
 * Check if date is past (PH timezone)
 */
export const isPastDatePH = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return false;
  return date < getCurrentPHTime();
};

/**
 * Minutes until date (PH timezone)
 */
export const getMinutesUntilPH = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return 0;
  return Math.floor((date - getCurrentPHTime()) / 60000);
};

/**
 * Short date for input/display
 */
export const formatDateForInput = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

/**
 * Time for input[type="time"]
 */
export const formatTimeForInput = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date) return "";
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

/**
 * Format short / full datetime
 */
export const formatShortDatePH = (dateInput) => formatDatePH(dateInput, { month: "short", day: "numeric", year: "numeric" });
export const formatFullDateTimePH = (dateInput) =>
  formatDatePH(dateInput, { month: "long", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });


/**
 * Check if a date is today in PH timezone
 */
export const isTodayPH = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return false;
  
  const now = getCurrentPHTime();
  
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

/**
 * Check if a date is in this week (Sunday to Saturday) in PH timezone
 */
export const isThisWeekPH = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return false;
  
  const now = getCurrentPHTime();
  
  // Get the start of the week (Sunday)
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  
  // Get the end of the week (Saturday)
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  return date >= startOfWeek && date <= endOfWeek;
};

/**
 * Check if a date is in this month in PH timezone
 */
export const isThisMonthPH = (dateInput) => {
  const date = typeof dateInput === "string" ? parseUTCToPH(dateInput) : dateInput;
  if (!date || isNaN(date.getTime())) return false;
  
  const now = getCurrentPHTime();
  
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

/**
 * Get the start of today in PH timezone
 */
export const getStartOfTodayPH = () => {
  const now = getCurrentPHTime();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
};

/**
 * Get the end of today in PH timezone
 */
export const getEndOfTodayPH = () => {
  const now = getCurrentPHTime();
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
};

/**
 * Get the start of this week (Sunday) in PH timezone
 */
export const getStartOfWeekPH = () => {
  const now = getCurrentPHTime();
  const startOfWeek = new Date(now);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return startOfWeek;
};

/**
 * Get the end of this week (Saturday) in PH timezone
 */
export const getEndOfWeekPH = () => {
  const startOfWeek = getStartOfWeekPH();
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
};

/**
 * Get the start of this month in PH timezone
 */
export const getStartOfMonthPH = () => {
  const now = getCurrentPHTime();
  const startOfMonth = new Date(now);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
};

/**
 * Get the end of this month in PH timezone
 */
export const getEndOfMonthPH = () => {
  const now = getCurrentPHTime();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
};