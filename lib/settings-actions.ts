import { supabase } from "./supabase";

/** Every settings save reports back the same way, so each panel can stay presentational. */
export type SettingsResult = {
  ok: boolean;
  message: string;
};

export type ProfileSettingsInput = {
  userId: string;
  username: string;
  displayName: string;
  headline: string;
  location: string;
  employmentTags: string[];
  avatarUrl: string;
  coverUrl: string;
  /** "Онцлох" is awarded by the platform (top-follower creator), never self-assigned —
   * carried through a save so editing the other pills can't quietly drop it. */
  featured: boolean;
};

const NO_BACKEND: SettingsResult = { ok: false, message: "Backend тохируулаагүй тул хадгалах боломжгүй." };

export async function saveProfileSettings(input: ProfileSettingsInput): Promise<SettingsResult> {
  if (!supabase) return NO_BACKEND;

  const username = input.username.trim();
  const displayName = input.displayName.trim();
  if (!username) return { ok: false, message: "Хэрэглэгчийн нэр хоосон байж болохгүй." };
  if (!displayName) return { ok: false, message: "Харагдах нэр хоосон байж болохгүй." };

  const { error } = await supabase.from("profiles").update({
    username,
    display_name: displayName,
    headline: input.headline.trim() || null,
    location: input.location.trim() || "Улаанбаатар",
    employment_tags: [...(input.featured ? ["Онцлох"] : []), ...input.employmentTags],
    avatar_url: input.avatarUrl.trim() || null,
    cover_url: input.coverUrl.trim() || null,
  }).eq("id", input.userId);

  // profiles.username carries a unique index, so a taken handle surfaces as 23505 here
  // rather than as a validation error we could have caught above.
  if (error) {
    if (error.code === "23505") return { ok: false, message: "Энэ хэрэглэгчийн нэр аль хэдийн эзэмшигдсэн байна." };
    return { ok: false, message: error.message };
  }
  return { ok: true, message: "Профайл шинэчлэгдлээ." };
}

export async function changePassword(next: string, confirm: string): Promise<SettingsResult> {
  if (!supabase) return NO_BACKEND;
  if (next.length < 6) return { ok: false, message: "Нууц үг дор хаяж 6 тэмдэгт байх ёстой." };
  if (next !== confirm) return { ok: false, message: "Хоёр нууц үг таарахгүй байна." };
  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Нууц үг шинэчлэгдлээ." };
}

export async function changeEmail(next: string): Promise<SettingsResult> {
  if (!supabase) return NO_BACKEND;
  const email = next.trim();
  if (!email) return { ok: false, message: "Имэйл хоосон байж болохгүй." };
  const { error } = await supabase.auth.updateUser({ email });
  if (error) return { ok: false, message: error.message };
  // Supabase only swaps the address once the link in the new inbox is opened — and, when
  // "Secure email change" is on, the old inbox too. Nothing has changed yet at this point.
  return { ok: true, message: "Шинэ хаяг руу баталгаажуулах холбоос илгээлээ." };
}

/** Ends every session for this account, not just this browser's. */
export async function signOutEverywhere(): Promise<SettingsResult> {
  if (!supabase) return NO_BACKEND;
  const { error } = await supabase.auth.signOut({ scope: "global" });
  if (error) return { ok: false, message: error.message };
  return { ok: true, message: "Бүх төхөөрөмжөөс гарлаа." };
}
