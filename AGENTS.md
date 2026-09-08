<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design: read docs/design-system.md before writing any UI

This project has one enforced visual direction — **glassmorphism: frosted panels,
soft light, a blue -> white gradient ground, composition in depth layers**. It is
specified in [`docs/design-system.md`](docs/design-system.md) and implemented in
[`styles/glass-theme.css`](styles/glass-theme.css). Read the spec before styling
anything; it is treated like the diagrams in `docs/` — **if the spec and the code
disagree, the spec is right and the code gets fixed.**

The short version, so a change made without opening the spec still lands close:

- **Project X is a dense, image-led site. The work is the subject; the interface
  is the frame. Glass goes on the frame, never over the work.**
- **Tokens, not literals.** Colour, radius, shadow and blur come from the `:root`
  block in `styles/glass-theme.css`. No new hex values in feature stylesheets.
- **Glass is for floating layers only** — header, sticky bars, dropdowns, modals,
  scrims, toasts. Content surfaces (cards, rows, grids) get soft elevation and
  **no** `backdrop-filter`.
- **Never give a translucent white surface to something with light text or a
  photo behind it** (`.hire-banner` is the worked example) — the text vanishes.
- **Radii stay modest.** 20px is the top of the scale; capsules are only for
  controls that are genuinely capsule-shaped (toolbar search, filter trigger,
  sort tabs, badges).
- Ready-made classes: `.glass-panel`, `.glass-card`, `.glass-sunk`,
  `.glass-pill`, `.glass-field`.
- `glass-theme.css` is imported **last** in `app/globals.css` — that is what lets
  its `:root` override the earlier token blocks and its surface rules win by
  source order. Do not move it.
- **Look at the page before you call it done.** An earlier attempt at this
  direction shipped with clean CSS, a clean build and no visual check, and had to
  be reverted. `docs/design-system.md` §8 has the headless-screenshot recipe.
