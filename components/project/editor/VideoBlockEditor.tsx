import { normalizeVideoEmbedUrl } from "../../../lib/project-editor";

type VideoBlockEditorProps = { url: string; onChange: (url: string) => void };

export function VideoBlockEditor({ url, onChange }: VideoBlockEditorProps) {
  const embedSrc = url ? normalizeVideoEmbedUrl(url) : null;

  return <div className="block-field-group">
    <label>Видео холбоос (YouTube, Vimeo)<input value={url} onChange={(event) => onChange(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." /></label>
    {url && !embedSrc && <p className="block-hint">Танигдахгүй холбоос байна — YouTube эсвэл Vimeo холбоос ашиглана уу.</p>}
    {embedSrc && <div className="block-embed-frame"><iframe src={embedSrc} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen /></div>}
  </div>;
}
