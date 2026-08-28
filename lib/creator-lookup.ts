import { supabase } from "./supabase";
import { CREATOR_DIRECTORY, Creator, ProfileDirectoryRow, mapProfileRow } from "./creator-samples";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolves the creator behind a project into the same `Creator` shape the People cards and the
 * profile page use, so a hover card can show real stats rather than just the name the project
 * row carries.
 *
 * Two lookups because projects arrive from two places: a backend row knows its owner's uuid and
 * the `profile_directory` view already has the aggregated counts, while a seed project is
 * stamped "seed" and can only be matched back to the demo directory by display name (the same
 * fallback components/home/ContentCard.tsx uses for its profile links).
 */
export async function fetchCreatorSummary(ownerId: string, name: string): Promise<Creator | null> {
  if (supabase && UUID_RE.test(ownerId)) {
    const { data, error } = await supabase.from("profile_directory").select("*").eq("id", ownerId).maybeSingle();
    if (!error && data) return mapProfileRow(data as unknown as ProfileDirectoryRow);
  }
  return CREATOR_DIRECTORY.find((creator) => creator.name === name) ?? null;
}
