import Link from "next/link";
import { Icon } from "../../Icon";

type EditorTopBarProps = {
  backHref: string;
  busy: boolean;
  /** True when an existing project is open (/project/<id>?edit=1) rather than a new one,
   * which relabels the primary action from "publish" to "update". */
  editing?: boolean;
  onPreview: () => void;
  onSaveDraft: () => void;
  onPublish: () => void;
};

/** A focused, distraction-free top bar replacing the normal site header while composing
 * a project — mirrors the reference editor's fixed back/brand/Preview/Save-as-Draft/
 * Publish bar (EditorNav-nav-F_j: circular back button, wordmark, right-aligned actions). */
export function EditorTopBar({ backHref, busy, editing = false, onPreview, onSaveDraft, onPublish }: EditorTopBarProps) {
  return <header className="editor-topbar">
    <Link href={backHref} className="editor-topbar-back" aria-label="Буцах"><Icon name="arrow" /></Link>
    <Link href="/" className="brand"><span>Project</span><b>X</b></Link>
    <div className="editor-topbar-actions">
      <button type="button" className="editor-preview-btn" onClick={onPreview}><Icon name="eye" />Урьдчилан үзэх</button>
      <button type="button" className="editor-draft-btn" disabled={busy} onClick={onSaveDraft}>Ноорог хадгалах</button>
      <button type="button" className="editor-publish-btn" disabled={busy} onClick={onPublish}>{busy ? "Хадгалж байна…" : editing ? "Шинэчлэх" : "Нийтлэх"}</button>
    </div>
  </header>;
}
