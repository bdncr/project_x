import { Icon, IconName } from "../../Icon";
import { MODULE_BUTTONS, ModuleButton, BlockType, EmbedKind } from "../../../lib/project-editor";

function iconFor(button: ModuleButton): IconName {
  if (button.type === "embed") return button.kind === "prototype" ? "cursor" : button.kind === "3d" ? "cube" : "code";
  if (button.type === "image") return "image";
  if (button.type === "photo_grid") return "grid";
  if (button.type === "video") return "video";
  return "edit";
}

type BlockPickerProps = {
  onAdd: (type: BlockType, kind?: EmbedKind) => void;
  /** "canvas": the big single-row empty-state picker. "sidebar": the compact always-on Add Content grid. */
  variant?: "canvas" | "sidebar";
};

/** The "Add Content" module row — mirrors the reference editor's Image/Text/Photo
 * Grid/Video/Embed/Lightroom/Prototype/3D picker, reused both as the big empty-canvas
 * prompt and as the sidebar's persistent compact grid. */
export function BlockPicker({ onAdd, variant = "canvas" }: BlockPickerProps) {
  return <div className={variant === "canvas" ? "block-picker" : "sidebar-add-content"}>
    {MODULE_BUTTONS.map((button, index) => <button
      key={index}
      type="button"
      className={variant === "canvas" ? "block-picker-item" : "sidebar-content-item"}
      disabled={button.disabled}
      title={button.disabled ? "Adobe акаунттай холбогддог тул одоогоор дэмжигдэхгүй" : undefined}
      onClick={() => onAdd(button.type, button.kind)}
    >
      <span className={variant === "canvas" ? "block-picker-icon" : "sidebar-content-icon"}>
        {button.label === "Lightroom" ? "Lr" : <Icon name={iconFor(button)} />}
      </span>
      <span>{button.label}</span>
    </button>)}
  </div>;
}
