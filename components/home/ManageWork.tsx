import { Icon } from "../Icon";
import type { ContentItem } from "../../lib/project-samples";
import { compactNumber } from "../../lib/format";

type ManageWorkProps = {
  isLoggedIn: boolean;
  items: ContentItem[];
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

/** "My work" section: the signed-in creator's own projects with quick edit/delete actions. */
export function ManageWork({ isLoggedIn, items, onEdit, onDelete }: ManageWorkProps) {
  return <section id="manage" className="manage-section">
    <div className="section-title"><p>My work</p><h2>Миний бүтээл</h2></div>
    {!isLoggedIn ? <div className="empty-state"><p>Нэвтэрсний дараа та өөрийн бүтээлээ энд удирдана.</p></div> : <div className="manage-list">
      {items.map((item) => <article key={item.id} className="manage-row">
        <img src={item.coverUrl} alt="" />
        <div><h3>{item.title}</h3><p>{item.category} · {item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</p></div>
        <span>{compactNumber(item.likes)} талархал</span>
        <button onClick={() => onEdit(item)}><Icon name="edit" /></button>
        <button className="danger-icon" onClick={() => onDelete(item)}><Icon name="trash" /></button>
      </article>)}
      {items.length === 0 && <div className="empty-state"><p>Таны нийтэлсэн бүтээл алга байна.</p></div>}
    </div>}
  </section>;
}
