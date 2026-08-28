/** An app that gets its own badged card in the Tools hover panel. */
export type ToolApp = {
  name: string;
  /** Two-letter mark, the way the Creative Cloud apps label themselves. */
  badge: string;
  /** Badge text colour, on the card's dark plate. */
  ink: string;
  /** Card background — a tint of the app's own colour rather than its splash art, which
   * belongs to its vendor. */
  tint: string;
};

/**
 * Apps recognised well enough to draw a badge for. Everything else a project lists — the
 * craft entries like "Typography" or "Хэрэглэгчийн судалгаа" — is not an app and falls to the
 * plain text line under the cards, which is also how the reference panel treats them.
 */
const TOOL_APPS: ToolApp[] = [
  { name: "Photoshop", badge: "Ps", ink: "#31a8ff", tint: "linear-gradient(135deg, #04121f, #062b47)" },
  { name: "Illustrator", badge: "Ai", ink: "#ff9a00", tint: "linear-gradient(135deg, #1f1102, #452503)" },
  { name: "Adobe Illustrator", badge: "Ai", ink: "#ff9a00", tint: "linear-gradient(135deg, #1f1102, #452503)" },
  { name: "InDesign", badge: "Id", ink: "#ff3f66", tint: "linear-gradient(135deg, #200610, #470f24)" },
  { name: "Lightroom", badge: "Lr", ink: "#31a8ff", tint: "linear-gradient(135deg, #041322, #05305c)" },
  { name: "After Effects", badge: "Ae", ink: "#9a9aff", tint: "linear-gradient(135deg, #100a26, #241553)" },
  { name: "Premiere Pro", badge: "Pr", ink: "#9a9aff", tint: "linear-gradient(135deg, #14082a, #2a0f52)" },
  { name: "Adobe Creative Suite", badge: "Cc", ink: "#ff5c5c", tint: "linear-gradient(135deg, #20060a, #491018)" },
  { name: "Figma", badge: "Fg", ink: "#22c3a6", tint: "linear-gradient(135deg, #06201c, #0c3b34)" },
  { name: "Framer", badge: "Fr", ink: "#64b3ff", tint: "linear-gradient(135deg, #061424, #0d2c4d)" },
  { name: "Procreate", badge: "Pc", ink: "#ffb44d", tint: "linear-gradient(135deg, #1f1305, #43290a)" },
  { name: "Capture One", badge: "C1", ink: "#8fd0ff", tint: "linear-gradient(135deg, #061520, #0c2c40)" },
  { name: "Blender", badge: "Bl", ink: "#ff8a3d", tint: "linear-gradient(135deg, #1e1004, #40230a)" },
  { name: "Cinema 4D", badge: "C4", ink: "#6fc7ff", tint: "linear-gradient(135deg, #05161f, #0a2f42)" },
  { name: "V-Ray", badge: "Vr", ink: "#7ee0a6", tint: "linear-gradient(135deg, #061a10, #0d3722)" },
  { name: "Substance Painter", badge: "Sp", ink: "#ffa06b", tint: "linear-gradient(135deg, #200f06, #45210d)" },
];

const BY_NAME = new Map(TOOL_APPS.map((app) => [app.name.toLowerCase(), app]));

/**
 * Splits a project's tool list into the apps that get a badged card and the rest, which are
 * shown as one comma-separated line beneath them.
 *
 * @param limit how many cards the panel has room for; extra apps join the text line.
 */
export function splitTools(tools: string[], limit = 3): { apps: ToolApp[]; rest: string[] } {
  const apps: ToolApp[] = [];
  const rest: string[] = [];
  for (const tool of tools) {
    const app = BY_NAME.get(tool.trim().toLowerCase());
    if (app && apps.length < limit) apps.push({ ...app, name: tool });
    else rest.push(tool);
  }
  return { apps, rest };
}
