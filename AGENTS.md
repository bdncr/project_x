<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Design: read docs/design-system.md before writing any UI

This project has one enforced visual direction — **glassmorphism: frosted panels,
soft light, a blue -> white gradient ground, composition in depth layers**, drawn
mobile-first at 9:16. It is specified in [`docs/design-system.md`](docs/design-system.md)
and implemented in [`styles/glass-theme.css`](styles/glass-theme.css). Read the spec
before styling anything; it is treated the same way as the diagrams in `docs/` —
**if the spec and the code disagree, the spec is right and the code gets fixed.**

The short version, so a change made without opening the spec still lands close:

- **Tokens, not literals.** Colour, radius, shadow and blur all come from the
  `:root` block in `styles/glass-theme.css`. No new hex values in feature
  stylesheets.
- **Glass is for floating layers only** — header, dropdowns, modals, scrims,
  toasts, popovers. Content surfaces (cards, rows, grids) get soft elevation and
  **no** `backdrop-filter`; a grid full of blurs costs real frames and makes small
  text unreadable.
- **Ready-made classes** for new markup: `.glass-panel`, `.glass-card`,
  `.glass-sunk`, `.glass-pill`, `.glass-field`.
- **Hard constraints from the brief's negative prompt**: no square corners (8px
  floor), no black or tight shadows (blue-tinted, two-stop, <= .14 alpha), nothing
  lighter than `--ink-500` carrying prose, saturated blue reserved for primary
  actions.
- `glass-theme.css` is imported **last** in `app/globals.css` on purpose — that is
  what lets its `:root` override the earlier token blocks and its surface rules win
  by source order. Do not move it.
- Check new UI at **390px wide** before calling it done.
