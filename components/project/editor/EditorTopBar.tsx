import Link from "next/link";
import { Icon } from "../../Icon";

type EditorTopBarProps = {
  backHref: string;
  busy: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
};

/** A focused, distraction-free top bar replacing the normal site header while composing
 * a project — mirrors the reference editor's back/brand/Save-as-Draft/Publish bar. */
export function EditorTopBar({ backHref, busy, onSaveDraft, onPublish }: EditorTopBarProps) {
  return <header className="editor-topbar">
    <Link href={backHref} className="editor-topbar-back" aria-label="Буцах"><Icon name="arrow" /></Link>
    <Link href="/" className="brand"><span>Project</span><b>X</b></Link>
    <div className="editor-topbar-actions">
      <button type="button" className="editor-draft-btn" disabled={busy} onClick={onSaveDraft}>Ноорог хадгалах</button>
      <button type="button" className="editor-publish-btn" disabled={busy} onClick={onPublish}>{busy ? "Хадгалж байна…" : "Нийтлэх"}</button>
    </div>
  </header>;
}
