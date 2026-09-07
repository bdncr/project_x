"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../../components/SiteHeader";
import { SiteFooter } from "../../components/SiteFooter";
import { AuthDialog, AuthMode } from "../../components/auth/AuthDialog";
import { Toast } from "../../components/Toast";
import { Toolbar } from "../../components/toolbar/Toolbar";
import { HireBanner } from "../../components/people/HireBanner";
import { CreatorGrid } from "../../components/people/CreatorGrid";
import { supabase } from "../../lib/supabase";
import { runAuthSubmit } from "../../lib/auth-actions";
import { useAuth } from "../../lib/AuthProvider";
import { Creator, CREATOR_DIRECTORY, ProfileDirectoryRow, mapProfileRow } from "../../lib/creator-samples";
import { getCachedCreators, getSharedQuery, setCachedCreators, setSharedQuery, viewerKey } from "../../lib/feed-cache";

type PeopleSortMode = "recommended" | "followers" | "appreciated" | "viewed";

const SORT_OPTIONS: [PeopleSortMode, string][] = [
  ["recommended", "Санал болгох"],
  ["followers", "Хамгийн олон дагагчтай"],
  ["appreciated", "Хамгийн их талархсан"],
  ["viewed", "Хамгийн их үзсэн"],
];

export default function PeoplePage() {
  const { user, authReady } = useAuth();
  const viewer = viewerKey(user?.id);
  // Seeded from the cache so returning from Төслүүд paints the last grid immediately
  // instead of dropping back to skeletons while the same rows are fetched again.
  const [creators, setCreators] = useState<Creator[]>(() => getCachedCreators(viewer)?.items ?? []);
  const [loading, setLoading] = useState(() => !getCachedCreators(viewer));
  const [dataMode, setDataMode] = useState<"backend" | "demo">(() => getCachedCreators(viewer)?.dataMode ?? "demo");
  const [query, setQuery] = useState(getSharedQuery);
  const [sortMode, setSortMode] = useState<PeopleSortMode>("recommended");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  /** Display-only +1/-1 per creator id from following/unfollowing — kept out of the
   * sortable `creators` state so it never reshuffles the grid (see visibleCreators). */
  const [followerDeltas, setFollowerDeltas] = useState<Record<string, number>>({});
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };
  const requireUser = () => {
    if (dataMode === "demo" || !supabase) return true;
    if (user) return true;
    setAuthOpen(true); notify("Энэ үйлдэлд эхлээд нэвтэрнэ үү."); return false;
  };

  useEffect(() => {
    if (!authReady) return;

    async function load() {
      if (!supabase) {
        setCreators(CREATOR_DIRECTORY);
        setDataMode("demo");
        setCachedCreators(CREATOR_DIRECTORY, "demo", viewer);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase.from("profile_directory").select("*").order("followers", { ascending: false });
      if (error || !data || data.length === 0) {
        setCreators(CREATOR_DIRECTORY);
        setDataMode("demo");
        setCachedCreators(CREATOR_DIRECTORY, "demo", viewer);
        setLoading(false);
        return;
      }
      const nextCreators = (data as ProfileDirectoryRow[]).map(mapProfileRow);
      setCreators(nextCreators);
      setDataMode("backend");
      setCachedCreators(nextCreators, "backend", viewer);
      if (user) {
        const { data: follows } = await supabase.from("profile_follows").select("followee_id").eq("follower_id", user.id);
        setFollowedIds((follows ?? []).map((row) => row.followee_id));
      } else {
        setFollowedIds([]);
      }
      setLoading(false);
    }

    void load();
  }, [authReady, user]);

  const visibleCreators = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    return [...creators]
      .filter((creator) => !term || `${creator.name} ${creator.role} ${creator.location} ${creator.category}`.toLocaleLowerCase().includes(term))
      // Sorted purely by the selected filter, against each creator's stable base
      // count — never re-ordered as a side effect of following someone (see the
      // display-only +1/-1 overlay applied in CreatorGrid below).
      .sort((a, b) => sortMode === "followers" ? b.followers - a.followers : sortMode === "appreciated" ? b.appreciations - a.appreciations : sortMode === "viewed" ? b.projectViews - a.projectViews : (b.followers + b.appreciations / 4) - (a.followers + a.appreciations / 4));
  }, [creators, query, sortMode]);

  const featured = useMemo(() => creators.find((creator) => creator.tags.includes("Онцлох")) ?? creators[0], [creators]);

  const toggleFollow = async (creator: Creator) => {
    if (!requireUser()) return;
    const wasFollowing = followedIds.includes(creator.id);
    setFollowedIds((all) => wasFollowing ? all.filter((id) => id !== creator.id) : [...all, creator.id]);
    setFollowerDeltas((all) => ({ ...all, [creator.id]: (all[creator.id] ?? 0) + (wasFollowing ? -1 : 1) }));
    if (dataMode === "demo" || !supabase || !user) { notify(wasFollowing ? `${creator.name}-г дагахаа больлоо.` : `${creator.name}-г дагаж эхэллээ.`); return; }
    const request = wasFollowing
      ? supabase.from("profile_follows").delete().eq("follower_id", user.id).eq("followee_id", creator.id)
      : supabase.from("profile_follows").insert({ follower_id: user.id, followee_id: creator.id });
    const { error } = await request;
    if (error) {
      setFollowedIds((all) => wasFollowing ? [...all, creator.id] : all.filter((id) => id !== creator.id));
      setFollowerDeltas((all) => ({ ...all, [creator.id]: (all[creator.id] ?? 0) + (wasFollowing ? 1 : -1) }));
      notify(error.message);
      return;
    }
    notify(wasFollowing ? `${creator.name}-г дагахаа больлоо.` : `${creator.name}-г дагаж эхэллээ.`);
  };

  const messageCreator = (creator: Creator) => {
    if (!requireUser()) return;
    notify(`${creator.name}-д зурвас бичих боломж тун удахгүй нэмэгдэнэ.`);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true);
    const result = await runAuthSubmit({ mode: authMode, email: authEmail, password: authPassword, displayName });
    setAuthBusy(false); notify(result.message);
    if (result.close) { setAuthOpen(false); setAuthPassword(""); }
  };

  return <main>
    <SiteHeader activePage="people" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />
    <section id="people" className="explore-section people-section">
      <Toolbar<PeopleSortMode>
        activeKind="people"
        query={query} onQueryChange={(value) => { setQuery(value); setSharedQuery(value); }} searchPlaceholder="Нэр, ур чадвараар хайх..."
        sortMode={sortMode} onSortModeChange={(value) => { setSortMode(value); setSortMenuOpen(false); }}
        sortMenuOpen={sortMenuOpen} onToggleSortMenu={() => setSortMenuOpen((open) => !open)}
        sortOptions={SORT_OPTIONS}
      />
      <HireBanner featured={featured} />
      <CreatorGrid loading={loading} creators={visibleCreators} followedIds={followedIds} followerDeltas={followerDeltas} onToggleFollow={(creator) => void toggleFollow(creator)} onMessage={messageCreator} />
    </section>
    <SiteFooter backendConnected={!!supabase} />
    {authOpen && <AuthDialog
      mode={authMode} onModeChange={setAuthMode}
      name={displayName} onNameChange={setDisplayName}
      email={authEmail} onEmailChange={setAuthEmail}
      password={authPassword} onPasswordChange={setAuthPassword}
      busy={authBusy} onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
    />}
    <Toast message={toast} />
  </main>;
}
