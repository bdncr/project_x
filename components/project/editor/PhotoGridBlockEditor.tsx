import { Icon } from "../../Icon";

type PhotoGridBlockEditorProps = { urls: string[]; onChange: (urls: string[]) => void };

export function PhotoGridBlockEditor({ urls, onChange }: PhotoGridBlockEditorProps) {
  const update = (index: number, value: string) => onChange(urls.map((url, i) => i === index ? value : url));
  const removeSlot = (index: number) => onChange(urls.filter((_, i) => i !== index));
  const addSlot = () => onChange([...urls, ""]);

  return <div className="photo-grid-editor">
    {urls.map((url, index) => <div className="photo-grid-slot" key={index}>
      {url && <img src={url} alt="" />}
      <input value={url} onChange={(event) => update(index, event.target.value)} placeholder={`Зураг ${index + 1} URL`} />
      {urls.length > 2 && <button type="button" onClick={() => removeSlot(index)} aria-label="Устгах"><Icon name="close" /></button>}
    </div>)}
    {urls.length < 6 && <button type="button" className="photo-grid-add" onClick={addSlot}><Icon name="plus" />Зураг нэмэх</button>}
  </div>;
}
