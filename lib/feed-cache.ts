import type { Creator } from "./creator-samples";
import type { ContentItem } from "./project-samples";

export type FeedDataMode = "backend" | "demo";

type CachedFeed<T> = { items: T[]; dataMode: FeedDataMode } | null;

/**
 * What the explore and people feeds last rendered, deliberately held outside React.
 *
 * Both routes render their own SiteHeader/Toolbar/feed instead of sharing a layout, so
 * moving between them unmounts the entire tree and takes component state with it. Without
 * this, the Төслүүд/Хүмүүс switch refetches from scratch every time — redisplaying the
 * skeleton grid and discarding whatever was typed in the search box — which reads as a full
 * page reload even though routing never leaves the client.
 *
 * A real browser reload drops the module, which is precisely when a refetch is wanted.
 */
const cache: {
  projects: CachedFeed<ContentItem>;
  creators: CachedFeed<Creator>;
  query: string;
} = { projects: null, creators: null, query: "" };

export function getCachedProjects() { return cache.projects; }
export function setCachedProjects(items: ContentItem[], dataMode: FeedDataMode) { cache.projects = { items, dataMode }; }

export function getCachedCreators() { return cache.creators; }
export function setCachedCreators(items: Creator[], dataMode: FeedDataMode) { cache.creators = { items, dataMode }; }

/** Shared by both feeds so switching between them keeps whatever is in the search box. */
export function getSharedQuery() { return cache.query; }
export function setSharedQuery(value: string) { cache.query = value; }
