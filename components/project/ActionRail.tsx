import Link from "next/link";
import { Icon } from "../Icon";

type ActionRailProps = {
  initial: string;
  following: boolean;
  onToggleFollow: () => void;
  saved: boolean;
  onToggleSave: () => void;
  liked: boolean;
  onToggleLike: () => void;
  onShare: () => void;
};

/** The fixed vertical action rail (Follow / Hire / Tools / Save / Share / Appreciate) that
 * tracks the page on desktop and collapses into a horizontal bar on narrow screens. */
export function ActionRail({ initial, following, onToggleFollow, saved, onToggleSave, liked, onToggleLike, onShare }: ActionRailProps) {
  return <aside className="case-rail" aria-label="Төслийн үйлдлүүд">
    <button type="button" className="case-rail-item case-rail-follow" onClick={onToggleFollow}>
      <span className={following ? "account-avatar case-rail-avatar following" : "account-avatar case-rail-avatar"}>{initial}</span>
      <small>{following ? "Дагасан" : "Дагах"}</small>
    </button>
    <Link href="/hire/jobs/create" className="case-rail-item"><span className="case-rail-icon"><Icon name="mail" /></span><small>Урих</small></Link>
    <a href="#case-tools-card" className="case-rail-item"><span className="case-rail-icon"><Icon name="briefcase" /></span><small>Хэрэгсэл</small></a>
    <button type="button" className="case-rail-item" onClick={onToggleSave}><span className={saved ? "case-rail-icon active" : "case-rail-icon"}><Icon name={saved ? "bookmarkFill" : "bookmark"} /></span><small>Хадгалах</small></button>
    <button type="button" className="case-rail-item" onClick={onShare}><span className="case-rail-icon"><Icon name="upload" /></span><small>Хуваалцах</small></button>
    <button type="button" className="case-rail-item case-rail-appreciate" onClick={onToggleLike}><span className={liked ? "case-rail-big liked" : "case-rail-big"}><Icon name="heart" /></span><small>Талархах</small></button>
  </aside>;
}
