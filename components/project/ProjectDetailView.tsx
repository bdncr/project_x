"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Icon } from "../Icon";
import { SiteHeader } from "../SiteHeader";
import { SiteFooter } from "../SiteFooter";
import { AuthDialog, AuthMode } from "../auth/AuthDialog";
import { Toast } from "../Toast";
import { ActionRail } from "./ActionRail";
import { StoryBody } from "./StoryBody";
import { BlockRenderer } from "./BlockRenderer";
import { AppreciateFooter } from "./AppreciateFooter";
import { CaseStudySkeletonBody } from "./CaseStudySkeleton";
import { CommentsSection } from "./CommentsSection";
import { InviteCreatorModal } from "./InviteCreatorModal";
import { MetaTagsGrid } from "./MetaTagsGrid";
import { supabase } from "../../lib/supabase";
import { runAuthSubmit } from "../../lib/auth-actions";
import { useAuth } from "../../lib/AuthProvider";
import { ContentItem, loadDemoProjects, projectGallery, projectOverview, toolsForCategory } from "../../lib/project-samples";
import type { ProjectBlock } from "../../lib/project-editor";
import { deleteProject } from "../../lib/project-crud";
import { InviteForm, sendInvite } from "../../lib/invite-job";
import { ProjectComment, createComment, deleteComment, fetchComments } from "../../lib/project-comments";

type ProjectRow = { id: string; owner_id: string | null; title: string; role: string; description: string; category: string; cover_url: string; view_count: number; is_published: boolean; published_at: string | null; created_at: string; body_blocks: ProjectBlock[] | null; custom_button_label: string | null; custom_button_url: string | null; comments_disabled: boolean | null; profiles: { display_name: string; headline: string | null } | { display_name: string; headline: string | null }[] | null; project_likes: { count: number }[] | null };

const STORY_HEADINGS = ["ТӨСЛИЙН ТУХАЙ", "ХАНДЛАГА", "ҮР ДҮН"];

