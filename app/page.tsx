"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { SiteHeader } from "../components/SiteHeader";
import { SiteFooter } from "../components/SiteFooter";
import { AuthDialog, AuthMode } from "../components/auth/AuthDialog";
import { Toast } from "../components/Toast";
import { Toolbar } from "../components/toolbar/Toolbar";
import { HeroSection } from "../components/home/HeroSection";
import { StatsRow } from "../components/home/StatsRow";
import { CategoryRail } from "../components/home/CategoryRail";
import { ContentGrid } from "../components/home/ContentGrid";
import { ShareWorkForm, ContentForm } from "../components/home/ShareWorkForm";
import { ManageWork } from "../components/home/ManageWork";
import { supabase } from "../lib/supabase";
import { getCachedProjects, getSharedQuery, setCachedProjects, setSharedQuery, viewerKey } from "../lib/feed-cache";
import { deleteProject, saveProject } from "../lib/project-crud";
import { LICENSE_OPTIONS } from "../lib/project-editor";
import { runAuthSubmit } from "../lib/auth-actions";
import { useAuth } from "../lib/AuthProvider";
import { ContentItem, loadDemoProjects } from "../lib/project-samples";

type ProjectRow = { id: string; owner_id: string | null; title: string; role: string; description: string; category: string; cover_url: string; view_count: number; is_published: boolean; published_at: string | null; created_at: string; visibility: "everyone" | "private" | null; profiles: { display_name: string; headline: string | null } | { display_name: string; headline: string | null }[] | null; project_likes: { count: number }[] | null };
type SortMode = "recommended" | "recent" | "liked" | "viewed";

const SORT_OPTIONS: [SortMode, string][] = [
  ["recommended", "Санал болгох"],
  ["recent", "Хамгийн сүүлийн"],
  ["liked", "Хамгийн их таалагдсан"],
  ["viewed", "Хамгийн их үзсэн"],
];

const categories = ["Бүгд", "Брэнд", "График", "Гэрэл зураг", "Зураглал", "UX/UI", "3D", "Motion"];
const categoryArtwork: Record<string, string> = {
  "Бүгд": "https://images.unsplash.com/photo-1558655146-9f40138edfeb?auto=format&fit=crop&w=500&q=80",
  "Брэнд": "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=500&q=80",
  "График": "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?auto=format&fit=crop&w=500&q=80",
  "Гэрэл зураг": "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=500&q=80",
  "Зураглал": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?auto=format&fit=crop&w=500&q=80",
  "UX/UI": "https://images.unsplash.com/photo-1551650975-87deedd944c3?auto=format&fit=crop&w=500&q=80",
  "3D": "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=500&q=80",
  "Motion": "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&w=500&q=80",
};
const emptyForm: ContentForm = { title: "", role: "", category: "Брэнд", summary: "", coverUrl: "", status: "published" };
const defaultCover = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=88";

