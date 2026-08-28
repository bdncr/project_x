import { supabase } from "./supabase";

export type ProjectComment = {
  id: string;
  projectId: string;
  /** The auth id of whoever wrote it, or "local" for a demo-mode comment. */
  authorId: string;
  author: string;
  text: string;
  createdAt: string;
};

export const MAX_COMMENT_LENGTH = 1000;

const LOCAL_COMMENTS_KEY = "project-x-project-comments";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type CommentRow = {
  id: string;
  project_id: string;
  author_id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string } | { display_name: string }[] | null;
};

/** True when the thread lives in Postgres. Seed and locally-created projects have non-uuid
 * ids that no `project_comments.project_id` foreign key could ever point at, so those
 * threads stay in localStorage even when a backend is configured. */
export function commentsAreRemote(projectId: string): boolean {
  return !!supabase && UUID_RE.test(projectId);
}

function mapRow(row: CommentRow): ProjectComment {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  return {
    id: row.id,
    projectId: row.project_id,
    authorId: row.author_id,
    author: profile?.display_name || "Зочин",
    text: row.body,
    createdAt: row.created_at,
  };
}

/* ---------- demo-mode persistence (mirrors loadLocalProjects in lib/project-samples) ---------- */

function readLocal(): ProjectComment[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(LOCAL_COMMENTS_KEY) || "[]");
    return Array.isArray(value) ? (value as ProjectComment[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(all: ProjectComment[]) {
  window.localStorage.setItem(LOCAL_COMMENTS_KEY, JSON.stringify(all));
}

/* ---------- the API the project page uses; each call picks its own storage ---------- */

export async function fetchComments(projectId: string): Promise<{ comments: ProjectComment[]; error: string | null }> {
  if (!commentsAreRemote(projectId)) {
    return { comments: readLocal().filter((comment) => comment.projectId === projectId), error: null };
  }
  const { data, error } = await supabase!
    .from("project_comments")
    .select("id,project_id,author_id,body,created_at,profiles!project_comments_author_id_fkey(display_name)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) return { comments: [], error: error.message };
  return { comments: ((data ?? []) as unknown as CommentRow[]).map(mapRow), error: null };
}

export async function createComment(projectId: string, text: string, author: { id: string | null; name: string }): Promise<{ comment: ProjectComment | null; error: string | null }> {
  const body = text.trim().slice(0, MAX_COMMENT_LENGTH);
  if (!body) return { comment: null, error: "Сэтгэгдэл хоосон байна." };

  if (!commentsAreRemote(projectId) || !author.id) {
    const comment: ProjectComment = {
      id: `local-${Date.now()}`, projectId, authorId: author.id ?? "local",
      author: author.name, text: body, createdAt: new Date().toISOString(),
    };
    writeLocal([comment, ...readLocal()]);
    return { comment, error: null };
  }

  const { data, error } = await supabase!
    .from("project_comments")
    .insert({ project_id: projectId, author_id: author.id, body })
    .select("id,project_id,author_id,body,created_at,profiles!project_comments_author_id_fkey(display_name)")
    .single();
  if (error || !data) return { comment: null, error: error?.message ?? "Сэтгэгдэл нэмэхэд алдаа гарлаа." };
  return { comment: mapRow(data as unknown as CommentRow), error: null };
}

export async function deleteComment(comment: ProjectComment): Promise<string | null> {
  if (!commentsAreRemote(comment.projectId) || comment.id.startsWith("local-")) {
    writeLocal(readLocal().filter((existing) => existing.id !== comment.id));
    return null;
  }
  const { error } = await supabase!.from("project_comments").delete().eq("id", comment.id);
  return error?.message ?? null;
}
