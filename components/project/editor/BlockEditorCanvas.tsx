import { Icon } from "../../Icon";
import type { ProjectBlock } from "../../../lib/project-editor";
import { TextBlockEditor } from "./TextBlockEditor";
import { ImageBlockEditor } from "./ImageBlockEditor";
import { PhotoGridBlockEditor } from "./PhotoGridBlockEditor";
import { VideoBlockEditor } from "./VideoBlockEditor";
import { EmbedBlockEditor } from "./EmbedBlockEditor";

const BLOCK_LABEL: Record<string, string> = { text: "Текст", image: "Зураг", photo_grid: "Зургийн тор", video: "Видео/Аудио", embed: "Embed", prototype: "Прототип", "3d": "3D" };

type BlockEditorCanvasProps = {
  blocks: ProjectBlock[];
  onUpdate: (id: string, block: ProjectBlock) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
};

export function BlockEditorCanvas({ blocks, onUpdate, onRemove, onMove }: BlockEditorCanvasProps) {
  if (blocks.length === 0) return null;

  return <div className="block-canvas">
    {blocks.map((block, index) => <article className="editor-block" key={block.id}>
      <div className="editor-block-head">
        <span>{block.type === "embed" ? BLOCK_LABEL[block.kind] : BLOCK_LABEL[block.type]}</span>
        <div className="editor-block-actions">
          <button type="button" disabled={index === 0} onClick={() => onMove(block.id, -1)} aria-label="Дээш зөөх"><Icon name="chevronUp" /></button>
          <button type="button" disabled={index === blocks.length - 1} onClick={() => onMove(block.id, 1)} aria-label="Доош зөөх"><Icon name="chevron" /></button>
          <button type="button" className="editor-block-danger" onClick={() => onRemove(block.id)} aria-label="Устгах"><Icon name="trash" /></button>
        </div>
      </div>
      {block.type === "text" && <TextBlockEditor html={block.html} onChange={(html) => onUpdate(block.id, { ...block, html })} />}
      {block.type === "image" && <ImageBlockEditor url={block.url} caption={block.caption} onChange={(patch) => onUpdate(block.id, { ...block, ...patch })} />}
      {block.type === "photo_grid" && <PhotoGridBlockEditor urls={block.urls} onChange={(urls) => onUpdate(block.id, { ...block, urls })} />}
      {block.type === "video" && <VideoBlockEditor url={block.url} onChange={(url) => onUpdate(block.id, { ...block, url })} />}
      {block.type === "embed" && <EmbedBlockEditor url={block.url} kind={block.kind} onChange={(url) => onUpdate(block.id, { ...block, url })} />}
    </article>)}
  </div>;
}
