import { supabase } from "./supabase";
import { ContentItem, ContentStatus, addLocalProject, loadLocalProjects, removeLocalProject, updateLocalProject } from "./project-samples";
import { LICENSE_OPTIONS, ProjectBlock, ProjectVisibility } from "./project-editor";

export const PROJECT_CATEGORIES = ["Брэнд", "График", "Гэрэл зураг", "Зураглал", "UX/UI", "3D", "Motion"];
export const DEFAULT_PROJECT_COVER = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=88";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** True when this id addresses a Postgres row. Seed projects ("proj-07") and demo-mode drafts
 * ("local-…") never do, so they stay in localStorage even with a backend configured. */
export function isRemoteProject(id: string): boolean {
  return !!supabase && UUID_RE.test(id);
}

/** Everything the editor collects, independent of where it will be stored. */
export type ProjectDraft = {
  title: string;
  role: string;
  category: string;
  coverUrl: string;
  summary: string;
  blocks: ProjectBlock[];
  buttonLabel: string;
  buttonUrl: string;
  tags: string[];
  visibility: ProjectVisibility;
  isMature: boolean;
  commentsDisabled: boolean;
  license: string;
};

/** Timestamps of the project being edited, so re-saving does not restamp it. Null when creating. */
export type EditingDates = { publishedAt: string | null; createdAt: string } | null;

export type EditorAuthor = { id: string | null; name: string };

const EDIT_COLUMNS = "id,owner_id,title,role,category,cover_url,description,body_blocks,custom_button_label,custom_button_url,tags,visibility,is_mature,comments_disabled,license,is_published,published_at,created_at";

type EditRow = {
  id: string; owner_id: string | null; title: string; role: string | null; category: string;
  cover_url: string; description: string | null; body_blocks: ProjectBlock[] | null;
  custom_button_label: string | null; custom_button_url: string | null; tags: string[] | null;
  visibility: ProjectVisibility | null; is_mature: boolean | null; comments_disabled: boolean | null;
  license: string | null; is_published: boolean; published_at: string | null; created_at: string;
};

/* ---------------------------------- read for editing ---------------------------------- */

export type LoadForEditResult = {
  item: ContentItem | null;
  dates: EditingDates;
  /** Exists but belongs to somebody else — the caller should bounce back to the case study. */
  forbidden: boolean;
  error: string | null;
};

export async function loadProjectForEdit(id: string, userId: string | null): Promise<LoadForEditResult> {
  if (isRemoteProject(id) && userId) {
    const { data, error } = await supabase!.from("projects").select(EDIT_COLUMNS).eq("id", id).maybeSingle();
    if (error) return { item: null, dates: null, forbidden: false, error: error.message };
    if (!data) return { item: null, dates: null, forbidden: false, error: "Засах төсөл олдсонгүй." };
    const row = data as unknown as EditRow;
    if (row.owner_id !== userId) return { item: null, dates: null, forbidden: true, error: "Зөвхөн өөрийн бүтээлийг засна." };
    return {
      item: {
        id: row.id, ownerId: row.owner_id ?? "seed", title: row.title, creator: "", role: row.role ?? "",
        category: row.category, summary: row.description ?? "", coverUrl: row.cover_url,
        likes: 0, views: 0, saved: false, liked: false, status: row.is_published ? "published" : "draft",
        createdAt: row.created_at, blocks: row.body_blocks ?? [],
        customButtonLabel: row.custom_button_label ?? undefined, customButtonUrl: row.custom_button_url ?? undefined,
        tags: row.tags ?? [], visibility: row.visibility ?? "everyone", isMature: !!row.is_mature,
        commentsDisabled: !!row.comments_disabled, license: row.license ?? LICENSE_OPTIONS[0].value,
      },
      dates: { publishedAt: row.published_at, createdAt: row.created_at },
      forbidden: false,
      error: null,
    };
  }

  const local = loadLocalProjects().find((project) => project.id === id);
  if (!local) return { item: null, dates: null, forbidden: false, error: "Засах төсөл олдсонгүй." };
  return {
    item: local,
    dates: { publishedAt: local.status === "published" ? local.createdAt : null, createdAt: local.createdAt },
    forbidden: false,
    error: null,
  };
}

/* ------------------------------------ create / update ---------------------------------- */

export type SaveProjectResult = { id: string | null; error: string | null };

export async function saveProject(options: {
  editingId: string | null;
  draft: ProjectDraft;
  status: ContentStatus;
  dates: EditingDates;
  author: EditorAuthor;
}): Promise<SaveProjectResult> {
  const { editingId, draft, status, dates, author } = options;
  /** "private" never actually goes public, whichever button was clicked — see the Settings
   * modal's visibility note. */
  const effectivePublished = status === "published" && draft.visibility !== "private";

  if (supabase && author.id) {
    const payload = {
      title: draft.title, role: draft.role, category: draft.category, cover_url: draft.coverUrl,
      description: draft.summary, is_published: effectivePublished,
      /** Re-saving an already published project keeps its original publish date, so fixing a
       * typo does not push the piece back to the top of "recently published". */
      published_at: effectivePublished ? (dates?.publishedAt ?? new Date().toISOString()) : null,
      body_blocks: draft.blocks,
      custom_button_label: draft.buttonLabel || null, custom_button_url: draft.buttonUrl || null,
      tags: draft.tags, visibility: draft.visibility, is_mature: draft.isMature,
      comments_disabled: draft.commentsDisabled, license: draft.license,
    };
    const { data, error } = editingId && isRemoteProject(editingId)
      ? await supabase.from("projects").update(payload).eq("id", editingId).eq("owner_id", author.id).select("id").single()
      : await supabase.from("projects").insert({ ...payload, owner_id: author.id }).select("id").single();
    if (error || !data) return { id: null, error: error?.message ?? "Хадгалахад алдаа гарлаа." };
    return { id: data.id as string, error: null };
  }

  const localItem: ContentItem = {
    id: editingId ?? `local-${Date.now()}`, ownerId: author.id ?? "local", title: draft.title,
    creator: author.name, role: draft.role, category: draft.category, summary: draft.summary,
    coverUrl: draft.coverUrl, likes: 0, views: 0, saved: false, liked: false,
    status: effectivePublished ? "published" : "draft",
    createdAt: dates?.createdAt ?? new Date().toISOString(), blocks: draft.blocks,
    customButtonLabel: draft.buttonLabel || undefined, customButtonUrl: draft.buttonUrl || undefined,
    tags: draft.tags, visibility: draft.visibility, isMature: draft.isMature,
    commentsDisabled: draft.commentsDisabled, license: draft.license,
  };
  if (editingId) updateLocalProject(editingId, localItem); else addLocalProject(localItem);
  return { id: localItem.id, error: null };
}

/* ---------------------------------------- delete --------------------------------------- */

/** Returns an error message, or null on success. Postgres RLS is the real guard on the remote
 * path; the local path can only touch demo drafts, never the read-only seed gallery. */
export async function deleteProject(id: string): Promise<string | null> {
  if (isRemoteProject(id)) {
    const { error } = await supabase!.from("projects").delete().eq("id", id);
    return error?.message ?? null;
  }
  return removeLocalProject(id) ? null : "Энэ бүтээлийг устгах боломжгүй.";
}
