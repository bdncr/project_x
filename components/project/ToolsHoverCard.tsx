"use client";

import { Icon } from "../Icon";
import { splitTools } from "../../lib/creative-tools";
import { useHoverCard } from "../../lib/use-hover-card";

type ToolsHoverCardProps = { tools: string[] };

/** The rail's Tools item and the panel that opens off it: the recognised apps as badged dark
 * cards, then everything else — craft rather than software — on one line underneath. Clicking
 * still jumps to the full tools card at the bottom of the page. */
export function ToolsHoverCard({ tools }: ToolsHoverCardProps) {
  const { open, hoverProps } = useHoverCard();
  const { apps, rest } = splitTools(tools);

  return <div className="case-rail-pop" {...hoverProps}>
    <a href="#case-tools-card" className="case-rail-item" aria-expanded={open}>
      <span className="case-rail-icon"><Icon name="briefcase" /></span>
      <small>Хэрэгсэл</small>
    </a>

    {open && tools.length > 0 && <div className="rail-card tools-card" role="dialog" aria-label="Хэрэгслүүд">
      <p className="tools-card-label">ХЭРЭГСЭЛ</p>
      {apps.length > 0 && <div className="tools-card-apps">
        {apps.map((app) => <div key={app.name} className="tools-app" style={{ background: app.tint }}>
          <span className="tools-app-badge" style={{ color: app.ink }}>{app.badge}</span>
          <span className="tools-app-name">{app.name}</span>
        </div>)}
      </div>}
      {rest.length > 0 && <p className="tools-card-rest">{rest.join(", ")}</p>}
    </div>}
  </div>;
}
