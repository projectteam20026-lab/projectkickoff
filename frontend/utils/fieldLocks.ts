/**
 * fieldLocks — قفل حقول التعديل الحساسة (username / email / password)
 * مدة القفل: 7 أيام بعد كل تغيير
 * المخزن: localStorage بمفتاح خاص بـ userId
 */

export const LOCK_DAYS = 7;
const LOCK_MS = LOCK_DAYS * 24 * 60 * 60 * 1000;

export function getLocks(uid: string): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(`kj_locks_${uid}`) || '{}'); }
  catch { return {}; }
}

export function setLock(uid: string, field: string): void {
  const l = getLocks(uid);
  l[field] = new Date().toISOString();
  localStorage.setItem(`kj_locks_${uid}`, JSON.stringify(l));
}

/** كم يوم تبقى قبل رفع القفل؟ (0 = متاح) */
export function daysLeft(uid: string, field: string): number {
  const l = getLocks(uid);
  if (!l[field]) return 0;
  const elapsed = Date.now() - new Date(l[field]).getTime();
  return Math.max(0, Math.ceil((LOCK_MS - elapsed) / 86_400_000));
}

export function isLocked(uid: string, field: string): boolean {
  return daysLeft(uid, field) > 0;
}
