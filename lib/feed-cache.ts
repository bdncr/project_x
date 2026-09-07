import type { Creator } from "./creator-samples";
import type { ContentItem } from "./project-samples";

export type FeedDataMode = "backend" | "demo";

/** Whose view of the feed this is. Signed out is its own key, not a missing one. */
export type ViewerKey = string;

export function viewerKey(userId: string | null | undefined): ViewerKey {
  return userId ?? "anon";
}

type CachedFeed<T> = { items: T[]; dataMode: FeedDataMode; viewer: ViewerKey } | null;

/**
 * What the explore and people feeds last rendered, deliberately held outside React.
 *
 * Both routes render their own SiteHeader/Toolbar/feed instead of sharing a layout, so
 * moving between them unmounts the entire tree and takes component state with it. Without
 * this, the Төслүүд/Хүмүүс switch refetches from scratch every time — redisplaying the
 * skeleton grid and discarding whatever was typed in the search box — which reads as a full
 * page reload even though routing never leaves the client.
 *
 * Every entry is stamped with the viewer it was fetched for and only handed back to that same
 * viewer. A feed carries per-user state — which pieces you liked and saved, and your own
 * drafts and private projects, which RLS returns to you and to nobody else — so serving it to
 * whoever is signed in next would show one person another person's unpublished work for as
 * long as the refetch takes.
 *
 * A real browser reload drops the module, which is precisely when a refetch is wanted.
 */
const cache: {
  projects: CachedFeed<ContentItem>;
  creators: CachedFeed<Creator>;
  query: string;
} = { projects: null, creators: null, query: "" };

export function getCachedProjects(viewer: ViewerKey) {
  return cache.projects?.viewer === viewer ? cache.projects : null;
}
export function setCachedProjects(items: ContentItem[], dataMode: FeedDataMode, viewer: ViewerKey) {
  cache.projects = { items, dataMode, viewer };
}

export function getCachedCreators(viewer: ViewerKey) {
  return cache.creators?.viewer === viewer ? cache.creators : null;
}
export function setCachedCreators(items: Creator[], dataMode: FeedDataMode, viewer: ViewerKey) {
  cache.creators = { items, dataMode, viewer };
}

/** Shared by both feeds so switching between them keeps whatever is in the search box. A
 * search term is the viewer's own typing, not fetched data, so it is not viewer-scoped. */
export function getSharedQuery() { return cache.query; }
export function setSharedQuery(value: string) { cache.query = value; }

/** Drops everything on sign-out, so nothing survives even until the next fetch resolves. */
export function clearFeedCache() {
  cache.projects = null;
  cache.creators = null;
}
