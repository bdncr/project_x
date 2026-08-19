import { extractEmbedUrl, EmbedKind } from "../../../lib/project-editor";

const LABELS: Record<EmbedKind, string> = {
  embed: "Embed код эсвэл холбоос",
  prototype: "Прототипийн холбоос (Figma г.м)",
  "3d": "3D агуулгын холбоос",
};

type EmbedBlockEditorProps = { url: string; kind: EmbedKind; onChange: (url: string) => void };

export function EmbedBlockEditor({ url, kind, onChange }: EmbedBlockEditorProps) {
  const src = url ? extractEmbedUrl(url) : "";

  return <div className="block-field-group">
    <label>{LABELS[kind]}<textarea value={url} onChange={(event) => onChange(event.target.value)} rows={2} placeholder="https:// эсвэл <iframe> код paste хийнэ үү" /></label>
    {src && <div className="block-embed-frame"><iframe src={src} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" /></div>}
  </div>;
}
