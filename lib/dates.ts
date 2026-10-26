/** YYYY-MM-DD for today + offset days in the given IANA time zone. */
export const dayKey = (offset = 0, tz = "UTC") =>
  new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 86400000));
export function isValidTz(tz: string) {
  try { new Intl.DateTimeFormat("en-CA", { timeZone: tz }); return true; } catch { return false; }
}
export function fmtDur(seconds: number) {
  const h = Math.floor(seconds / 3600), m = Math.floor((seconds % 3600) / 60);
  return h ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
