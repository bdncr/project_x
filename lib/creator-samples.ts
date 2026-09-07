import { ContentItem, SAMPLE_PROJECTS, projectGallery } from "./project-samples";

export type Creator = {
  id: string;
  name: string;
  role: string;
  category: string;
  location: string;
  isPro: boolean;
  /** Profile photo set in Тохиргоо; absent for the demo directory, which uses initials. */
  avatarUrl?: string;
  /** Status pills shown on the card, e.g. "Онцлох", "Freelance", "Бүтэн цаг". */
  tags: string[];
  appreciations: number;
  followers: number;
  projectViews: number;
  projectCount: number;
  /** Up to 4 preview images pulled from the creator's own published work. */
  thumbnails: string[];
  /** Profile page banner. Demo creators never set one — the profile page falls
   * back to their top project's cover instead (see app/profile/[id]/page.tsx). */
  coverUrl?: string;
};

const CITIES = ["Улаанбаатар", "Улаанбаатар", "Улаанбаатар", "Дархан-Уул", "Эрдэнэт", "Ховд", "Улаанбаатар", "Сүхбаатар"];
const EMPLOYMENT_TAGS = ["Freelance", "Бүтэн цаг", "Үйлчилгээ", ""];

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-zа-яөүёэ0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

/** Fills a 4-thumbnail strip from a creator's own project covers, padding with
 * differently-cropped variants of their first cover when they have fewer than 4 projects.
 * Shared by both data modes so a backend creator's card looks the same as a demo one —
 * most seed creators own 1-3 projects, which would otherwise leave grey gaps in the strip. */
function padThumbnails(covers: string[]): string[] {
  if (covers.length >= 4) return covers.slice(0, 4);
  if (covers.length === 0) return [];
  return [...covers, ...projectGallery(covers[0])].slice(0, 4);
}

function creatorThumbnails(projects: ContentItem[]): string[] {
  return padThumbnails(projects.map((project) => project.coverUrl));
}

type CreatorDraft = Omit<Creator, "tags"> & { employmentTag: string };

function buildCreatorDirectory(): Creator[] {
  const projectsByCreator = new Map<string, ContentItem[]>();
  for (const project of SAMPLE_PROJECTS) {
    const list = projectsByCreator.get(project.creator) ?? [];
    list.push(project);
    projectsByCreator.set(project.creator, list);
  }

  const drafts: CreatorDraft[] = [...projectsByCreator.entries()].map(([name, projects], index) => {
    const appreciations = projects.reduce((sum, project) => sum + project.likes, 0);
    const projectViews = projects.reduce((sum, project) => sum + project.views, 0);
    return {
      id: slugify(name) || `creator-${index}`,
      name,
      role: projects[0].role,
      category: projects[0].category,
      location: CITIES[index % CITIES.length],
      isPro: index % 3 === 0,
      employmentTag: EMPLOYMENT_TAGS[index % EMPLOYMENT_TAGS.length],
      appreciations,
      followers: Math.round(projectViews / 8),
      projectViews,
      projectCount: projects.length,
      thumbnails: creatorThumbnails(projects),
    };
  });

  const featuredId = drafts.reduce((best, creator) => (creator.followers > best.followers ? creator : best), drafts[0]).id;

  return drafts
    .map(({ employmentTag, ...creator }) => ({
      ...creator,
      tags: [creator.id === featuredId ? "Онцлох" : null, employmentTag || null].filter((tag): tag is string => !!tag),
    }))
    .sort((a, b) => b.followers - a.followers);
}

export const CREATOR_DIRECTORY: Creator[] = buildCreatorDirectory();

/** Status-pill label → CSS modifier class, shared by every place a creator's tags render
 * (people grid cards, profile sidebar) so the colour language stays in one place. */
export const TAG_CLASS: Record<string, string> = {
  "Онцлох": "featured",
  "Freelance": "freelance",
  "Бүтэн цаг": "fulltime",
  "Үйлчилгээ": "services",
};

/** Profile route id for a creator known only by name. Demo rows carry no owner id — the
 * feed stamps them "seed" — so a card has to map the name back to the directory entry the
 * profile page looks itself up by. Returns null when nobody matches, so the caller can
 * render the name unlinked rather than route to a dead profile. */
export function creatorProfileId(name: string): string | null {
  return CREATOR_DIRECTORY.find((creator) => creator.name === name)?.id ?? null;
}

/** Row shape of the `profile_directory` Supabase view — one row per profile with
 * published-project stats and follower count already aggregated. */
export type ProfileDirectoryRow = {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  headline: string | null;
  cover_url: string | null;
  location: string;
  employment_tags: string[];
  is_pro: boolean;
  project_count: number;
  project_views: number;
  appreciations: number;
  followers: number;
  /** Up to 4 covers from the creator's newest published work, aggregated by the view. */
  thumbnails: string[];
};

/** The status pills a creator can actually choose. "Онцлох" is deliberately absent:
 * the platform awards it to the top-follower creator, it is never self-assigned. Shared by
 * the profile edit dialog and the settings page so the two can't offer different lists. */
export const SELECTABLE_EMPLOYMENT_TAGS = Object.keys(TAG_CLASS).filter((tag) => tag !== "Онцлох");

export function mapProfileRow(row: ProfileDirectoryRow): Creator {
  return {
    id: row.id,
    name: row.display_name,
    role: row.headline || "Бүтээлч",
    category: "",
    location: row.location || "Улаанбаатар",
    isPro: row.is_pro,
    avatarUrl: row.avatar_url ?? undefined,
    tags: row.employment_tags ?? [],
    appreciations: row.appreciations,
    followers: row.followers,
    projectViews: row.project_views,
    projectCount: row.project_count,
    thumbnails: padThumbnails(row.thumbnails ?? []),
    coverUrl: row.cover_url ?? undefined,
  };
}
