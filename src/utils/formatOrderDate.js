// src/utils/formatOrderDate.js
// "2026-11-20" -> "20 Nov 2026" (or "20 Nov" when withYear is false)
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const formatOrderDate = (isoDate, withYear = true) => {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${day} ${MONTHS[month - 1]}${withYear ? ` ${year}` : ""}`;
};

export default formatOrderDate;
