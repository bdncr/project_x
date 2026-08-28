import Link from "next/link";
import { Icon } from "../Icon";
import { CreatorHoverCard } from "./CreatorHoverCard";
import { ToolsHoverCard } from "./ToolsHoverCard";

type ActionRailProps = {
  initial: string;
  /** Identifies the creator for the hover card: the owner uuid for a backend project, or
   * "seed"/"local" for the demo dataset, where the name is the only usable key. */
  ownerId: string;
  creatorName: string;
  creatorRole: string;
  /** Feeds the Tools hover panel; the same list the closing tools card renders. */
  tools: string[];
  onInvite: () => void;
  following: boolean;
  onToggleFollow: () => void;
  /** True when the signed-in visitor owns this project — the rail then offers Edit and Delete
   * where everyone else gets Save, mirroring the owner swap on the gallery cards
   * (components/home/ContentCard.tsx). */
  isOwner: boolean;
  editHref: string;
  deleting: boolean;
  onDelete: () => void;
  saved: boolean;
  onToggleSave: () => void;
  liked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
};

/** The fixed vertical action rail (Follow / Hire / Tools / Save / Share / Appreciate) that
 * tracks the page on desktop and collapses into a horizontal bar on narrow screens. */
export function ActionRail({ initial, ownerId, creatorName, creatorRole, tools, onInvite, following, onToggleFollow, isOwner, editHref, deleting, onDelete, saved, onToggleSave, liked, onToggleLike, onShare }: ActionRailProps) {
  return <aside className="case-rail" aria-label="Төслийн үйлдлүүд">
     {isOwner
      ? <></>
      :    <CreatorHoverCard ownerId={ownerId} name={creatorName} role={creatorRole} initial={initial} following={following} onToggleFollow={onToggleFollow} onInvite={onInvite} />

      } 
    <button type="button" className="case-rail-item" onClick={onInvite}><span className="case-rail-icon"><Icon name="mail" /></span><small>Ажлын санал</small></button>
    <ToolsHoverCard tools={tools} />
    {isOwner
      ? <>
          <Link href={editHref} className="case-rail-item"><span className="case-rail-icon"><Icon name="edit" /></span><small>Засах</small></Link>
          <button type="button" className="case-rail-item" disabled={deleting} onClick={onDelete}>
            <span className="case-rail-icon case-rail-danger"><Icon name="trash" /></span>
            <small>{deleting ? "Устгаж…" : "Устгах"}</small>
          </button>
        </>
      : <button type="button" className="case-rail-item" onClick={onToggleSave}><span className={saved ? "case-rail-icon active" : "case-rail-icon"}><Icon name={saved ? "bookmarkFill" : "bookmark"} /></span><small>Хадгалах</small></button>}
    <button type="button" className="case-rail-item" onClick={onShare}><span className="case-rail-icon"><Icon name="upload" /></span><small>Хуваалцах</small></button>
    <button type="button" className="case-rail-item case-rail-appreciate" onClick={onToggleLike}><span className={liked ? "case-rail-big liked" : "case-rail-big"}><Icon name="heart" /></span><small>Талархах</small></button>
  </aside>;
}
