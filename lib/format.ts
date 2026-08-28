export const compactNumber = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);

export const formatDate = (value: string) => new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric" }).format(new Date(value));

/** "3 цагийн өмнө" style stamps for feed-like lists (job cards, project comments). */
export function relativeDate(value: string) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(elapsed / 3600000);
  if (hours < 1) return "Саяхан";
  if (hours < 24) return String(hours) + " цагийн өмнө";
  const days = Math.floor(hours / 24);
  if (days < 7) return String(days) + " өдрийн өмнө";
  return String(Math.floor(days / 7)) + " долоо хоногийн өмнө";
}
