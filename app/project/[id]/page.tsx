"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Icon } from "../../../components/Icon";
import { SiteHeader } from "../../../components/SiteHeader";
import { SiteFooter } from "../../../components/SiteFooter";
import { AuthDialog, AuthMode } from "../../../components/AuthDialog";
import { Toast } from "../../../components/Toast";
import { ActionRail } from "../../../components/project/ActionRail";
import { StoryBody } from "../../../components/project/StoryBody";
import { BlockRenderer } from "../../../components/project/BlockRenderer";
import { AppreciateFooter } from "../../../components/project/AppreciateFooter";
import { CommentsSection, Comment } from "../../../components/project/CommentsSection";
import { MetaTagsGrid } from "../../../components/project/MetaTagsGrid";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthProvider";
import { ContentItem, loadDemoProjects, projectGallery, projectOverview, toolsForCategory } from "../../../lib/project-samples";
import type { ProjectBlock } from "../../../lib/project-editor";

type ProjectRow = { id: string; owner_id: string | null; title: string; role: string; description: string; category: string; cover_url: string; view_count: number; is_published: boolean; published_at: string | null; created_at: string; body_blocks: ProjectBlock[] | null; custom_button_label: string | null; custom_button_url: string | null; profiles: { display_name: string; headline: string | null } | { display_name: string; headline: string | null }[] | null; project_likes: { count: number }[] | null };

const STORY_HEADINGS = ["ТӨСЛИЙН ТУХАЙ", "ХАНДЛАГА", "ҮР ДҮН"];

function mapRow(project: ProjectRow): ContentItem {
  const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;
  return { id: project.id, ownerId: project.owner_id ?? "seed", title: project.title, creator: profile?.display_name ?? "Project X", role: project.role || profile?.headline || "Бүтээлч", category: project.category, summary: project.description ?? "", coverUrl: project.cover_url, likes: project.project_likes?.[0]?.count ?? 0, views: project.view_count ?? 0, saved: false, liked: false, status: project.is_published ? "published" : "draft", createdAt: project.published_at ?? project.created_at, blocks: project.body_blocks ?? undefined, customButtonLabel: project.custom_button_label ?? undefined, customButtonUrl: project.custom_button_url ?? undefined };
}

