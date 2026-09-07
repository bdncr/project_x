import type { FormEvent } from "react";
import { Icon } from "../Icon";
import type { ContentStatus } from "../../lib/project-samples";

export type ContentForm = { title: string; role: string; category: string; summary: string; coverUrl: string; status: ContentStatus };

type ShareWorkFormProps = {
  form: ContentForm;
  onFormChange: (form: ContentForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
  /** Selectable categories, excluding the "all" pseudo-category shown in the explore rail. */
  categories: string[];
  defaultCover: string;
  previewCreatorLabel: string;
};

/** The quick way to post a piece: title, cover and a summary, no block editor. Editing is
 * deliberately not offered here — /project/[id]?edit=1 is the one place a project is edited,
 * so a piece built out of blocks can never be reopened in a form that cannot show them. */
export function ShareWorkForm({ form, onFormChange, onSubmit, isLoggedIn, onRequestLogin, categories, defaultCover, previewCreatorLabel }: ShareWorkFormProps) {
  return <section id="share" className="editor-section">
    <div className="section-title"><p>Share Work</p><h2>Шинэ бүтээл нэмэх</h2></div>
    {!isLoggedIn && <div className="auth-hint"><p>Бүтээл оруулахын тулд нэвтэрсэн байх шаардлагатай.</p><button onClick={onRequestLogin}>Нэвтрэх / Бүртгүүлэх</button></div>}
    <form className="editor-card" onSubmit={onSubmit}>
      <label>Гарчиг<input value={form.title} onChange={(event) => onFormChange({ ...form, title: event.target.value })} /></label>
      <label>Төрөл<input value={form.role} onChange={(event) => onFormChange({ ...form, role: event.target.value })} placeholder="UX/UI, зураглал..." /></label>
      <label>Ангилал<select value={form.category} onChange={(event) => onFormChange({ ...form, category: event.target.value })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label>Төлөв<select value={form.status} onChange={(event) => onFormChange({ ...form, status: event.target.value as ContentStatus })}><option value="published">Нийтлэх</option><option value="draft">Ноорог</option></select></label>
      <label className="wide-field">Зургийн URL<input value={form.coverUrl} onChange={(event) => onFormChange({ ...form, coverUrl: event.target.value })} placeholder="https://..." /></label>
      <label className="wide-field">Тайлбар<textarea value={form.summary} onChange={(event) => onFormChange({ ...form, summary: event.target.value })} rows={5} /></label>
      <div className="preview-panel"><div className="mini-preview"><img src={form.coverUrl || defaultCover} alt="" /><p>{form.title || "Гарчиг харагдана"}</p><span>{previewCreatorLabel} · {form.category}</span></div></div>
      <div className="form-actions wide-field">
        <button type="submit"><Icon name="upload" /> Нийтлэх</button>
      </div>
    </form>
  </section>;
}
