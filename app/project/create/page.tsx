"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { AuthDialog, AuthMode } from "../../../components/AuthDialog";
import { Toast } from "../../../components/Toast";
import { Icon } from "../../../components/Icon";
import { EditorTopBar } from "../../../components/project/editor/EditorTopBar";
import { EditorSidebar } from "../../../components/project/editor/EditorSidebar";
import { BlockPicker } from "../../../components/project/editor/BlockPicker";
import { BlockEditorCanvas } from "../../../components/project/editor/BlockEditorCanvas";
import { SimpleProjectForm } from "../../../components/project/editor/SimpleProjectForm";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../lib/AuthProvider";
import { ContentItem, ContentStatus, addLocalProject } from "../../../lib/project-samples";
import { ProjectBlock, BlockType, EmbedKind, createBlock, cleanBlocksForSave, deriveSummaryFromBlocks, firstImageFromBlocks } from "../../../lib/project-editor";

type Mode = "rich" | "simple";
type Meta = { title: string; role: string; category: string; coverUrl: string; status: ContentStatus };

const CATEGORIES = ["Брэнд", "График", "Гэрэл зураг", "Зураглал", "UX/UI", "3D", "Motion"];
const DEFAULT_COVER = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1200&q=88";
const EMPTY_META: Meta = { title: "", role: "", category: CATEGORIES[0], coverUrl: "", status: "published" };

