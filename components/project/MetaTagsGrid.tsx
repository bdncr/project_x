import Link from "next/link";
import { Icon } from "../Icon";

type MetaTagsGridProps = {
  initial: string;
  creator: string;
  role: string;
  category: string;
  tools: string[];
  createdAt: string;
};

/** The closing tags/tools/owner grid — creative-field chips, plain keyword pills, and a hire card. */
export function MetaTagsGrid({ initial, creator, role, category, tools, createdAt }: MetaTagsGridProps) {
  return <section className="case-light-section">
    <div className="case-meta-grid">
      <div className="case-meta-card">
        <p className="case-meta-label">БҮТЭЭГЧ</p>
        <div className="case-meta-owner-row"><span className="account-avatar">{initial}</span><div><strong>{creator}</strong><span>{role}</span></div></div>
        <Link href="/hire/jobs/create" className="case-hire-btn"><Icon name="mail" />Ажилд урих</Link>
      </div>
      <div className="case-meta-card" id="case-tools-card">
        <p className="case-meta-label">ХЭРЭГСЭЛ</p>
        <div className="case-field-tags">{tools.map((tool) => <span key={tool}>{tool}</span>)}</div>
      </div>
      <div className="case-meta-card">
        <p className="case-meta-label">ТӨРӨЛ</p>
        <div className="case-plain-tags"><span>{category}</span>{tools.slice(0, 4).map((tool) => <span key={tool}>{tool}</span>)}</div>
      </div>
    </div>
    <p className="case-copyright">© {new Date(createdAt).getFullYear()} {creator}. Бүх эрх хуулиар хамгаалагдсан.</p>
  </section>;
}
