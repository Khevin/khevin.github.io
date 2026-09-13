/*
 * panel/usage.js — a count of what the reader actually sent to an outside API
 * today, per kind and provider, so a free tier is visible before it runs out
 * rather than after.
 *
 * Only real network calls are counted. A translation or a picture search
 * answered from the cache costs nothing and is not recorded.
 *
 * The caps worth naming are the ones that bite:
 *   Google Custom Search  100 queries per DAY on the free tier — the smallest
 *                         budget in the extension, and the one a click on
 *                         "pictures" spends.
 *   Pixabay               no daily cap, 100 requests per minute.
 *   Google Translate      the keyless endpoint is unofficial and throttles by
 *                         IP, so no number can be promised; Cloud Translation
 *                         bills by character, not by request.
 */

export const DAILY_CAP = { google: 100 };

export function today(now = Date.now()) {
  const d = new Date(now);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Pure: yesterday's counts are dropped rather than added to. */
export function counted(usage, kind, provider, now = Date.now()) {
  const date = today(now);
  const base = usage && usage.date === date ? usage : { date };
  const forKind = { ...(base[kind] || {}) };
  forKind[provider] = (forKind[provider] || 0) + 1;
  return { ...base, date, [kind]: forKind };
}

/** "7 picture searches (Google Custom Search, 100 a day) · 3 translations" */
export function summarize(usage, now = Date.now()) {
  if (!usage || usage.date !== today(now)) return 'nothing sent to an outside service today';
  const parts = [];
  const images = usage.images || {};
  const g = images.google || 0;
  if (g) parts.push(`${g} of ${DAILY_CAP.google} Google picture searches`);
  const others = Object.entries(images).filter(([p, n]) => p !== 'google' && n).map(([p, n]) => `${n} from ${p}`);
  if (others.length) parts.push(`pictures: ${others.join(', ')}`);
  const t = Object.values(usage.translate || {}).reduce((a, b) => a + b, 0);
  if (t) parts.push(`${t} translation${t === 1 ? '' : 's'}`);
  return parts.length ? `today: ${parts.join(' · ')}` : 'nothing sent to an outside service today';
}

/** Over the free tier that actually stops working, so the UI can say so. */
export function overCap(usage, now = Date.now()) {
  if (!usage || usage.date !== today(now)) return false;
  return (usage.images && usage.images.google || 0) >= DAILY_CAP.google;
}

/** Record one real request. Storage failures never block the feature. */
export async function bump(kind, provider, storage = globalThis.chrome?.storage?.local) {
  if (!storage) return null;
  try {
    const { usage } = await storage.get('usage');
    const next = counted(usage, kind, provider);
    await storage.set({ usage: next });
    return next;
  } catch { return null; }
}

export async function read(storage = globalThis.chrome?.storage?.local) {
  if (!storage) return null;
  try { const { usage } = await storage.get('usage'); return usage || null; } catch { return null; }
}
