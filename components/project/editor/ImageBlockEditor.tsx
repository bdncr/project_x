type ImageBlockEditorProps = {
  url: string;
  caption: string;
  onChange: (patch: Partial<{ url: string; caption: string }>) => void;
};

export function ImageBlockEditor({ url, caption, onChange }: ImageBlockEditorProps) {
  return <div className="block-field-group">
    <label>Зургийн URL<input value={url} onChange={(event) => onChange({ url: event.target.value })} placeholder="https://..." /></label>
    {url && <img className="block-image-preview" src={url} alt="" />}
    <label>Тайлбар <span>(заавал биш)</span><input value={caption} onChange={(event) => onChange({ caption: event.target.value })} /></label>
  </div>;
}
