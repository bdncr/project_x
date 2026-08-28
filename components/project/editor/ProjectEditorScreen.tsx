"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../SiteHeader";
import { AuthDialog, AuthMode } from "../../auth/AuthDialog";
import { Toast } from "../../Toast";
import { Icon } from "../../Icon";
import { EditorTopBar } from "./EditorTopBar";
import { EditorSidebar } from "./EditorSidebar";
import { BlockPicker } from "./BlockPicker";
import { BlockEditorCanvas } from "./BlockEditorCanvas";
import { SettingsModal } from "./SettingsModal";
import { ProjectPreview } from "./ProjectPreview";
import { supabase } from "../../../lib/supabase";
import { runAuthSubmit } from "../../../lib/auth-actions";
import { useAuth } from "../../../lib/AuthProvider";
import { ContentItem, ContentStatus } from "../../../lib/project-samples";
import { ProjectBlock, BlockType, EmbedKind, ProjectVisibility, LICENSE_OPTIONS, createBlock, cleanBlocksForSave, deriveSummaryFromBlocks, firstImageFromBlocks } from "../../../lib/project-editor";
import { DEFAULT_PROJECT_COVER, EditingDates, PROJECT_CATEGORIES, loadProjectForEdit, saveProject } from "../../../lib/project-crud";

type Meta = { title: string; role: string; category: string; coverUrl: string };

const EMPTY_META: Meta = { title: "", role: "", category: PROJECT_CATEGORIES[0], coverUrl: "" };

type ProjectEditorScreenProps = {
  /** "create" starts blank at /project/new; "edit" loads projectId at /project/<id>?edit=1. */
  mode: "create" | "edit";
  projectId?: string;
};

/** The block editor. Create and update both live here; the case-study route decides which mode
 * to mount (see app/project/[id]/page.tsx). */