export default function Home() {
  const router = useRouter();
  const { user, authReady } = useAuth();
  /* Whose feed the cache may be replayed to. AuthProvider lives in the layout and survives
     client-side navigation, so on the Төслүүд/Хүмүүс switch this is already the real id; on a
     hard reload it is "anon" and the module cache is empty anyway. */
  const viewer = viewerKey(user?.id);
  // Seeded from the cache so returning from Хүмүүс paints the last feed immediately
  // instead of dropping back to skeletons while the same rows are fetched again.
  const [items, setItems] = useState<ContentItem[]>(() => getCachedProjects(viewer)?.items ?? []);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [query, setQuery] = useState(getSharedQuery);
  const [activeCategory, setActiveCategory] = useState("Бүгд");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(() => !getCachedProjects(viewer));
  const [dataMode, setDataMode] = useState<"backend" | "demo">(() => getCachedProjects(viewer)?.dataMode ?? "demo");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };
  const requireUser = () => {
    if (dataMode === "demo" || !supabase) return true;
    if (user) return true;
    setAuthOpen(true); notify("Энэ үйлдэлд эхлээд нэвтэрнэ үү."); return false;
  };

  const refreshProjects = async (currentUser: User | null) => {
    if (!supabase) {
      const demoItems = loadDemoProjects();
      setItems(demoItems);
      setDataMode("demo");
      setCachedProjects(demoItems, "demo", viewer);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase.from("projects").select("id,owner_id,title,role,description,category,cover_url,view_count,is_published,published_at,created_at,visibility,profiles!projects_owner_id_fkey(display_name,headline),project_likes(count)").order("published_at", { ascending: false, nullsFirst: false });
    if (error || !data || data.length === 0) {
      if (error) notify(`Өгөгдөл ачаалж чадсангүй: ${error.message}`);
      const demoItems = loadDemoProjects();
      setItems(demoItems);
      setDataMode("demo");
      setCachedProjects(demoItems, "demo", viewer);
      setLoading(false);
      return;
    }
    let likedIds = new Set<string>(); let savedIds = new Set<string>();
    if (currentUser) {
      const [likes, saves] = await Promise.all([supabase.from("project_likes").select("project_id").eq("user_id", currentUser.id), supabase.from("project_saves").select("project_id").eq("user_id", currentUser.id)]);
      likedIds = new Set((likes.data ?? []).map((row) => row.project_id)); savedIds = new Set((saves.data ?? []).map((row) => row.project_id));
    }
    const nextItems: ContentItem[] = ((data ?? []) as unknown as ProjectRow[]).map((project) => {
      const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;
      return { id: project.id, ownerId: project.owner_id ?? "seed", title: project.title, creator: profile?.display_name ?? "Project X", role: project.role || profile?.headline || "Бүтээлч", category: project.category, summary: project.description ?? "", coverUrl: project.cover_url, likes: project.project_likes?.[0]?.count ?? 0, views: project.view_count ?? 0, saved: savedIds.has(project.id), liked: likedIds.has(project.id), status: project.is_published ? "published" : "draft", createdAt: project.published_at ?? project.created_at, visibility: project.visibility ?? "everyone" };
    });
    setItems(nextItems); setDataMode("backend"); setCachedProjects(nextItems, "backend", viewer); setLoading(false);
  };

  useEffect(() => {
    if (!authReady) return;
    void refreshProjects(user);
  }, [authReady, user]);

  const visibleItems = useMemo(() => [...items].filter((item) => {
    /* Published only. RLS hands you your own drafts and private pieces as well as everyone
       else's published work, so without this the gallery mixes your unfinished projects in
       with the feed. They belong under "Миний бүтээл" below, which lists everything you own. */
    if (item.status !== "published") return false;
    const term = query.trim().toLocaleLowerCase(); const allText = `${item.title} ${item.creator} ${item.role} ${item.category} ${item.summary}`.toLocaleLowerCase();
    return (activeCategory === "Бүгд" || item.category === activeCategory) && allText.includes(term);
  }).sort((a, b) => sortMode === "recent" ? b.createdAt.localeCompare(a.createdAt) : sortMode === "liked" ? b.likes - a.likes : sortMode === "viewed" ? b.views - a.views : b.likes + b.views / 20 - (a.likes + a.views / 20)), [items, query, activeCategory, sortMode]);

  const toggleLike = async (item: ContentItem) => {
    if (!requireUser()) return;
    const nextLiked = !item.liked; setItems((all) => all.map((x) => x.id === item.id ? { ...x, liked: nextLiked, likes: Math.max(0, x.likes + (nextLiked ? 1 : -1)) } : x));
    if (dataMode === "demo" || !supabase || !user) { notify(nextLiked ? "Талархал нэмэгдлээ." : "Талархлыг буцаалаа."); return; }
    const request = nextLiked ? supabase.from("project_likes").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_likes").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request; if (error) { notify(error.message); void refreshProjects(user); return; } notify(nextLiked ? "Талархал нэмэгдлээ." : "Талархлыг буцаалаа.");
  };
  const toggleSave = async (item: ContentItem) => {
    if (!requireUser()) return;
    const nextSaved = !item.saved; setItems((all) => all.map((x) => x.id === item.id ? { ...x, saved: nextSaved } : x));
    if (dataMode === "demo" || !supabase || !user) { notify(nextSaved ? "Бүтээл хадгалагдлаа." : "Хадгалсан жагсаалтаас хаслаа."); return; }
    const request = nextSaved ? supabase.from("project_saves").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_saves").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request; if (error) { notify(error.message); void refreshProjects(user); return; } notify(nextSaved ? "Бүтээл хадгалагдлаа." : "Хадгалсан жагсаалтаас хаслаа.");
  };
  /** Ownership, including demo mode where there is no signed-in user and locally-created
   * projects are stamped "local". The same rule the project page uses. */
  const ownsItem = (item: ContentItem) => user ? item.ownerId === user.id : !supabase && item.ownerId === "local";

  const editItem = (item: ContentItem) => {
    if (!ownsItem(item)) return notify("Зөвхөн өөрийн бүтээлийг засна.");
    /* One editor for every project: the block editor at /project/[id]?edit=1. The form below
       creates, it never edits, so a block-built piece can't be reopened in a form that would
       not show its blocks. */
    router.push(`/project/${item.id}?edit=1`);
  };

  const deleteItem = async (item: ContentItem) => {
    if (!ownsItem(item)) return notify("Зөвхөн өөрийн бүтээлийг устгана.");
    if (!window.confirm(`"${item.title}" бүтээлийг устгах уу?`)) return;
    const error = await deleteProject(item.id);
    if (error) return notify(error);
    setItems((all) => all.filter((x) => x.id !== item.id));
    notify("Бүтээл устлаа.");
  };

  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!requireUser()) return;
    const title = form.title.trim(); const role = form.role.trim(); const summary = form.summary.trim();
    if (!title || !role || !summary) return notify("Гарчиг, төрөл, тайлбарыг бөглөнө үү.");
    /* Through saveProject rather than its own insert: one write path means the backend and
       demo branches, and the published-date handling, only exist once. */
    const { id, error } = await saveProject({
      editingId: null,
      status: form.status,
      dates: null,
      author: { id: user?.id ?? null, name: user?.user_metadata.display_name || "Та" },
      draft: {
        title, role, category: form.category, coverUrl: form.coverUrl.trim() || defaultCover,
        summary, blocks: [], buttonLabel: "", buttonUrl: "",
        tags: [], visibility: "everyone", isMature: false, commentsDisabled: false,
        license: LICENSE_OPTIONS[0].value,
      },
    });
    if (error || !id) return notify(error ?? "Хадгалахад алдаа гарлаа.");
    notify("Бүтээл нийтлэгдлээ."); setForm(emptyForm); await refreshProjects(user);
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true);
    const result = await runAuthSubmit({ mode: authMode, email: authEmail, password: authPassword, displayName });
    setAuthBusy(false); notify(result.message);
    if (result.close) { setAuthOpen(false); setAuthPassword(""); }
  };
  const ownedItems = items.filter((item) => item.ownerId === user?.id); const publishedCount = ownedItems.filter((item) => item.status === "published").length; const savedCount = items.filter((item) => item.saved).length;

  return <main>
    <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} onSignOut={() => notify("Системээс гарлаа.")} />
    <HeroSection />
    <StatsRow total={ownedItems.length} published={publishedCount} drafts={ownedItems.length - publishedCount} saved={savedCount} />
    <section id="explore" className="explore-section">
      <Toolbar<SortMode>
        activeKind="projects"
        query={query} onQueryChange={(value) => { setQuery(value); setSharedQuery(value); }} searchPlaceholder="Project X-ээс хайх..."
        sortMode={sortMode} onSortModeChange={(value) => { setSortMode(value); setSortMenuOpen(false); }}
        sortMenuOpen={sortMenuOpen} onToggleSortMenu={() => setSortMenuOpen((open) => !open)}
        sortOptions={SORT_OPTIONS}
      />
      <CategoryRail categories={categories} categoryArtwork={categoryArtwork} activeCategory={activeCategory} onActiveCategoryChange={setActiveCategory} />
      <ContentGrid loading={loading} items={visibleItems} currentUserId={user?.id} onToggleLike={toggleLike} onToggleSave={toggleSave} onEdit={editItem} onDelete={deleteItem} />
    </section>
    <ShareWorkForm
      form={form} onFormChange={setForm}
      onSubmit={(event) => void saveContent(event)}
      isLoggedIn={!!user} onRequestLogin={() => setAuthOpen(true)}
      categories={categories.slice(1)} defaultCover={defaultCover}
      previewCreatorLabel={user?.user_metadata.display_name || "Бүтээгч"}
    />
    <ManageWork isLoggedIn={!!user} items={ownedItems} onEdit={editItem} onDelete={deleteItem} />
    <SiteFooter homeHref="#top" backendConnected={!!supabase} />
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