function mapRow(project: ProjectRow): ContentItem {
  const profile = Array.isArray(project.profiles) ? project.profiles[0] : project.profiles;
  return { id: project.id, ownerId: project.owner_id ?? "seed", title: project.title, creator: profile?.display_name ?? "Project X", role: project.role || profile?.headline || "Бүтээлч", category: project.category, summary: project.description ?? "", coverUrl: project.cover_url, likes: project.project_likes?.[0]?.count ?? 0, views: project.view_count ?? 0, saved: false, liked: false, status: project.is_published ? "published" : "draft", createdAt: project.published_at ?? project.created_at, blocks: project.body_blocks ?? undefined, customButtonLabel: project.custom_button_label ?? undefined, customButtonUrl: project.custom_button_url ?? undefined, commentsDisabled: project.comments_disabled ?? false };
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

/** The public case study: cover, story or block body, appreciation, comments and credits.
 * The owner additionally gets Edit and Delete in the action rail — the R and D of the CRUD
 * that /project/[id] owns, with C and U living in ProjectEditorScreen. */
export function ProjectDetailView({ id }: { id: string }) {
  const router = useRouter();
  const { user, authReady } = useAuth();

  const [item, setItem] = useState<ContentItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [following, setFollowing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [related, setRelated] = useState<ContentItem[]>([]);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentPosting, setCommentPosting] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
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

      const { data, error } = await supabase.from("projects").select("id,owner_id,title,role,description,category,cover_url,view_count,is_published,published_at,created_at,body_blocks,custom_button_label,custom_button_url,comments_disabled,profiles!projects_owner_id_fkey(display_name,headline),project_likes(count)").eq("id", id).maybeSingle();

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

  /** The thread loads independently of the project itself so a slow comment query never holds
   * back the case study, and so posting/deleting does not have to refetch the project. */
  useEffect(() => {
    if (!authReady || !id) return;
    let cancelled = false;
    setCommentsLoading(true);
    void fetchComments(id).then(({ comments: loaded, error }) => {
      if (cancelled) return;
      setComments(loaded);
      setCommentsLoading(false);
      /* Shown inline rather than as a toast: until supabase/patch-project-comments.sql has
         been run the table is missing, and that would fire on every project page view. */
      setCommentsError(error);
    });
    return () => { cancelled = true; };
  }, [authReady, id]);

  const gallery = useMemo(() => item ? projectGallery(item.coverUrl) : [], [item]);
  const tools = useMemo(() => item ? toolsForCategory(item.category) : [], [item]);
  const overview = useMemo(() => item ? projectOverview(item) : [], [item]);
  const story = useMemo(() => overview.map((paragraph, index) => ({ heading: STORY_HEADINGS[index] ?? `ХЭСЭГ ${index + 1}`, paragraph })), [overview]);
  const slideChunks = useMemo(() => chunkGallery(gallery), [gallery]);

  const initial = item ? item.creator.slice(0, 1).toUpperCase() : "?";
  /** Owner check. Backend rows carry the real auth id; demo-mode projects created without a
   * backend are stamped "local", so in that mode the local author owns them. */
  const isOwner = !!item && (user ? item.ownerId === user.id : !supabase && item.ownerId === "local");

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

  const removeProject = async () => {
    if (!item || !isOwner || deleting) return;
    if (!window.confirm(`"${item.title}" бүтээлийг бүрмөсөн устгах уу? Үүнийг буцаах боломжгүй.`)) return;
    setDeleting(true);
    const error = await deleteProject(item.id);
    if (error) { setDeleting(false); notify(error); return; }
    notify("Бүтээл устлаа.");
    router.push("/#explore");
  };

  const openInvite = () => {
    if (isOwner) { notify("Өөрийн бүтээлд ажлын санал илгээх боломжгүй."); return; }
    if (requireUser()) setInviteOpen(true);
  };

  /** An invitation is stored as an ordinary freelance listing on the jobs board — see
   * buildInviteJobForm for why the personal note rides along in the description. */
  const submitInvite = async (form: InviteForm) => {
    if (!item || inviteBusy) return;
    setInviteBusy(true);
    const { error } = await sendInvite({
      form, creatorName: item.creator, recipientId: item.ownerId, projectId: item.id,
      author: { id: user?.id ?? null, name: user?.user_metadata.display_name || user?.email?.split("@")[0] || "Project X" },
    });
    setInviteBusy(false);
    if (error) { notify(error); return; }
    setInviteOpen(false);
    notify("Ажлын санал илгээгдэж, зар үүслээ.");
  };

  const postComment = async () => {
    if (!requireUser() || !commentText.trim() || commentPosting) return;
    const author = user?.user_metadata.display_name || user?.email?.split("@")[0] || "Зочин";
    setCommentPosting(true);
    const { comment, error } = await createComment(id, commentText, { id: user?.id ?? null, name: author });
    setCommentPosting(false);
    if (error || !comment) { notify(error ?? "Сэтгэгдэл нэмэхэд алдаа гарлаа."); return; }
    setComments((all) => [comment, ...all]);
    setCommentText("");
    notify("Сэтгэгдэл нэмэгдлээ.");
  };

  const removeComment = async (comment: ProjectComment) => {
    if (!window.confirm("Энэ сэтгэгдлийг устгах уу?")) return;
    /* Optimistic: put the row back if the delete is refused, so a policy rejection is visible
       rather than silently re-appearing on the next reload. */
    setComments((all) => all.filter((existing) => existing.id !== comment.id));
    const error = await deleteComment(comment);
    if (error) { setComments((all) => [comment, ...all].sort((a, b) => b.createdAt.localeCompare(a.createdAt))); notify(error); return; }
    notify("Сэтгэгдэл устлаа.");
  };

  const submitAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAuthBusy(true);
    const result = await runAuthSubmit({ mode: authMode, email: authEmail, password: authPassword, displayName });
    setAuthBusy(false); notify(result.message);
    if (result.close) { setAuthOpen(false); setAuthPassword(""); }
  };

  if (notFound) {
    return <main className="case-page">
      <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />
      <div className="case-empty"><Icon name="search" /><h1>Төсөл олдсонгүй</h1><p>Энэ холбоос хүчингүй эсвэл төсөл устгагдсан байж болзошгүй.</p><Link href="/#explore" className="hero-button">Галерей руу буцах</Link></div>
      <SiteFooter backendConnected={!!supabase} />
    </main>;
  }

  return <main className="case-page">
    <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />

    {loading || !item ? <CaseStudySkeletonBody /> : <>
      <ActionRail
        initial={initial} ownerId={item.ownerId} creatorName={item.creator} creatorRole={item.role} tools={tools}
        following={following} onToggleFollow={toggleFollow}
        onInvite={openInvite}
        isOwner={isOwner} editHref={`/project/${item.id}?edit=1`}
        deleting={deleting} onDelete={() => void removeProject()}
        saved={item.saved} onToggleSave={() => void toggleSave()}
        liked={item.liked} onToggleLike={() => void toggleLike()} onShare={() => void sharePage()}
      />

      <figure className="case-hero"><img src={item.coverUrl} alt={item.title} /></figure>

      {item.blocks && item.blocks.length > 0
        ? <div className="case-body case-body-blocks"><BlockRenderer blocks={item.blocks} /></div>
        : <StoryBody title={item.title} story={story} slideChunks={slideChunks} />}

      <AppreciateFooter item={item} initial={initial} commentCount={comments.length} onToggleLike={() => void toggleLike()} following={following} onToggleFollow={toggleFollow} related={related} />

      <CommentsSection
        authorInitial={(user?.user_metadata.display_name || user?.email || "?").slice(0, 1).toUpperCase()}
        commentText={commentText} onCommentTextChange={setCommentText}
        onPostComment={() => void postComment()} comments={comments}
        loading={commentsLoading} posting={commentPosting} error={commentsError}
        disabled={!!item.commentsDisabled}
        currentUserId={user?.id ?? null}
        isProjectOwner={isOwner} onDeleteComment={(comment) => void removeComment(comment)}
      />

      <MetaTagsGrid initial={initial} creator={item.creator} role={item.role} category={item.category} tools={tools} createdAt={item.createdAt} onInvite={openInvite} />
    </>}

    <SiteFooter backendConnected={!!supabase} />

    {inviteOpen && item && <InviteCreatorModal
      creatorName={item.creator} creatorInitial={initial} busy={inviteBusy}
      onClose={() => setInviteOpen(false)} onSubmit={(form) => void submitInvite(form)}
    />}

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
