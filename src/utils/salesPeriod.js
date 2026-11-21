// src/utils/salesPeriod.js
// Period choices (Today / Last 7 days / Last 30 days / Custom range) and date helpers.
// Dates are "YYYY-MM-DD" strings in local time.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const pad = (n) => String(n).padStart(2, "0");

export const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
  { value: "custom", label: "Custom range" },
];

// ("2026-11-13", -6) -> "2026-11-07"
export const addDays = (iso, days) => {
  const [year, month, day] = iso.split("-").map(Number);
  const d = new Date(year, month - 1, day + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// From/To dates for a preset period ending on `today` (both days included)
export const getPresetRange = (type, today) => {
  if (type === "today") return { from: today, to: today };
  return { from: addDays(today, -(Number(type) - 1)), to: today };
};

// "2026-11-07" -> "7 Nov"
export const formatDayMonth = (iso) => {
  const [, month, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}`;
};

// "2026-11-07" -> "07 Nov 2026"
export const formatFullDate = (iso) => {
  const [year, month, day] = iso.split("-").map(Number);
  return `${pad(day)} ${MONTHS[month - 1]} ${year}`;
};

// Text for the period button, e.g. "Last 7 days" or "7 Nov – 13 Nov"
export const periodButtonLabel = (period) =>
  period.type === "custom"
    ? `${formatDayMonth(period.from)} – ${formatDayMonth(period.to)}`
    : PERIOD_OPTIONS.find((o) => o.value === period.type)?.label ?? "";

// Text used in sentences, e.g. "today" or "in the last 7 days"
export const periodPhrase = (period) => {
  if (period.type === "today") return "today";
  if (period.type === "custom") {
    return period.from === period.to
      ? `on ${formatDayMonth(period.from)}`
      : `from ${formatDayMonth(period.from)} to ${formatDayMonth(period.to)}`;
  }
  return `in the last ${period.type} days`;
};
