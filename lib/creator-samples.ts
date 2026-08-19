import { ContentItem, SAMPLE_PROJECTS, projectGallery } from "./project-samples";

export type Creator = {
  id: string;
  name: string;
  role: string;
  category: string;
  location: string;
  isPro: boolean;
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

/** Fills a 4-thumbnail strip from the creator's own project covers, padding with
 * differently-cropped variants of their first cover when they have fewer than 4 projects. */
function creatorThumbnails(projects: ContentItem[]): string[] {
  const covers = projects.map((project) => project.coverUrl);
  if (covers.length >= 4) return covers.slice(0, 4);
  const extra = projectGallery(projects[0].coverUrl);
  return [...covers, ...extra].slice(0, 4);
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
};

export function mapProfileRow(row: ProfileDirectoryRow): Creator {
  return {
    id: row.id,
    name: row.display_name,
    role: row.headline || "Бүтээлч",
    category: "",
    location: row.location || "Улаанбаатар",
    isPro: row.is_pro,
    tags: row.employment_tags ?? [],
    appreciations: row.appreciations,
    followers: row.followers,
    projectViews: row.project_views,
    projectCount: row.project_count,
    thumbnails: [],
    coverUrl: row.cover_url ?? undefined,
  };
}
