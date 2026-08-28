import { Icon } from "../../Icon";
import { BlockRenderer } from "../BlockRenderer";
import type { ProjectBlock } from "../../../lib/project-editor";

type ProjectPreviewProps = {
  title: string;
  role: string;
  category: string;
  coverUrl: string;
  description: string;
  tags: string[];
  blocks: ProjectBlock[];
  onClose: () => void;
};

const FALLBACK_COVER = "https://images.unsplash.com/photo-1541961017774-22349e4a1262?auto=format&fit=crop&w=1600&q=88";

/** A read-only, client-side "what will this look like" overlay — mirrors the reference
 * editor's Preview button. Reuses BlockRenderer (the same component the public detail
 * page renders body_blocks with) so this never drifts out of sync with the real page. */
export function ProjectPreview({ title, role, category, coverUrl, description, tags, blocks, onClose }: ProjectPreviewProps) {
  return <div className="preview-overlay">
    <button type="button" className="preview-close" onClick={onClose}><Icon name="close" /> Урьдчилан үзэхээс гарах</button>
    <div className="preview-scroll">
      <div className="preview-hero"><img src={coverUrl || FALLBACK_COVER} alt="" /></div>
      <div className="preview-body">
        <p className="preview-kicker">{role}{category ? ` · ${category}` : ""}</p>
        <h1>{title || "Нэргүй төсөл"}</h1>
        {description && <p className="preview-description">{description}</p>}
        {tags.length > 0 && <div className="preview-tags">{tags.map((tag) => <span key={tag}>{tag}</span>)}</div>}
        <div className="case-body-blocks"><BlockRenderer blocks={blocks} /></div>
      </div>
    </div>
  </div>;
}