export default function CreateProjectPage() {
  const router = useRouter();
  const { user, authReady } = useAuth();
  const [mode, setMode] = useState<Mode>("rich");
  const [meta, setMeta] = useState<Meta>(EMPTY_META);
  const [blocks, setBlocks] = useState<ProjectBlock[]>([]);
  const [simpleSummary, setSimpleSummary] = useState("");
  const [customButtonOpen, setCustomButtonOpen] = useState(false);
  const [customButtonLabel, setCustomButtonLabel] = useState("");
  const [customButtonUrl, setCustomButtonUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("signin");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const metaRef = useRef<HTMLDivElement>(null);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 3400); };

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
    const cleanedBlocks = mode === "rich" ? cleanBlocksForSave(blocks) : [];
    const summary = mode === "simple" ? simpleSummary.trim() : deriveSummaryFromBlocks(cleanedBlocks);

    if (!title || !role || !summary) {
      setError(mode === "simple" ? "Гарчиг, төрөл, тайлбарыг бөглөнө үү." : "Гарчиг, төрлийг бөглөж, дор хаяж нэг текст блок нэмнэ үү.");
      metaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setError("");
    setBusy(true);
    const coverUrl = meta.coverUrl.trim() || firstImageFromBlocks(cleanedBlocks) || DEFAULT_COVER;
    const buttonLabel = customButtonOpen ? customButtonLabel.trim() : "";
    const buttonUrl = customButtonOpen ? customButtonUrl.trim() : "";

    if (supabase && user) {
      const payload = {
        title, role, category: meta.category, cover_url: coverUrl, description: summary,
        is_published: status === "published", published_at: status === "published" ? new Date().toISOString() : null,
        body_blocks: cleanedBlocks, custom_button_label: buttonLabel || null, custom_button_url: buttonUrl || null,
      };
      const { data, error: insertError } = await supabase.from("projects").insert({ ...payload, owner_id: user.id }).select("id").single();
      setBusy(false);
      if (insertError) { notify(insertError.message); return; }
      router.push(`/project/${data.id}`);
      return;
    }

    const localItem: ContentItem = {
      id: `local-${Date.now()}`, ownerId: user?.id ?? "local", title,
      creator: user?.user_metadata.display_name || "Та", role, category: meta.category,
      summary, coverUrl, likes: 0, views: 0, saved: false, liked: false, status,
      createdAt: new Date().toISOString(), blocks: cleanedBlocks,
      customButtonLabel: buttonLabel || undefined, customButtonUrl: buttonUrl || undefined,
    };
    addLocalProject(localItem);
    setBusy(false);
    router.push(`/project/${localItem.id}`);
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
    if (!supabase) return;
    setAuthBusy(true);
    const response = authMode === "signin"
      ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
      : await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { data: { display_name: authName.trim() } } });
    setAuthBusy(false);
    if (response.error) { notify(response.error.message); return; }
    if (authMode === "signup" && !response.data.session) { notify("Баталгаажуулах имэйлээ шалгаад нэвтэрнэ үү."); return; }
    setAuthOpen(false);
    setAuthPassword("");
    notify(authMode === "signin" ? "Амжилттай нэвтэрлээ." : "Бүртгэл амжилттай үүслээ.");
  }

  const needsAuth = !!supabase && authReady && !user;

  if (needsAuth || !authReady) {
    return <main className="jobs-page">
      <SiteHeader activePage="explore" onLogin={() => setAuthOpen(true)} />
      {authReady && <div className="job-form-page">
        <div className="job-form-shell">
          <section className="jobs-modal post-modal job-form-card auth-required-card">
            <p className="modal-kicker">Шинэ бүтээл</p>
            <h2>Эхлээд нэвтэрнэ үү</h2>
            <p className="modal-subtitle">Бүтээл нийтлэхийн тулд Project X бүртгэлдээ нэвтэрсэн байх шаардлагатай.</p>
            <button type="button" className="modal-submit" onClick={() => setAuthOpen(true)}>Нэвтрэх <Icon name="arrow" /></button>
          </section>
        </div>
      </div>}
      {authOpen && <AuthDialog
        variant="jobs"
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
    <EditorTopBar backHref="/" busy={busy} onSaveDraft={() => void persist("draft")} onPublish={() => void persist("published")} />

    <div className="editor-body">
      <div className="editor-canvas">
        <div className="mode-toggle">
          <button type="button" className={mode === "rich" ? "active" : ""} onClick={() => setMode("rich")}>Дэлгэрэнгүй засварлагч</button>
          <button type="button" className={mode === "simple" ? "active" : ""} onClick={() => setMode("simple")}>Энгийн маягт</button>
        </div>

        <section className="jobs-modal post-modal job-form-card project-meta-card" ref={metaRef}>
          <p className="modal-kicker">Төслийн мэдээлэл</p>
          <h2>Тохиргоо</h2>
          <div className="post-form-grid">
            <label>Гарчиг<input value={meta.title} onChange={(event) => setMeta({ ...meta, title: event.target.value })} placeholder="Жишээ: Nomad Coffee — брэндийн айдентик" /></label>
            <label>Төрөл<input value={meta.role} onChange={(event) => setMeta({ ...meta, role: event.target.value })} placeholder="UX/UI, зураглал..." /></label>
            <label>Ангилал<select value={meta.category} onChange={(event) => setMeta({ ...meta, category: event.target.value })}>{CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
            <label>Нүүр зургийн URL <span>(заавал биш)</span><input value={meta.coverUrl} onChange={(event) => setMeta({ ...meta, coverUrl: event.target.value })} placeholder="https://..." /></label>
          </div>
          {mode === "simple" && <SimpleProjectForm summary={simpleSummary} onSummaryChange={setSimpleSummary} />}
          {error && <p className="form-error">{error}</p>}
        </section>

        {mode === "rich" && (blocks.length === 0 ? <section className="block-editor-empty">
          <p className="block-editor-heading">Start building your project:</p>
          <BlockPicker variant="canvas" onAdd={addBlock} />
        </section> : <BlockEditorCanvas blocks={blocks} onUpdate={updateBlock} onRemove={removeBlock} onMove={moveBlock} />)}
      </div>

      <EditorSidebar
        mode={mode}
        onAddBlock={addBlock}
        onScrollToSettings={() => metaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
        customButtonOpen={customButtonOpen}
        onToggleCustomButton={() => setCustomButtonOpen((open) => !open)}
        customButtonLabel={customButtonLabel} onCustomButtonLabelChange={setCustomButtonLabel}
        customButtonUrl={customButtonUrl} onCustomButtonUrlChange={setCustomButtonUrl}
      />
    </div>

    <Toast message={toast} className="jobs-toast" />
  </main>;
}
