import type { ProjectBlock } from "../../lib/project-editor";
import { extractEmbedUrl, normalizeVideoEmbedUrl, sanitizeRichText } from "../../lib/project-editor";

/** Read-only rendering of a project's rich block content on the public detail page.
 * Re-sanitizes text blocks at render time rather than trusting the editor's save-time
 * pass alone — a row read back from the backend could in principle have been written
 * by something other than this app's editor. */
export function BlockRenderer({ blocks }: { blocks: ProjectBlock[] }) {
  return <div className="block-render">
    {blocks.map((block) => {
      switch (block.type) {
        case "text":
          return block.html ? <div key={block.id} className="block-render-text" dangerouslySetInnerHTML={{ __html: sanitizeRichText(block.html) }} /> : null;
        case "image":
          return block.url ? <figure key={block.id} className="block-render-image"><img src={block.url} alt={block.caption} />{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : null;
        case "photo_grid": {
          const urls = block.urls.filter(Boolean);
          return urls.length ? <div key={block.id} className="block-render-grid">{urls.map((url, index) => <img key={index} src={url} alt="" />)}</div> : null;
        }
        case "video": {
          const src = normalizeVideoEmbedUrl(block.url);
          return src ? <div key={block.id} className="block-embed-frame"><iframe src={src} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div> : null;
        }
        case "embed": {
          const src = block.url ? extractEmbedUrl(block.url) : "";
          return src ? <div key={block.id} className="block-embed-frame"><iframe src={src} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" /></div> : null;
        }
      }
    })}
  </div>;
}
