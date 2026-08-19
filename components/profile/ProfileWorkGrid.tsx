import Link from "next/link";
import type { ProfileWork } from "../../lib/profile-work";
import { compactNumber } from "../../lib/format";
import { Icon } from "../Icon";

type ProfileWorkGridProps = {
  works: ProfileWork[];
  emptyTitle: string;
  emptyText: string;
};

export function ProfileWorkGrid({ works, emptyTitle, emptyText }: ProfileWorkGridProps) {
  if (works.length === 0) return <div className="empty-state">
    <h3>{emptyTitle}</h3>
    <p>{emptyText}</p>
  </div>;

  return <div className="profile-work-grid">
    {works.map((work) => <Link key={work.id} href={`/project/${work.id}`} className="profile-work-card">
      <span className="profile-work-thumb"><img src={work.coverUrl} alt="" /></span>
      <span className="profile-work-title">{work.title}</span>
      <span className="profile-work-role">{work.role} · {work.category}</span>
      <span className="profile-work-meta">
        <span><Icon name="heart" />{compactNumber(work.likes)}</span>
        <span><Icon name="eye" />{compactNumber(work.views)}</span>
      </span>
    </Link>)}
  </div>;
}
