import { supabase } from "./supabase";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Following is a row against a real profile. Seed creators are stamped "seed" and demo
 * drafts "local", so on those the button is a local nicety and nothing is written. */
export function canFollow(profileId: string, userId: string | null): boolean {
  return !!supabase && !!userId && UUID_RE.test(profileId) && profileId !== userId;
}

export async function fetchIsFollowing(profileId: string, userId: string | null): Promise<boolean> {
  if (!canFollow(profileId, userId)) return false;
  const { data } = await supabase!
    .from("profile_follows")
    .select("follower_id")
    .eq("follower_id", userId!)
    .eq("followee_id", profileId)
    .maybeSingle();
  return !!data;
}

/** Returns an error message, or null on success. The caller applies the change optimistically
 * and rolls back on a message, the way the People grid already does. */
export async function setFollowing(profileId: string, userId: string | null, next: boolean): Promise<string | null> {
  if (!canFollow(profileId, userId)) return null;
  const request = next
    ? supabase!.from("profile_follows").insert({ follower_id: userId!, followee_id: profileId })
    : supabase!.from("profile_follows").delete().eq("follower_id", userId!).eq("followee_id", profileId);
  const { error } = await request;
  return error?.message ?? null;
}