export function ProjectEditorScreen({ mode, projectId }: ProjectEditorScreenProps) {
  const router = useRouter();
  const { user, authReady } = useAuth();
  const [meta, setMeta] = useState<Meta>(EMPTY_META);
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<ProjectVisibility>("everyone");
  const [isMature, setIsMature] = useState(false);
  const [commentsDisabled, setCommentsDisabled] = useState(false);
  const [license, setLicense] = useState(LICENSE_OPTIONS[0].value);
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [customButtonOpen, setCustomButtonOpen] = useState(false);
  const [customButtonLabel, setCustomButtonLabel] = useState("");
  const [customButtonUrl, setCustomButtonUrl] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editingDates, setEditingDates] = useState<EditingDates>(null);
  const [loadingProject, setLoadingProject] = useState(mode === "edit");
  /** Guards the load below against re-running when Supabase hands back a fresh user object on a
   * token refresh, which would otherwise wipe out unsaved edits mid-session. */
  const loadedEditRef = useRef<string | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const editingId = mode === "edit" ? projectId ?? null : null;

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3400); };

  /** Only the owner may open an existing project; anyone else is bounced to the case study.
   *
   * The ref is both the "already started" guard and the staleness check. It deliberately does
   * NOT use a cleanup flag: under StrictMode the effect runs, is cleaned up, then runs again —
   * a flag would cancel the only in-flight load while the ref made the second run skip
   * re-fetching, leaving the canvas on its loading skeleton forever. */
  useEffect(() => {
    if (!authReady || mode !== "edit" || !projectId) return;
    if (loadedEditRef.current === projectId) return;
    loadedEditRef.current = projectId;

    function apply(item: ContentItem, dates: EditingDates) {
      setEditingDates(dates);
      setMeta({ title: item.title, role: item.role, category: item.category || PROJECT_CATEGORIES[0], coverUrl: item.coverUrl });
      setDescription(item.summary ?? "");
      setTags(item.tags ?? []);
      setVisibility(item.visibility ?? "everyone");
      setIsMature(!!item.isMature);
      setCommentsDisabled(!!item.commentsDisabled);
      setLicense(item.license ?? LICENSE_OPTIONS[0].value);
      setBlocks(item.blocks ?? []);
      setCustomButtonLabel(item.customButtonLabel ?? "");
      setCustomButtonUrl(item.customButtonUrl ?? "");
      setCustomButtonOpen(!!(item.customButtonLabel && item.customButtonUrl));
    }

    setLoadingProject(true);
    void loadProjectForEdit(projectId, user?.id ?? null).then((result) => {
      if (loadedEditRef.current !== projectId) return;
      setLoadingProject(false);
      if (result.forbidden) { notify(result.error ?? ""); router.replace(`/project/${projectId}`); return; }
      if (!result.item) { notify(result.error ?? "Засах төсөл олдсонгүй."); return; }
      apply(result.item, result.dates);
    }).catch((cause: unknown) => {
      if (loadedEditRef.current !== projectId) return;
      setLoadingProject(false);
      notify(cause instanceof Error ? cause.message : "Төслийг ачаалж чадсангүй.");
    });
  }, [authReady, mode, projectId, user, router]);

  function addBlock(type: BlockType, kind?: EmbedKind) {
    setBlocks((all) => [...all, createBlock(type, kind)]);
  }
  function updateBlock(id: string, next: ProjectBlock) {
    setBlocks((all) => all.map((block) => block.id === id ? next : block));
  }
  function removeBlock(id: string) {
    setBlocks((all) => all.filter((block) => block.id !== id));
  }
  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((all) => {
      const index = all.findIndex((block) => block.id === id);
      const target = index + direction;
      if (index === -1 || target < 0 || target >= all.length) return all;
      const next = [...all];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  async function persist(status: ContentStatus) {
    if (supabase && !user) { setAuthOpen(true); notify("Эхлээд нэвтэрнэ үү."); return; }

    const title = meta.title.trim();
    const role = meta.role.trim();
    const cleanedBlocks = cleanBlocksForSave(blocks);
    const summary = description.trim() || deriveSummaryFromBlocks(cleanedBlocks);

    if (!title) {
      setError("Гарчгаа бичнэ үү.");
      notify("Гарчгаа бичнэ үү.");
      return;
    }
    if (!role || !summary) {
      setError("Тохиргоо цонхонд төрлөө бөглөж, дор хаяж нэг текст блок эсвэл тайлбар нэмнэ үү.");
      setSettingsOpen(true);
      notify("Тохиргоо цонхны заавал бөглөх талбаруудыг бөглөнө үү.");
      return;
    }
    setError("");
    setBusy(true);

    const { id, error: saveError } = await saveProject({
      editingId,
      status,
      dates: editingDates,
      author: { id: user?.id ?? null, name: user?.user_metadata.display_name || "Та" },
      draft: {
        title, role, category: meta.category,
        coverUrl: meta.coverUrl.trim() || firstImageFromBlocks(cleanedBlocks) || DEFAULT_PROJECT_COVER,
        summary, blocks: cleanedBlocks,
        buttonLabel: customButtonOpen ? customButtonLabel.trim() : "",
        buttonUrl: customButtonOpen ? customButtonUrl.trim() : "",
        tags, visibility, isMature, commentsDisabled, license,
      },
    });

    setBusy(false);
    if (saveError || !id) { notify(saveError ?? "Хадгалахад алдаа гарлаа."); return; }
    if (status === "published" && visibility === "private") notify("Төсөл хувийн байдлаар хадгалагдлаа (зөвхөн танд харагдана).");
    router.push(`/project/${id}`);
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        void persist("draft");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthBusy(true);
    const result = await runAuthSubmit({ mode: authMode, email: authEmail, password: authPassword, displayName: authName });
    setAuthBusy(false);
    notify(result.message);
    if (result.close) { setAuthOpen(false); setAuthPassword(""); }
  }

  const needsAuth = !!supabase && authReady && !user;

  if (needsAuth || !authReady) {
    return <main className="jobs-page jobs-page-scroll">
      <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />
      {authReady && <div className="job-form-page">
        <div className="job-form-shell">
          <section className="jobs-modal post-modal job-form-card auth-required-card">
            <p className="modal-kicker">{mode === "edit" ? "Бүтээл засах" : "Шинэ бүтээл"}</p>
            <h2>Эхлээд нэвтэрнэ үү</h2>
            <p className="modal-subtitle">Бүтээл нийтлэхийн тулд Project X бүртгэлдээ нэвтэрсэн байх шаардлагатай.</p>
            <button type="button" className="modal-submit" onClick={() => setAuthOpen(true)}>Нэвтрэх <Icon name="arrow" /></button>
          </section>
        </div>
      </div>}
      {authOpen && <AuthDialog
        mode={authMode} onModeChange={setAuthMode}
        name={authName} onNameChange={setAuthName}
        email={authEmail} onEmailChange={setAuthEmail}
        password={authPassword} onPasswordChange={setAuthPassword}
        busy={authBusy}
        subtitle="Бүтээл нийтлэхийн тулд нэвтэрнэ үү."
        onClose={() => setAuthOpen(false)} onSubmit={(event) => void submitAuth(event)}
      />}
      <Toast message={toast} className="jobs-toast" />
    </main>;
  }

  return <main className="editor-page">
    <EditorTopBar backHref={editingId ? `/project/${editingId}` : "/"} editing={mode === "edit"} busy={busy || loadingProject} onPreview={() => setPreviewOpen(true)} onSaveDraft={() => void persist("draft")} onPublish={() => void persist("published")} />

    <div className="editor-body">
      <div className="editor-canvas">
        <div className="editor-canvas-head">
          <input
            className="editor-title-input"
            value={meta.title}
            onChange={(event) => setMeta({ ...meta, title: event.target.value })}
            placeholder="Гарчиг оруулна уу…"
            aria-label="Төслийн гарчиг"
          />
          <button type="button" className="editor-settings-trigger" onClick={() => setSettingsOpen(true)}><Icon name="edit" />Тохиргоо</button>
        </div>
        {error && <p className="form-error editor-canvas-error">{error}</p>}

        {loadingProject
          ? <div className="editor-loading" aria-hidden="true">
              <span className="skeleton skeleton-line" style={{ width: "45%", height: 26 }} />
              <span className="skeleton skeleton-line" style={{ width: "100%", height: 220, borderRadius: 8 }} />
            </div>
          : blocks.length === 0
            ? <section className="block-editor-empty">
                <p className="block-editor-heading">Start building your project:</p>
                <BlockPicker variant="canvas" onAdd={addBlock} />
              </section>
            : <BlockEditorCanvas blocks={blocks} onUpdate={updateBlock} onRemove={removeBlock} onMove={moveBlock} />}
      </div>

      <EditorSidebar
        onAddBlock={addBlock}
        onOpenSettings={() => setSettingsOpen(true)}
        customButtonOpen={customButtonOpen}
        onToggleCustomButton={() => setCustomButtonOpen((open) => !open)}
        customButtonLabel={customButtonLabel} onCustomButtonLabelChange={setCustomButtonLabel}
        customButtonUrl={customButtonUrl} onCustomButtonUrlChange={setCustomButtonUrl}
      />
    </div>

    {settingsOpen && <SettingsModal
      coverUrl={meta.coverUrl} onCoverUrlChange={(value) => setMeta({ ...meta, coverUrl: value })}
      role={meta.role} onRoleChange={(value) => setMeta({ ...meta, role: value })}
      category={meta.category} onCategoryChange={(value) => setMeta({ ...meta, category: value })}
      categories={PROJECT_CATEGORIES}
      tags={tags} onTagsChange={setTags}
      visibility={visibility} onVisibilityChange={setVisibility}
      isMature={isMature} onIsMatureChange={setIsMature}
      description={description} onDescriptionChange={setDescription}
      license={license} onLicenseChange={setLicense}
      commentsDisabled={commentsDisabled} onCommentsDisabledChange={setCommentsDisabled}
      busy={busy}
      onClose={() => setSettingsOpen(false)}
      onSaveDraft={() => void persist("draft")}
      onPublish={() => void persist("published")}
    />}

    {previewOpen && <ProjectPreview
      title={meta.title} role={meta.role} category={meta.category} coverUrl={meta.coverUrl}
      description={description || deriveSummaryFromBlocks(cleanBlocksForSave(blocks))}
      tags={tags} blocks={cleanBlocksForSave(blocks)}
      onClose={() => setPreviewOpen(false)}
    />}

    <Toast message={toast} className="jobs-toast" />
  </main>;
}
