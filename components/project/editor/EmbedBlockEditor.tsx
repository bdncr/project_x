import { useEffect, useState } from "react";
import { safeEmbedUrl, EmbedKind } from "../../../lib/project-editor";

const LABELS: Record<EmbedKind, string> = {
  embed: "Embed код эсвэл холбоос",
  prototype: "Прототипийн холбоос (Figma г.м)",
  "3d": "3D агуулгын холбоос",
};

/** Long enough that no half-typed URL is ever loaded, short enough to feel immediate once
 * you stop. Without it every keystroke mounted a fresh iframe. */
const PREVIEW_DELAY_MS = 600;

type EmbedBlockEditorProps = { url: string; kind: EmbedKind; onChange: (url: string) => void };

export function EmbedBlockEditor({ url, kind, onChange }: EmbedBlockEditorProps) {
  /* The preview follows the field on a delay rather than tracking it directly: an iframe
     remounts and re-requests on every src change, so binding it straight to the textarea made
     typing an address stutter and, with a relative src, hang the page outright. */
  const [previewUrl, setPreviewUrl] = useState(url);
  useEffect(() => {
    const timer = window.setTimeout(() => setPreviewUrl(url), PREVIEW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [url]);

  const src = safeEmbedUrl(previewUrl);
  const settled = previewUrl === url;

  return <div className="block-field-group">
    <label>{LABELS[kind]}<textarea value={url} onChange={(event) => onChange(event.target.value)} rows={2} placeholder="https:// эсвэл <iframe> код paste хийнэ үү" /></label>
    {settled && url.trim() && !src && <p className="block-hint">Бүтэн холбоос оруулна уу — https:// -ээр эхэлсэн хаяг эсвэл &lt;iframe&gt; код.</p>}
    {src && <div className="block-embed-frame"><iframe src={src} loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" /></div>}
  </div>;
}
