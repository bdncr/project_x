export type EmbedKind = "embed" | "prototype" | "3d";

/** "private" never actually goes public (see persist() in components/project/editor/ProjectEditorScreen.tsx) —
 * password-protected and link-only stay visible-but-Pro-locked in the Settings modal,
 * matching the reference editor, since neither has anything to connect to on this app's side. */
export type ProjectVisibility = "everyone" | "private";

export const MAX_TAGS = 10;

export const LICENSE_OPTIONS: { value: string; label: string }[] = [
  { value: "all_rights_reserved", label: "Бүх эрх хуулиар хамгаалагдсан" },
  { value: "cc_by", label: "Creative Commons — Attribution" },
  { value: "cc_by_nc", label: "Creative Commons — Attribution, Non-commercial" },
  { value: "public_domain", label: "Creative Commons — Public Domain" },
];

export type ProjectBlock =
  | { id: string; type: "text"; html: string }
  | { id: string; type: "image"; url: string; caption: string }
  | { id: string; type: "photo_grid"; urls: string[] }
  | { id: string; type: "video"; url: string }
  | { id: string; type: "embed"; url: string; kind: EmbedKind };

export type BlockType = ProjectBlock["type"];

export type ModuleButton = { type: BlockType; label: string; kind?: EmbedKind; disabled?: true };

/** The reference editor's 8-module row, in its exact order. Lightroom is kept as a
 * visible-but-disabled entry for layout fidelity — it's an Adobe-account integration
 * with nothing on Project X's side to connect it to. */
export const MODULE_BUTTONS: ModuleButton[] = [
  { type: "image", label: "Зураг" },
  { type: "text", label: "Текст" },
  { type: "photo_grid", label: "Зургийн тор" },
  { type: "video", label: "Видео/Аудио" },
  { type: "embed", label: "Embed", kind: "embed" },
  { type: "embed", label: "Lightroom", kind: "embed", disabled: true },
  { type: "embed", label: "Прототип", kind: "prototype" },
  { type: "embed", label: "3D", kind: "3d" },
];

function newBlockId() {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBlock(type: BlockType, kind?: EmbedKind): ProjectBlock {
  const id = newBlockId();
  switch (type) {
    case "text": return { id, type, html: "" };
    case "image": return { id, type, url: "", caption: "" };
    case "photo_grid": return { id, type, urls: ["", "", ""] };
    case "video": return { id, type, url: "" };
    case "embed": return { id, type, url: "", kind: kind ?? "embed" };
  }
}

/** Allow-lists a small, safe subset of inline formatting tags for the text block —
 * everything else (script, style, event handlers, iframes, ...) is stripped, since this
 * HTML is later rendered on other users' pages via a project's public detail view. */
export function sanitizeRichText(html: string): string {
  const allowedTags = new Set(["B", "STRONG", "I", "EM", "U", "P", "BR", "DIV", "SPAN", "UL", "OL", "LI", "A"]);
  if (typeof window === "undefined" || typeof document === "undefined") return "";
  const template = document.createElement("template");
  template.innerHTML = html;

  function clean(node: Node) {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === Node.TEXT_NODE) continue;
      if (child.nodeType !== Node.ELEMENT_NODE) { node.removeChild(child); continue; }
      const el = child as HTMLElement;
      if (!allowedTags.has(el.tagName)) {
        const text = document.createTextNode(el.textContent ?? "");
        node.replaceChild(text, el);
        continue;
      }
      for (const attr of [...el.attributes]) {
        if (el.tagName === "A" && attr.name === "href") continue;
        el.removeAttribute(attr.name);
      }
      if (el.tagName === "A") {
        const href = el.getAttribute("href") ?? "";
        if (!/^https?:\/\//i.test(href)) el.removeAttribute("href");
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      }
      clean(el);
    }
  }
  clean(template.content);
  return template.innerHTML;
}

/** Pulls the iframe src out of a pasted embed snippet, or accepts a plain URL as-is. */
export function extractEmbedUrl(pasted: string): string {
  const trimmed = pasted.trim();
  const match = trimmed.match(/src=["']([^"']+)["']/i);
  return match ? match[1] : trimmed;
}

/** The only value that may ever reach an <iframe src>. Anything that is not an absolute
 * http(s) URL returns null, because a relative src resolves against the page the iframe sits
 * on: a half-typed "h" in the embed field becomes /project/h and loads the whole app inside
 * itself, recursively, on every keystroke. */
export function safeEmbedUrl(raw: string): string | null {
  const candidate = extractEmbedUrl(raw);
  if (!candidate) return null;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? parsed.href : null;
  } catch {
    return null;
  }
}

/** Normalizes a YouTube/Vimeo watch URL into its embeddable form; returns null for anything else. */
export function normalizeVideoEmbedUrl(rawUrl: string): string | null {
  const url = extractEmbedUrl(rawUrl);
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com" || parsed.pathname.startsWith("/embed/")) return url;
    return null;
  } catch {
    return null;
  }
}

/** Drops empty blocks (never filled in) before saving, and trims a photo grid's blank slots. */
export function cleanBlocksForSave(blocks: ProjectBlock[]): ProjectBlock[] {
  return blocks
    .map((block) => block.type === "photo_grid" ? { ...block, urls: block.urls.filter((url) => url.trim()) } : block)
    .filter((block) => {
      switch (block.type) {
        case "text": return block.html.replace(/<[^>]*>/g, "").trim().length > 0;
        case "image": return block.url.trim().length > 0;
        case "photo_grid": return block.urls.length > 0;
        case "video": return block.url.trim().length > 0;
        case "embed": return block.url.trim().length > 0;
      }
    });
}

/** A short plain-text summary derived from the first text block, for search and card
 * previews — the same role `summary` plays for the simple form's textarea. */
export function deriveSummaryFromBlocks(blocks: ProjectBlock[]): string {
  const firstText = blocks.find((block) => block.type === "text" && block.html.trim());
  if (!firstText || firstText.type !== "text") return "";
  const plain = firstText.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return plain.length > 220 ? `${plain.slice(0, 217)}…` : plain;
}

/** Falls back to the first image found in the blocks when no explicit cover was set. */
export function firstImageFromBlocks(blocks: ProjectBlock[]): string | null {
  for (const block of blocks) {
    if (block.type === "image" && block.url.trim()) return block.url.trim();
    if (block.type === "photo_grid") { const found = block.urls.find((url) => url.trim()); if (found) return found; }
  }
  return null;
}

