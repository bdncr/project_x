import Link from "next/link";
import { Icon } from "../Icon";
import type { ContentItem } from "../../lib/project-samples";
import { compactNumber, formatDate } from "../../lib/format";

type AppreciateFooterProps = {
  item: ContentItem;
  initial: string;
  commentCount: number;
  onToggleLike: () => void;
  following: boolean;
  onToggleFollow: () => void;
  related: ContentItem[];
};

/** The bottom-anchored title/stats/owner block, matching the reference case-study
 * layout where appreciation and credits sit after the work rather than above it. */
export function AppreciateFooter({ item, initial, commentCount, onToggleLike, following, onToggleFollow, related }: AppreciateFooterProps) {
  return <section className="case-footer-block">
    <div className="case-appreciate-cta">
      <button type="button" className={item.liked ? "case-appreciate-btn liked" : "case-appreciate-btn"} onClick={onToggleLike} aria-label="Талархал илгээх"><Icon name="heart" /></button>
      <h1>{item.title}</h1>
      <div className="case-stats-row">
        <span><Icon name="heart" />{compactNumber(item.likes)}</span>
        <span><Icon name="eye" />{compactNumber(item.views)}</span>
        <span><Icon name="comment" />{commentCount}</span>
      </div>
      <p className="case-published">Нийтэлсэн: {formatDate(item.createdAt)}</p>
      {item.customButtonLabel && item.customButtonUrl && /^https?:\/\//i.test(item.customButtonUrl) && <a className="case-custom-btn" href={item.customButtonUrl} target="_blank" rel="noopener noreferrer">{item.customButtonLabel}<Icon name="arrow" /></a>}
    </div>

    <div className="case-divider dark" />

    <div className="case-owner-card">
      <span className="account-avatar large">{initial}</span>
      <div><strong>{item.creator}</strong><span>{item.role}</span></div>
      <button type="button" className={following ? "case-follow active" : "case-follow"} onClick={onToggleFollow}>{following ? "Дагасан" : "Дагах"}</button>
    </div>

    {related.length > 0 && <div className="case-strip-wrap">
      <h2>{item.creator}-ийн бусад бүтээл</h2>
      <div className="case-strip">{related.map((project) => <Link key={project.id} href={`/project/${project.id}`} className="case-strip-card">
        <img src={project.coverUrl} alt="" />
        <span>{project.title}</span>
      </Link>)}</div>
    </div>}
  </section>;
}
