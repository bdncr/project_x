"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { AuthDialog, AuthMode } from "../../../components/AuthDialog";
import { Toast } from "../../../components/Toast";
import { Icon } from "../../../components/Icon";
import { ProfileCover } from "../../../components/profile/ProfileCover";
import { ProfileSidebar } from "../../../components/profile/ProfileSidebar";
import { ProfileTabs, ProfileTab } from "../../../components/profile/ProfileTabs";
import { ProfileWorkGrid } from "../../../components/profile/ProfileWorkGrid";
import { ProfileServices } from "../../../components/profile/ProfileServices";
import { EditProfileDialog } from "../../../components/profile/EditProfileDialog";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthProvider";
import { Creator, CREATOR_DIRECTORY, mapProfileRow } from "../../../lib/creator-samples";
import { ProfileWork, ProjectRow, demoWorksForCreator, mapProjectRow } from "../../../lib/profile-work";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROJECT_COLUMNS = "id,title,role,category,cover_url,view_count,project_likes(count)";

/** Re-orders projects fetched via `.in("id", ids)` (which doesn't preserve input
 * order) back to the order the ids were given in — newest-liked/saved first. */
function sortByIdOrder(works: ProfileWork[], order: string[]): ProfileWork[] {
  return [...works].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

export default function ProfilePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(params?.id ?? "");
  const { user, authReady } = useAuth();

  const [creator, setCreator] = useState<Creator | null>(null);
  const [works, setWorks] = useState<ProfileWork[]>([]);
  const [appreciatedWorks, setAppreciatedWorks] = useState<ProfileWork[]>([]);
  const [savedWorks, setSavedWorks] = useState<ProfileWork[]>([]);
  const [joinedAt, setJoinedAt] = useState<string | undefined>();
  const [dataMode, setDataMode] = useState<"backend" | "demo">("demo");
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tab, setTab] = useState<ProfileTab>("work");
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editHeadline, setEditHeadline] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editBusy, setEditBusy] = useState(false);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };
  const requireUser = () => {
    if (dataMode === "demo" || !supabase) return true;
    if (user) return true;
    setAuthOpen(true); notify("Энэ үйлдэлд эхлээд нэвтэрнэ үү."); return false;
  };

  useEffect(() => {
    if (!authReady || !id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      const demoCreator = CREATOR_DIRECTORY.find((item) => item.id === id) ?? null;

      const useDemo = () => {
        if (cancelled) return;
        if (!demoCreator) { setNotFound(true); setLoading(false); return; }
        setCreator(demoCreator);
        setWorks(demoWorksForCreator(demoCreator.name));
        setAppreciatedWorks([]);
        setSavedWorks([]);
        setDataMode("demo");
        setLoading(false);
      };

      if (!supabase || !UUID_RE.test(id)) { useDemo(); return; }

      const { data, error } = await supabase.from("profile_directory").select("*").eq("id", id).maybeSingle();
      if (cancelled) return;
      if (error || !data) { useDemo(); return; }

      setCreator(mapProfileRow(data));
      setDataMode("backend");
      setNotFound(false);

      const viewerIsOwner = !!user && user.id === id;

      const [projectsResult, profileResult, likesResult, savesResult] = await Promise.all([
        supabase.from("projects").select(PROJECT_COLUMNS).eq("owner_id", id).eq("is_published", true).order("published_at", { ascending: false }),
        supabase.from("profiles").select("created_at").eq("id", id).maybeSingle(),
        supabase.from("project_likes").select("project_id").eq("user_id", id).order("created_at", { ascending: false }),
        viewerIsOwner
          ? supabase.from("project_saves").select("project_id").eq("user_id", id).order("created_at", { ascending: false })
          : Promise.resolve({ data: [] as { project_id: string }[] }),
      ]);
      if (cancelled) return;

      setWorks(((projectsResult.data ?? []) as ProjectRow[]).map(mapProjectRow));
      setJoinedAt((profileResult.data as { created_at?: string } | null)?.created_at);

      const likedIds = (likesResult.data ?? []).map((row) => row.project_id);
      if (likedIds.length === 0) {
        setAppreciatedWorks([]);
      } else {
        const { data: likedProjects } = await supabase.from("projects").select(PROJECT_COLUMNS).in("id", likedIds).eq("is_published", true);
        if (cancelled) return;
        setAppreciatedWorks(sortByIdOrder(((likedProjects ?? []) as ProjectRow[]).map(mapProjectRow), likedIds));
      }

      const savedIds = (savesResult.data ?? []).map((row) => row.project_id);
      if (savedIds.length === 0) {
        setSavedWorks([]);
      } else {
        const { data: savedProjects } = await supabase.from("projects").select(PROJECT_COLUMNS).in("id", savedIds).eq("is_published", true);
        if (cancelled) return;
        setSavedWorks(sortByIdOrder(((savedProjects ?? []) as ProjectRow[]).map(mapProjectRow), savedIds));
      }

      if (user) {
        const { data: follow } = await supabase.from("profile_follows").select("follower_id").eq("follower_id", user.id).eq("followee_id", id).maybeSingle();
        if (!cancelled) setFollowing(!!follow);
      } else {
        setFollowing(false);
      }
      setLoading(false);
    }

    void load();
    return () => { cancelled = true; };
  }, [authReady, id, user]);

  const isSelf = !!user && !!creator && dataMode === "backend" && user.id === creator.id;

  const toggleFollow = async () => {
    if (!creator || isSelf) return;
    if (!requireUser()) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    if (dataMode === "demo" || !supabase || !user) { notify(wasFollowing ? `${creator.name}-г дагахаа больлоо.` : `${creator.name}-г дагаж эхэллээ.`); return; }
    const request = wasFollowing
      ? supabase.from("profile_follows").delete().eq("follower_id", user.id).eq("followee_id", creator.id)
      : supabase.from("profile_follows").insert({ follower_id: user.id, followee_id: creator.id });
    const { error } = await request;
    if (error) { setFollowing(wasFollowing); notify(error.message); return; }
    notify(wasFollowing ? `${creator.name}-г дагахаа больлоо.` : `${creator.name}-г дагаж эхэллээ.`);
  };

  const messageCreator = () => {
    if (!creator || isSelf) return;
    if (!requireUser()) return;
    notify(`${creator.name}-д зурвас бичих боломж тун удахгүй нэмэгдэнэ.`);
  };

  const openEditProfile = () => {
    if (!creator) return;
    setEditHeadline(creator.role === "Бүтээлч" ? "" : creator.role);
    setEditLocation(creator.location);
    setEditTags(creator.tags.filter((tag) => tag !== "Онцлох"));
    setEditOpen(true);
  };
  const toggleEditTag = (tag: string) => setEditTags((tags) => tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]);

  const submitEditProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase || !user || !creator) return;
    setEditBusy(true);
    const nextTags = [...(creator.tags.includes("Онцлох") ? ["Онцлох"] : []), ...editTags];
    const nextLocation = editLocation.trim() || "Улаанбаатар";
    const { error } = await supabase.from("profiles").update({ headline: editHeadline.trim() || null, location: nextLocation, employment_tags: nextTags }).eq("id", user.id);
    setEditBusy(false);
    if (error) { notify(error.message); return; }
    setCreator({ ...creator, role: editHeadline.trim() || "Бүтээлч", location: nextLocation, tags: nextTags });
    notify("Профайл шинэчлэгдлээ.");
    setEditOpen(false);
  };

  const addCoverSoon = () => notify("Ковер зураг оруулах боломж тун удахгүй нэмэгдэнэ.");

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!supabase) return; setAuthBusy(true);
    const response = authMode === "signin" ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }) : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: displayName.trim() } } });
    setAuthBusy(false); if (response.error) return notify(response.error.message);
    if (authMode === "signup" && !response.data.session) notify("Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү."); else notify(authMode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.");
    setAuthOpen(false); setAuthPassword("");
  };

  if (!loading && notFound) return <main className="profile-page">
    <SiteHeader activePage="people" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />
    <div className="case-empty">
      <Icon name="user" />
      <h1>Хэрэглэгч олдсонгүй</h1>
      <p>Энэ профайл байхгүй эсвэл устгагдсан байна.</p>
      <Link href="/people" className="hero-button">Хүмүүс лүү буцах</Link>
    </div>
    <SiteFooter backendConnected={!!supabase} />
  </main>;

  if (loading || !creator) return <main className="profile-page">
    <SiteHeader activePage="people" onLogin={() => setAuthOpen(true)} />
    <div className="case-skeleton">
      <span className="skeleton case-skeleton-cover" aria-hidden="true" />
      <div className="case-skeleton-body">
        <span className="skeleton skeleton-line" style={{ width: "40%", height: 22 }} />
        <span className="skeleton skeleton-line" style={{ width: "25%", height: 14, marginTop: 10 }} />
        <span className="skeleton skeleton-line" style={{ width: "60%", height: 14, marginTop: 20 }} />
      </div>
    </div>
  </main>;

  return <main className="profile-page">
    <SiteHeader activePage="people" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />
    <ProfileCover coverUrl={creator.coverUrl ?? works[0]?.coverUrl} isSelf={isSelf} onAddCover={addCoverSoon} />
    <div className="profile-layout">
      <ProfileSidebar creator={creator} isSelf={isSelf} following={following} joinedAt={joinedAt} onToggleFollow={() => void toggleFollow()} onMessage={messageCreator} onEditProfile={openEditProfile} />
      <section className="profile-main">
        <ProfileTabs active={tab} onChange={setTab} showSaved={isSelf} />
        {tab === "work" && <ProfileWorkGrid works={works} emptyTitle="Төсөл алга байна" emptyText={`${creator.name} одоогоор нийтэлсэн бүтээл алга байна.`} />}
        {tab === "services" && <ProfileServices creator={creator} onMessage={messageCreator} />}
        {tab === "appreciated" && <ProfileWorkGrid works={appreciatedWorks} emptyTitle="Талархсан төсөл алга байна" emptyText={`${creator.name} одоогоор ямар ч төсөлд талархал илэрхийлээгүй байна.`} />}
        {tab === "saved" && <ProfileWorkGrid works={savedWorks} emptyTitle="Хадгалсан төсөл алга байна" emptyText="Танд одоогоор хадгалсан төсөл алга байна." />}
      </section>
    </div>
    <SiteFooter backendConnected={!!supabase} />
    {authOpen && <AuthDialog
      mode={authMode} onModeChange={setAuthMode}
      name={displayName} onNameChange={setDisplayName}
      email={authEmail} onEmailChange={setAuthEmail}
      password={authPassword} onPasswordChange={setAuthPassword}
      busy={authBusy} onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
    />}
    {editOpen && <EditProfileDialog
      headline={editHeadline} onHeadlineChange={setEditHeadline}
      location={editLocation} onLocationChange={setEditLocation}
      employmentTags={editTags} onToggleTag={toggleEditTag}
      busy={editBusy} onClose={() => setEditOpen(false)} onSubmit={(event) => void submitEditProfile(event)}
    />}
    <Toast message={toast} />
  </main>;
}
