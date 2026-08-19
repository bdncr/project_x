import Link from "next/link";
import { Icon } from "../Icon";
import type { ContentItem } from "../../lib/project-samples";
import { compactNumber } from "../../lib/format";

type ContentCardProps = {
  item: ContentItem;
  isOwner: boolean;
  onToggleLike: (item: ContentItem) => void;
  onToggleSave: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

export function ContentCard({ item, isOwner, onToggleLike, onToggleSave, onEdit, onDelete }: ContentCardProps) {
  return <article className="content-card">
    <Link href={`/project/${item.id}`} className="image-button">
      <img src={item.coverUrl} alt="" />
      <span className={item.status === "published" ? "status published" : "status"}>{item.status === "published" ? "Нийтэлсэн" : "Ноорог"}</span>
    </Link>
    <div className="card-body">
      <div className="card-topline"><p>{item.category}</p><button className={item.saved ? "icon-action active" : "icon-action"} onClick={() => onToggleSave(item)}><Icon name="save" /></button></div>
      <h3>{item.title}</h3>
      <span>{item.creator} · {item.role}</span>
      <div className="card-stats">
        <button className={item.liked ? "liked" : ""} onClick={() => onToggleLike(item)}><Icon name="heart" /> {compactNumber(item.likes)}</button>
        <span><Icon name="eye" /> {compactNumber(item.views)}</span>
      </div>
      {isOwner && <div className="card-actions">
        <button onClick={() => onEdit(item)}><Icon name="edit" /> Засах</button>
        <button className="danger-button" onClick={() => onDelete(item)}><Icon name="trash" /> Устгах</button>
      </div>}
    </div>
  </article>;
}
