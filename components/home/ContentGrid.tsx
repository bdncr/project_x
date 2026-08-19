import type { ContentItem } from "../../lib/project-samples";
import { ContentCard } from "./ContentCard";

type ContentGridProps = {
  loading: boolean;
  items: ContentItem[];
  currentUserId?: string;
  onToggleLike: (item: ContentItem) => void;
  onToggleSave: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

/** The published-work grid: loading skeleton, real cards, or the empty state — whichever applies. */
export function ContentGrid({ loading, items, currentUserId, onToggleLike, onToggleSave, onEdit, onDelete }: ContentGridProps) {
  if (loading) return <div className="content-grid">
    {Array.from({ length: 8 }).map((_, index) => <article className="content-card" key={index} aria-hidden="true">
      <span className="image-button skeleton" />
      <div className="card-body">
        <span className="skeleton skeleton-line" style={{ width: "35%" }} />
        <span className="skeleton skeleton-line" style={{ width: "80%", height: 14, marginTop: 10 }} />
        <span className="skeleton skeleton-line" style={{ width: "55%", marginTop: 8 }} />
      </div>
    </article>)}
  </div>;

  return <>
    <div className="content-grid">{items.map((item) => <ContentCard key={item.id} item={item} isOwner={item.ownerId === currentUserId} onToggleLike={onToggleLike} onToggleSave={onToggleSave} onEdit={onEdit} onDelete={onDelete} />)}</div>
    {items.length === 0 && <div className="empty-state"><h3>Илэрц алга</h3><p>Шинэ бүтээл нийтлээд эхлээрэй.</p></div>}
  </>;
}
