const STORAGE_KEY = "projectx.search-history";
const MAX_ENTRIES = 8;

/** Shown before the visitor has searched anything of their own, so the panel is never
 * empty on first focus. Terms match the seed catalogue's categories. */
export const SUGGESTED_SEARCHES = ["брэнд", "ui/ux", "гэрэл зураг", "зураглал", "motion", "3d"];

/** localStorage throws outright in some contexts (private windows, blocked site data), so
 * every access is guarded — a browser that refuses storage still gets a working dropdown,
 * just without history. */
function readRaw(): string[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function write(terms: string[]): string[] {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(terms));
  } catch {
    // Nothing to do — the caller still gets the updated list for this session.
  }
  return terms;
}

export function readSearchHistory(): string[] {
  return readRaw();
}

/** Most recent first, de-duplicated case-insensitively so "UI/UX" doesn't sit next to "ui/ux". */
export function addSearchTerm(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return readRaw();
  const rest = readRaw().filter((entry) => entry.toLocaleLowerCase() !== trimmed.toLocaleLowerCase());
  return write([trimmed, ...rest].slice(0, MAX_ENTRIES));
}

export function removeSearchTerm(term: string): string[] {
  return write(readRaw().filter((entry) => entry !== term));
}

export function clearSearchHistory(): string[] {
  return write([]);
}
