import { ContentItem, SAMPLE_PROJECTS } from "./project-samples";

/** A single portfolio entry shown in the profile page's work grid — a trimmed-down
 * view of a project that doesn't care whether it came from demo data or Supabase. */
export type ProfileWork = {
  id: string;
  title: string;
  role: string;
  category: string;
  coverUrl: string;
  likes: number;
  views: number;
};

function fromContentItem(item: ContentItem): ProfileWork {
  return { id: item.id, title: item.title, role: item.role, category: item.category, coverUrl: item.coverUrl, likes: item.likes, views: item.views };
}

/** Demo-mode work list: every seed project credited to this creator name. */
export function demoWorksForCreator(creatorName: string): ProfileWork[] {
  return SAMPLE_PROJECTS.filter((project) => project.creator === creatorName).map(fromContentItem);
}

/** Row shape of a live `projects` select scoped to one owner, used by the profile page. */
export type ProjectRow = {
  id: string;
  title: string;
  role: string;
  category: string;
  cover_url: string;
  view_count: number;
  project_likes: { count: number }[] | null;
};

export function mapProjectRow(row: ProjectRow): ProfileWork {
  return {
    id: row.id,
    title: row.title,
    role: row.role,
    category: row.category,
    coverUrl: row.cover_url,
    likes: row.project_likes?.[0]?.count ?? 0,
    views: row.view_count,
  };
}
