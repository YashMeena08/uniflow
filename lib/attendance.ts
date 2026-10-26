export type AttendanceStats = {
  total: number; attended: number; pct: number | null;
  needed: number | null; canMiss: number; impossible: boolean; safe: boolean;
};
/** target is a percent, e.g. 75 */
export function attendanceStats(attended: number, total: number, target: number): AttendanceStats {
  const t = target / 100;
  const pct = total > 0 ? (attended / total) * 100 : null;
  if (total === 0) return { total, attended, pct, needed: null, canMiss: 0, impossible: false, safe: true };
  if (pct! >= target) {
    // max classes that can be missed while staying >= target
    const canMiss = t > 0 ? Math.max(0, Math.floor(attended / t - total + 1e-9)) : 0;
    return { total, attended, pct, needed: 0, canMiss, impossible: false, safe: true };
  }
  if (t >= 1) return { total, attended, pct, needed: null, canMiss: 0, impossible: true, safe: false };
  const needed = Math.ceil((t * total - attended) / (1 - t) - 1e-9);
  return { total, attended, pct, needed: Math.max(1, needed), canMiss: 0, impossible: false, safe: false };
}
