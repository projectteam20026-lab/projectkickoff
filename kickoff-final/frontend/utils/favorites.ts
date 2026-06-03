/**
 * favorites — حفظ الملاعب المفضلة لكل مستخدم
 * المخزن: localStorage بمفتاح خاص بـ userId
 */

const KEY = (uid: string) => `kj_favs_${uid}`;

export function getFavorites(uid: string): string[] {
  try { return JSON.parse(localStorage.getItem(KEY(uid)) || '[]'); }
  catch { return []; }
}

/** يضيف أو يحذف — يرجع true إذا أصبح مفضلاً */
export function toggleFavorite(uid: string, fieldId: string): boolean {
  const favs = getFavorites(uid);
  const idx  = favs.indexOf(fieldId);
  if (idx === -1) favs.push(fieldId);
  else            favs.splice(idx, 1);
  localStorage.setItem(KEY(uid), JSON.stringify(favs));
  return idx === -1;
}

export function isFavorite(uid: string, fieldId: string): boolean {
  return getFavorites(uid).includes(fieldId);
}