/** Splits the case-study image gallery into three chunks that sit between the three story blocks. */
function chunkGallery(gallery: string[]): string[][] {
  if (!gallery.length) return [];
  const sizes = [2, 2, gallery.length - 4];
  const chunks: string[][] = [];
  let cursor = 0;
  for (const size of sizes) {
    if (size <= 0) { chunks.push([]); continue; }
    chunks.push(gallery.slice(cursor, cursor + size));
    cursor += size;
  }
  return chunks;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const { user, authReady } = useAuth();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3000); };
  const requireUser = () => {
    if (!supabase) return true;
    if (user) return true;
    setAuthOpen(true); notify("Энэ үйлдэлд эхлээд нэвтэрнэ үү."); return false;
  };

  useEffect(() => {
    if (!authReady || !id) return;
    let cancelled = false;

    async function load(currentUser: User | null) {
      setLoading(true);
      setNotFound(false);

      const demoProjects = loadDemoProjects();
      const demoMatch = demoProjects.find((project) => project.id === id) ?? null;
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

      if (!supabase || !looksLikeUuid) {
        if (cancelled) return;
        if (!demoMatch) { setNotFound(true); setLoading(false); return; }
        setItem(demoMatch);
        setRelated(demoProjects.filter((project) => project.id !== id && (project.category === demoMatch.category || project.creator === demoMatch.creator)).slice(0, 6));
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.from("projects").select("id,owner_id,title,role,description,category,cover_url,view_count,is_published,published_at,created_at,body_blocks,custom_button_label,custom_button_url,profiles!projects_owner_id_fkey(display_name,headline),project_likes(count)").eq("id", id).maybeSingle();

      if (cancelled) return;

      if (error || !data) {
        if (!demoMatch) { setNotFound(true); setLoading(false); return; }
        setItem(demoMatch);
        setRelated(demoProjects.filter((project) => project.id !== id && (project.category === demoMatch.category || project.creator === demoMatch.creator)).slice(0, 6));
        setLoading(false);
        return;
      }

      let mapped = mapRow(data as unknown as ProjectRow);

      if (currentUser) {
        const [likes, saves] = await Promise.all([
          supabase.from("project_likes").select("project_id").eq("user_id", currentUser.id).eq("project_id", id),
          supabase.from("project_saves").select("project_id").eq("user_id", currentUser.id).eq("project_id", id),
        ]);
        mapped = { ...mapped, liked: (likes.data ?? []).length > 0, saved: (saves.data ?? []).length > 0 };
      }

      if (cancelled) return;
      setItem(mapped);
      void supabase.rpc("increment_project_views", { project_uuid: id });

      const { data: more } = await supabase.from("projects").select("id,owner_id,title,role,description,category,cover_url,view_count,is_published,published_at,created_at,profiles!projects_owner_id_fkey(display_name,headline),project_likes(count)").eq("is_published", true).eq("category", mapped.category).neq("id", id).limit(6);
      if (!cancelled) setRelated(((more ?? []) as unknown as ProjectRow[]).map(mapRow));

      setLoading(false);
    }

    void load(user);
    return () => { cancelled = true; };
  }, [authReady, id, user]);

  const gallery = useMemo(() => item ? projectGallery(item.coverUrl) : [], [item]);
  const tools = useMemo(() => item ? toolsForCategory(item.category) : [], [item]);
  const overview = useMemo(() => item ? projectOverview(item) : [], [item]);
  const story = useMemo(() => overview.map((paragraph, index) => ({ heading: STORY_HEADINGS[index] ?? `ХЭСЭГ ${index + 1}`, paragraph })), [overview]);
  const slideChunks = useMemo(() => chunkGallery(gallery), [gallery]);

  const initial = item ? item.creator.slice(0, 1).toUpperCase() : "?";

  const toggleLike = async () => {
    if (!item || !requireUser()) return;
    const nextLiked = !item.liked;
    setItem({ ...item, liked: nextLiked, likes: Math.max(0, item.likes + (nextLiked ? 1 : -1)) });
    if (!supabase || !user) { notify(nextLiked ? "Талархал нэмэгдлээ." : "Талархлыг буцаалаа."); return; }
    const request = nextLiked ? supabase.from("project_likes").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_likes").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request;
    if (error) notify(error.message); else notify(nextLiked ? "Талархал нэмэгдлээ." : "Талархлыг буцаалаа.");
  };

  const toggleSave = async () => {
    if (!item || !requireUser()) return;
    const nextSaved = !item.saved;
    setItem({ ...item, saved: nextSaved });
    if (!supabase || !user) { notify(nextSaved ? "Бүтээл хадгалагдлаа." : "Хадгалсан жагсаалтаас хаслаа."); return; }
    const request = nextSaved ? supabase.from("project_saves").insert({ project_id: item.id, user_id: user.id }) : supabase.from("project_saves").delete().eq("project_id", item.id).eq("user_id", user.id);
    const { error } = await request;
    if (error) notify(error.message); else notify(nextSaved ? "Бүтээл хадгалагдлаа." : "Хадгалсан жагсаалтаас хаслаа.");
  };

  const toggleFollow = () => {
    if (!requireUser()) return;
    setFollowing((current) => !current);
    notify(following ? "Дагахаа больлоо." : "Бүтээгчийг дагаж эхэллээ.");
  };

  const sharePage = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify("Холбоосыг хууллаа.");
    } catch {
      notify(window.location.href);
    }
  };

  const postComment = () => {
    if (!requireUser() || !commentText.trim()) return;
    const author = user?.user_metadata.display_name || user?.email?.split("@")[0] || "Зочин";
    setComments((all) => [{ id: `${Date.now()}`, author, text: commentText.trim() }, ...all]);
    setCommentText("");
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!supabase) return; setAuthBusy(true);
    const response = authMode === "signin" ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword }) : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: displayName.trim() } } });
    setAuthBusy(false); if (response.error) return notify(response.error.message);
    if (authMode === "signup" && !response.data.session) notify("Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү."); else notify(authMode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.");
    setAuthOpen(false); setAuthPassword("");
  };

  if (notFound) {
    return <main className="case-page">
      <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />
      <div className="case-empty"><Icon name="search" /><h1>Төсөл олдсонгүй</h1><p>Энэ холбоос хүчингүй эсвэл төсөл устгагдсан байж болзошгүй.</p><Link href="/#explore" className="hero-button">Галерей руу буцах</Link></div>
    </main>;
  }

  return <main className="case-page">
    <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />

    {loading || !item ? <div className="case-skeleton" aria-hidden="true">
      <span className="skeleton case-skeleton-cover" />
      <div className="case-skeleton-body">
        <span className="skeleton skeleton-line" style={{ width: "40%", height: 34 }} />
        <span className="skeleton skeleton-line" style={{ width: "60%", marginTop: 16 }} />
        <span className="skeleton skeleton-line" style={{ width: "90%", marginTop: 28, height: 400, borderRadius: 8 }} />
      </div>
    </div> : <>
      <ActionRail initial={initial} following={following} onToggleFollow={toggleFollow} saved={item.saved} onToggleSave={() => void toggleSave()} liked={item.liked} onToggleLike={() => void toggleLike()} onShare={() => void sharePage()} />

      <figure className="case-hero"><img src={item.coverUrl} alt={item.title} /></figure>

      {item.blocks && item.blocks.length > 0
        ? <div className="case-body case-body-blocks"><BlockRenderer blocks={item.blocks} /></div>
        : <StoryBody title={item.title} story={story} slideChunks={slideChunks} />}

      <AppreciateFooter item={item} initial={initial} commentCount={comments.length} onToggleLike={() => void toggleLike()} following={following} onToggleFollow={toggleFollow} related={related} />

      <CommentsSection authorInitial={(user?.user_metadata.display_name || user?.email || "?").slice(0, 1).toUpperCase()} commentText={commentText} onCommentTextChange={setCommentText} onPostComment={postComment} comments={comments} />

      <MetaTagsGrid initial={initial} creator={item.creator} role={item.role} category={item.category} tools={tools} createdAt={item.createdAt} />
    </>}

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
