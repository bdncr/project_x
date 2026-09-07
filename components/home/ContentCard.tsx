import Link from "next/link";
import { Icon } from "../Icon";
import type { ContentItem } from "../../lib/project-samples";
import { creatorProfileId } from "../../lib/creator-samples";
import { compactNumber } from "../../lib/format";

type ContentCardProps = {
  item: ContentItem;
  isOwner: boolean;
  onToggleLike: (item: ContentItem) => void;
  onToggleSave: (item: ContentItem) => void;
  onEdit: (item: ContentItem) => void;
  onDelete: (item: ContentItem) => void;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Backend rows carry the owner's real profile id; demo rows are stamped "seed" and have to
 * be matched back by name. Either way the result is whatever /profile/[id] can resolve. */
function profileIdFor(item: ContentItem): string | null {
  return UUID_RE.test(item.ownerId) ? item.ownerId : creatorProfileId(item.creator);
}

export function ContentCard({ item, isOwner, onToggleLike, onToggleSave, onEdit, onDelete }: ContentCardProps) {
  const profileId = profileIdFor(item);
  const creator = <>
    <span className="account-avatar card-avatar">{item.creator.slice(0, 1).toUpperCase()}</span>
    <span>{item.creator}</span>
  </>;

  return <article className="content-card">
    <div className="card-media">
      <Link href={`/project/${item.id}`} className="image-button">
        <img src={item.coverUrl} alt="" />
      </Link>
      {/* A private project is visible to its owner alone, so the badge is a reminder of why
          nobody else is seeing it — not a control. Sits opposite the quick action so the two
          never overlap. */}
      {item.visibility === "private" && <span className="card-private" title="Хувийн — зөвхөн танд харагдана">
        <Icon name="lock" />Хувийн
      </span>}
      {/* Sibling of the cover link rather than a child of it: a <button> nested inside an
          <a> is invalid, and the action would also navigate. It sits in the cover's top-right
          corner and fades in with the rest of the hover layer. Saving your own work is
          pointless, so that corner offers Edit instead when you own the piece. */}
      {isOwner
        ? <button className="card-quick-action icon-action" title="Засах" onClick={() => onEdit(item)}>
            <Icon name="edit" />
          </button>
        : <button
            className={item.saved ? "card-quick-action icon-action active" : "card-quick-action icon-action"}
            title="Хадгалах"
            onClick={() => onToggleSave(item)}
          >
            <Icon name="save" />
          </button>}
      {/* The overlay ignores pointer events so a click anywhere on it still falls through
          to the cover link underneath. */}
      <div className="card-hover">
        <p>{item.category}</p>
        <h3>{item.title}</h3>
      </div>
    </div>
    <div className="card-body">
      
      {profileId
        ? <Link href={`/profile/${encodeURIComponent(profileId)}`} className="card-creator">{creator}</Link>
        : <span className="card-creator">{creator}</span>}
      <div className="card-stats">
        <button className={item.liked ? "liked" : ""} onClick={() => onToggleLike(item)}><Icon name="heart" /> {compactNumber(item.likes)}</button>
        <span><Icon name="eye" /> {compactNumber(item.views)}</span>
      </div>
    
    </div>
  </article>;
}
