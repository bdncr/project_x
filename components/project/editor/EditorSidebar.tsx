import { Icon } from "../../Icon";
import { BlockPicker } from "./BlockPicker";
import type { BlockType, EmbedKind } from "../../../lib/project-editor";

type EditorSidebarProps = {
  mode: "rich" | "simple";
  onAddBlock: (type: BlockType, kind?: EmbedKind) => void;
  onScrollToSettings: () => void;
  customButtonOpen: boolean;
  onToggleCustomButton: () => void;
  customButtonLabel: string;
  onCustomButtonLabelChange: (value: string) => void;
  customButtonUrl: string;
  onCustomButtonUrlChange: (value: string) => void;
};

/** The persistent right rail — mirrors the reference editor's Add Content / Edit
 * Project / Custom Button / Attach Assets / Advanced Settings stack. Custom Button is
 * genuinely wired up (renders on the published project); Attach Assets and Advanced
 * Settings are kept visible for layout fidelity but marked "тун удахгүй" — they'd need
 * file storage and a paid tier this app doesn't have, and a fake "free trial" link would
 * be actively misleading. */
export function EditorSidebar({ mode, onAddBlock, onScrollToSettings, customButtonOpen, onToggleCustomButton, customButtonLabel, onCustomButtonLabelChange, customButtonUrl, onCustomButtonUrlChange }: EditorSidebarProps) {
  return <aside className="editor-sidebar">
    <div className="sidebar-card">
      <p className="sidebar-heading">Агуулга нэмэх</p>
      {mode === "rich" ? <BlockPicker variant="sidebar" onAdd={onAddBlock} /> : <p className="sidebar-hint">Блок нэмэхийн тулд &quot;Дэлгэрэнгүй засварлагч&quot; горимд шилжинэ үү.</p>}
    </div>

    <div className="sidebar-card">
      <p className="sidebar-heading">Төслийг засах</p>
      <div className="sidebar-edit-project">
        <button type="button" className="sidebar-edit-item" disabled title="Тун удахгүй"><Icon name="spark" /><span>Загвар</span></button>
        <button type="button" className="sidebar-edit-item" onClick={onScrollToSettings}><Icon name="edit" /><span>Тохиргоо</span></button>
      </div>
      <button type="button" className="sidebar-pill-btn" onClick={onToggleCustomButton}>Захиалгат товч</button>
      <p className="sidebar-caption">Төслийн хуудсан дээр гарах call-to-action товчоо тохируулна уу</p>
      {customButtonOpen && <div className="sidebar-inline-form">
        <label>Товчны бичвэр<input value={customButtonLabel} onChange={(event) => onCustomButtonLabelChange(event.target.value)} placeholder="Жишээ: Вэбсайт үзэх" /></label>
        <label>Холбоос<input value={customButtonUrl} onChange={(event) => onCustomButtonUrlChange(event.target.value)} placeholder="https://..." /></label>
      </div>}
    </div>

    <div className="sidebar-card">
      <button type="button" className="sidebar-pill-btn" disabled title="Тун удахгүй"><Icon name="paperclip" />Файл хавсаргах</button>
      <p className="sidebar-caption">Фонт, зураг, zip зэрэг файлыг үнэгүй эсвэл худалдаж авах хэлбэрээр хавсаргах боломж тун удахгүй нэмэгдэнэ.</p>
    </div>

    <div className="sidebar-card sidebar-advanced">
      <p className="sidebar-heading">Дэвшилтэт тохиргоо <span className="sidebar-soon-badge">УДАХГҮЙ</span></p>
      <div className="sidebar-advanced-row"><Icon name="clock" /><div><strong>Хуваарьт нийтлэл</strong><span>Нийтлэх огноо, цагаа урьдчилан тохируулах</span></div></div>
      <div className="sidebar-advanced-row"><Icon name="lock" /><div><strong>Нууц үгээр хамгаалах</strong><span>Зөвхөн нууц үгтэй хүн үзэх боломжтой</span></div></div>
      <div className="sidebar-advanced-row"><Icon name="link" /><div><strong>Зөвхөн холбоосоор</strong><span>Онцгой холбоосоор хуваалцах</span></div></div>
    </div>

    <div className="sidebar-tip">Ноорог хадгалахын тулд хэдийд ч <b>Ctrl/Cmd + S</b> дарна уу.</div>
  </aside>;
}
