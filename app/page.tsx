"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type ContentStatus = "published" | "draft";
type SortMode = "recommended" | "recent" | "liked" | "viewed";
type AuthMode = "signin" | "signup";
type ContentItem = { id: string; ownerId: string; title: string; creator: string; role: string; category: string; summary: string; coverUrl: string; likes: number; views: number; saved: boolean; liked: boolean; status: ContentStatus; createdAt: string };
type ContentForm = { title: string; role: string; category: string; summary: string; coverUrl: string; status: ContentStatus };
type ProjectRow = { id: string; owner_id: string; title: string; role: string; description: string; category: string; cover_url: string; view_count: number; is_published: boolean; published_at: string | null; created_at: string; profiles: { display_name: string; headline: string | null } | { display_name: string; headline: string | null }[] | null; project_likes: { count: number }[] | null };

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

function Icon({ name }: { name: "search" | "plus" | "edit" | "trash" | "close" | "heart" | "eye" | "save" | "upload" | "user" | "logout" | "filter" | "chevron" | "bell" | "mail" }) {
  const paths = {
    search: <><circle cx="11" cy="11" r="6.3" /><path d="m16 16 4 4" /></>, plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    edit: <><path d="m14 5 5 5" /><path d="M4 20h5L19 10a3.5 3.5 0 0 0-5-5L4 15v5Z" /></>, trash: <><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>, heart: <path d="M12 20s-8-4.7-8-10.4A4.2 4.2 0 0 1 12 8a4.2 4.2 0 0 1 8 1.6C20 15.3 12 20 12 20Z" />,
    eye: <><path d="M3 12s3.2-5.5 9-5.5 9 5.5 9 5.5-3.2 5.5-9 5.5S3 12 3 12Z" /><circle cx="12" cy="12" r="2.5" /></>, save: <><path d="M6 4h12v17l-6-3-6 3V4Z" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>, user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c.9-4 3.6-6 8-6s7.1 2 8 6" /></>, logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M21 19V5" /></>,
    filter: <><path d="M4 7h16" /><path d="M7 12h10" /><path d="M10 17h4" /><circle cx="7" cy="7" r="1.5" /><circle cx="16" cy="12" r="1.5" /><circle cx="11" cy="17" r="1.5" /></>, chevron: <path d="m8 10 4 4 4-4" />, bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>, mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const compactNumber = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const textError = (error: unknown) => error instanceof Error ? error.message : "Тодорхойгүй алдаа гарлаа.";

export default function Home() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [form, setForm] = useState<ContentForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("Бүгд");
  const [sortMode, setSortMode] = useState<SortMode>("recommended");
  const [selected, setSelected] = useState<ContentItem | null>(null);
  const [toast, setToast] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [navMenu, setNavMenu] = useState<"resources" | "hire" | null>(null);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };
  const requireUser = () => { if (user) return true; setAuthOpen(true); notify("Энэ үйлдэлд эхлээд нэвтэрнэ үү."); return false; };

  const refreshProjects = async (currentUser: User | null) => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase.from("projects").select("id,owner_id,title,role,description,category,cover_url,view_count,is_published,published_at,created_at,profiles(display_name,headline),project_likes(count)").order("published_at", { ascending: false, nullsFirst: false });
    if (error) { notify(`Өгөгдөл ачаалж чадсангүй: ${error.message}`); setLoading(false); return; }
    let likedIds = new Set<string>(); let savedIds = new Set<string>();
    if (currentUser) {
      const [likes, saves] = await Promise.all([supabase.from("project_likes").select("project_id").eq("user_id", currentUser.id), supabase.from("project_saves").select("project_id").eq("user_id", currentUser.id)]);
      likedIds = new Set((likes.data ?? []).map((row) => row.project_id)); savedIds = new Set((saves.data ?? []).map((row) => row.project_id));
    }
    const nextItems: ContentItem[] = ((data ?? []) as unknown as ProjectRow[]).map((project) => {
      const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;
      return { id: project.id, ownerId: project.owner_id, title: project.title, creator: profile?.display_name ?? "Project X", role: project.role || profile?.headline || "Бүтээлч", category: project.category, summary: project.description ?? "", coverUrl: project.cover_url, likes: project.project_likes?.[0]?.count ?? 0, views: project.view_count ?? 0, saved: savedIds.has(project.id), liked: likedIds.has(project.id), status: project.is_published ? "published" : "draft", createdAt: project.published_at ?? project.created_at };
    });
    setItems(nextItems); setLoading(false);
  };

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    void supabase.auth.getSession().then(({ data: { session } }) => { if (alive) { setUser(session?.user ?? null); void refreshProjects(session?.user ?? null); } });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { if (alive) { setUser(session?.user ?? null); void refreshProjects(session?.user ?? null); } });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  const visibleItems = useMemo(() => [...items].filter((item) => {
    const term = query.trim().toLocaleLowerCase(); const allText = `${item.title} ${item.creator} ${item.role} ${item.category} ${item.summary}`.toLocaleLowerCase();
    return (activeCategory === "Бүгд" || item.category === activeCategory) && allText.includes(term);
  }).sort((a, b) => sortMode === "recent" ? b.createdAt.localeCompare(a.createdAt) : sortMode === "liked" ? b.likes - a.likes : sortMode === "viewed" ? b.views - a.views : b.likes + b.views / 20 - (a.likes + a.views / 20)), [items, query, activeCategory, sortMode]);

  const openItem = async (item: ContentItem) => {
    setSelected({ ...item, views: item.views + 1 }); setItems((all) => all.map((x) => x.id === item.id ? { ...x, views: x.views + 1 } : x));
    if (supabase) { const { error } = await supabase.rpc("increment_project_views", { project_uuid: item.id }); if (error) console.warn(error.message); }
  };
  const toggleLike = async (item: ContentItem) => {
    if (!requireUser() || !supabase || !user) return;
    const nextLiked = !item.liked; setItems((all) => all.map((x) => x.id === item.id ? { ...x, liked: nextLiked, likes: Math.max(0, x.likes + (nextLiked ? 1 : -1)) } : x));
    const request = nextLiked ? supabase.from("project_likes").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_likes").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request; if (error) { notify(error.message); void refreshProjects(user); return; } notify(nextLiked ? "Талархал нэмэгдлээ." : "Талархлыг буцаалаа.");
  };
  const toggleSave = async (item: ContentItem) => {
    if (!requireUser() || !supabase || !user) return;
    const nextSaved = !item.saved; setItems((all) => all.map((x) => x.id === item.id ? { ...x, saved: nextSaved } : x));
    const request = nextSaved ? supabase.from("project_saves").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_saves").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request; if (error) { notify(error.message); void refreshProjects(user); return; } notify(nextSaved ? "Бүтээл хадгалагдлаа." : "Хадгалсан жагсаалтаас хаслаа.");
  };
  const editItem = (item: ContentItem) => {
    if (!requireUser() || item.ownerId !== user?.id) return notify("Зөвхөн өөрийн бүтээлийг засна.");
    setEditingId(item.id); setForm({ title: item.title, role: item.role, category: item.category, summary: item.summary, coverUrl: item.coverUrl, status: item.status }); document.getElementById("share")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const deleteItem = async (item: ContentItem) => {
    if (!requireUser() || !supabase || item.ownerId !== user?.id) return notify("Зөвхөн өөрийн бүтээлийг устгана.");
    if (!window.confirm(`\"${item.title}\" бүтээлийг устгах уу?`)) return;
    const { error } = await supabase.from("projects").delete().eq("id", item.id); if (error) return notify(error.message);
    setItems((all) => all.filter((x) => x.id !== item.id)); if (selected?.id === item.id) setSelected(null); if (editingId === item.id) { setEditingId(null); setForm(emptyForm); } notify("Бүтээл устлаа.");
  };
  const saveContent = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!requireUser() || !supabase || !user) return;
    const payload = { title: form.title.trim(), role: form.role.trim(), description: form.summary.trim(), category: form.category, cover_url: form.coverUrl.trim() || defaultCover, is_published: form.status === "published", published_at: form.status === "published" ? new Date().toISOString() : null };
    if (!payload.title || !form.role.trim() || !payload.description) return notify("Гарчиг, төрөл, тайлбарыг бөглөнө үү.");
    const result = editingId ? await supabase.from("projects").update(payload).eq("id", editingId) : await supabase.from("projects").insert({ ...payload, owner_id: user.id });
    if (result.error) return notify(result.error.message);
    notify(editingId ? "Бүтээл шинэчлэгдлээ." : "Бүтээл нийтлэгдлээ."); setEditingId(null); setForm(emptyForm); await refreshProjects(user);
  };
  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!supabase) return; setAuthBusy(true);
    const response = authMode === "signin" ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }) : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: displayName.trim() } } });
    setAuthBusy(false); if (response.error) return notify(response.error.message);
    if (authMode === "signup" && !response.data.session) notify("Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү."); else notify(authMode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.");
    setAuthOpen(false); setAuthPassword("");
  };
  const signOut = async () => { if (!supabase) return; await supabase.auth.signOut(); notify("Системээс гарлаа."); };
  const ownedItems = items.filter((item) => item.ownerId === user?.id); const publishedCount = ownedItems.filter((item) => item.status === "published").length; const savedCount = items.filter((item) => item.saved).length;

  return <main>
    <header className="site-header"><a className="brand" href="#top"><span>Project</span><b>X</b></a><nav><a className="nav-active" href="#explore">Судлах</a><a href="#jobs">Ажлууд</a><div className="nav-dropdown"><button onClick={() => setNavMenu(navMenu === "resources" ? null : "resources")}>Нөөц <Icon name="chevron" /></button>{navMenu === "resources" && <div className="nav-menu"><a href="#explore">Тойм</a><a href="#explore">Карьерын гарын авлага</a><a href="#explore">Захиалгат төсөл</a><a href="#explore">Бүтээлч сургалт</a></div>}</div><div className="nav-dropdown"><button onClick={() => setNavMenu(navMenu === "hire" ? null : "hire")}>Ажилтан авах <Icon name="chevron" /></button>{navMenu === "hire" && <div className="nav-menu"><a href="#explore">Фрийлансер хайх</a><a href="#explore">Үйлчилгээ хайх</a><a href="#jobs">Ажлын зар оруулах</a></div>}</div></nav>
      <div className="header-actions"><a className="share-work" href="#share">Бүтээл нэмэх</a>{user ? <><button className="header-icon" aria-label="Мессеж"><Icon name="mail" /></button><button className="header-icon" aria-label="Мэдэгдэл"><Icon name="bell" /></button><div className="account-nav"><span><Icon name="user" /> {user.user_metadata.display_name || user.email?.split("@")[0]}</span><button onClick={signOut} aria-label="Гарах"><Icon name="logout" /></button></div></> : <button className="primary-link" onClick={() => setAuthOpen(true)}>Нэвтрэх</button>}</div>
    </header>
    <section id="top" className="hero"><div className="hero-media" aria-hidden="true" /><div className="hero-copy"><p className="kicker">Монгол бүтээлчдийн нээлттэй галерей</p><h1>Project X</h1><p>Бүтээлээ нийтэлж, цуглуулж, бүтээлчдийн ажлыг нээж харах нэг цэгийн платформ.</p><div className="hero-actions"><a href="#share" className="hero-button"><Icon name="plus" /> Бүтээл нэмэх</a><a href="#explore" className="secondary-button">Галерей харах</a></div></div></section>
    <section className="stats-row"><div><span>{ownedItems.length}</span><p>Миний бүтээл</p></div><div><span>{publishedCount}</span><p>Нийтлэгдсэн</p></div><div><span>{ownedItems.length - publishedCount}</span><p>Ноорог</p></div><div><span>{savedCount}</span><p>Хадгалсан</p></div></section>
    <section id="explore" className="explore-section"><div className="toolbar"><button className="filter-trigger"><Icon name="filter" /> Шүүлтүүр</button><label className="search-box"><Icon name="search" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Project X-ээс хайх..." /></label><div className="content-kind"><button className="active">Төслүүд</button><button>Хүмүүс</button><button>Assets</button><button>Зургууд</button></div><label className="sort-selector"><Icon name="filter" /><select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}><option value="recommended">Санал болгох</option><option value="recent">Хамгийн сүүлийн</option><option value="liked">Хамгийн их таалагдсан</option><option value="viewed">Хамгийн их үзсэн</option></select></label></div><div className="topic-rack">{categories.map((category) => <button key={category} className={activeCategory === category ? "topic-card active" : "topic-card"} onClick={() => setActiveCategory(category)} style={{ backgroundImage: `linear-gradient(90deg, rgba(9,12,22,.72), rgba(9,12,22,.18)), url(${categoryArtwork[category]})` }}><span>{category === "Бүгд" ? "Танд" : category}</span></button>)}</div><div className="feed-heading"><h2>Танд санал болгох</h2><button><Icon name="filter" /> Feed-ээ тохируулах</button></div>
      {loading ? <div className="empty-state"><h3>Ачаалж байна…</h3></div> : <div className="content-grid">{visibleItems.map((item) => <article className="content-card" key={item.id}><button className="image-button" onClick={() => void openItem(item)}><img src={item.coverUrl} alt="" /><span className={item.status === "published" ? "status published" : "status"}>{item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</span></button><div className="card-body"><div className="card-topline"><p>{item.category}</p><button className={item.saved ? "icon-action active" : "icon-action"} onClick={() => void toggleSave(item)}><Icon name="save" /></button></div><h3>{item.title}</h3><span>{item.creator} · {item.role}</span><div className="card-stats"><button className={item.liked ? "liked" : ""} onClick={() => void toggleLike(item)}><Icon name="heart" /> {compactNumber(item.likes)}</button><span><Icon name="eye" /> {compactNumber(item.views)}</span></div>{item.ownerId === user?.id && <div className="card-actions"><button onClick={() => editItem(item)}><Icon name="edit" /> Засах</button><button className="danger-button" onClick={() => void deleteItem(item)}><Icon name="trash" /> Устгах</button></div>}</div></article>)}</div>}
      {!loading && visibleItems.length === 0 && <div className="empty-state"><h3>Илэрц алга</h3><p>Шинэ бүтээл нийтлээд эхлээрэй.</p></div>}</section>
    <section id="share" className="editor-section"><div className="section-title"><p>Share Work</p><h2>{editingId ? "Бүтээл засах" : "Шинэ бүтээл нэмэх"}</h2></div>{!user && <div className="auth-hint"><p>Бүтээл оруулахын тулд нэвтэрсэн байх шаардлагатай.</p><button onClick={() => setAuthOpen(true)}>Нэвтрэх / Бүртгүүлэх</button></div>}<form className="editor-card" onSubmit={(e) => void saveContent(e)}><label>Гарчиг<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label><label>Төрөл<input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="UX/UI, зураглал..." /></label><label>Ангилал<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{categories.slice(1).map((x) => <option key={x}>{x}</option>)}</select></label><label>Төлөв<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ContentStatus })}><option value="published">Нийтлэх</option><option value="draft">Ноорог</option></select></label><label className="wide-field">Зургийн URL<input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} placeholder="https://..." /></label><label className="wide-field">Тайлбар<textarea value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} rows={5} /></label><div className="preview-panel"><div className="mini-preview"><img src={form.coverUrl || defaultCover} alt="" /><p>{form.title || "Гарчиг харагдана"}</p><span>{user?.user_metadata.display_name || "Бүтээгч"} · {form.category}</span></div></div><div className="form-actions wide-field"><button type="submit"><Icon name="upload" /> {editingId ? "Шинэчлэх" : "Нийтлэх"}</button>{editingId && <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setForm(emptyForm); }}><Icon name="close" /> Болих</button>}</div></form></section>
    <section id="manage" className="manage-section"><div className="section-title"><p>My work</p><h2>Миний бүтээл</h2></div>{!user ? <div className="empty-state"><p>Нэвтэрсний дараа та өөрийн бүтээлээ энд удирдана.</p></div> : <div className="manage-list">{ownedItems.map((item) => <article key={item.id} className="manage-row"><img src={item.coverUrl} alt="" /><div><h3>{item.title}</h3><p>{item.category} · {item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</p></div><span>{compactNumber(item.likes)} талархал</span><button onClick={() => editItem(item)}><Icon name="edit" /></button><button className="danger-icon" onClick={() => void deleteItem(item)}><Icon name="trash" /></button></article>)}{ownedItems.length === 0 && <div className="empty-state"><p>Таны нийтэлсэн бүтээл алга байна.</p></div>}</div>}</section>
    <footer><a className="brand" href="#top"><span>Project</span><b>X</b></a><p>© 2026 Project X. Улаанбаатар.</p><span>{supabase ? "Supabase backend холбогдсон" : "Backend тохируулаагүй"}</span></footer>
    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><section className="content-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}><Icon name="close" /></button><img src={selected.coverUrl} alt="" /><div className="modal-copy"><p>{selected.category} · {selected.status === "published" ? "Нийтэлсэн" : "Ноорог"}</p><h2>{selected.title}</h2><span>{selected.creator} · {selected.role}</span><p>{selected.summary}</p><div className="modal-stats"><span><Icon name="heart" /> {compactNumber(selected.likes)}</span><span><Icon name="eye" /> {compactNumber(selected.views)}</span></div><div className="card-actions"><button onClick={() => void toggleLike(selected)}><Icon name="heart" /> Талархах</button><button onClick={() => void toggleSave(selected)}><Icon name="save" /> Хадгалах</button>{selected.ownerId === user?.id && <><button onClick={() => { editItem(selected); setSelected(null); }}><Icon name="edit" /> Засах</button><button className="danger-button" onClick={() => void deleteItem(selected)}><Icon name="trash" /> Устгах</button></>}</div></div></section></div>}
    {authOpen && <div className="modal-backdrop" onClick={() => setAuthOpen(false)}><section className="auth-dialog" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setAuthOpen(false)}><Icon name="close" /></button><p className="kicker">Project X account</p><h2>{authMode === "signin" ? "Нэвтрэх" : "Бүртгэл үүсгэх"}</h2><form onSubmit={(e) => void submitAuth(e)}>{authMode === "signup" && <label>Нэр<input required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></label>}<label>Имэйл<input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} /></label><label>Нууц үг<input required type="password" minLength={6} value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} /></label><button className="auth-submit" disabled={authBusy}>{authBusy ? "Түр хүлээнэ үү…" : authMode === "signin" ? "Нэвтрэх" : "Бүртгүүлэх"}</button></form><button className="auth-switch" onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}>{authMode === "signin" ? "Шинэ хэрэглэгч үү? Бүртгүүлэх" : "Бүртгэлтэй юу? Нэвтрэх"}</button></section></div>}
    {toast && <div className="toast">{toast}</div>}
  </main>;
}
