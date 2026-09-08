# Project X — дизайн систем (Glass theme)

Энэ бол төслийн **заавал баримтлах** визуал чиглэл. Шинэ UI нэмэх, хуучныг засах бүрд
энэ баримтыг эх загвар гэж үзнэ. Диаграммуудтай адилаар: **энэ баримт код руу
зөрчилдвөл, баримтыг зөв гэж үзэж кодыг нь тааруулна.**

Эх файл: [`styles/glass-theme.css`](../styles/glass-theme.css) — бүх токен тэндээс
уншигдана. `app/globals.css` дотор **хамгийн сүүлд** import хийгддэг.

---

## 1. The direction

> Website UI, glassmorphism aesthetic with frosted glass panels, soft lighting,
> a gradient color palette transitioning from blue to white, layered composition
> with depth, modern and clean mood, high detail rendering technique.

**Explicitly ruled out** (the negative prompt, treated as hard constraints):
low contrast · harsh shadows · cluttered layout · overly bright colors ·
sharp edges · watermark · low resolution · distorted elements.

Each maps to a rule the tokens enforce — see §6.

### The governing constraint

Project X is a **dense, image-led discovery site**. The work on the page is the
subject; the interface is the frame around it. So:

> **Glass goes on the frame, never over the work.**

An earlier attempt at this direction was reverted because it ignored that: it
pushed a heavy blue wash and capsule radii through every surface, which competed
with the artwork and read as toy-like. The version in the tree is deliberately
quieter. If you are about to make the blue louder or the corners rounder, that is
the failure mode you are walking back into.

---

## 2. How the theme is wired

`glass-theme.css` is imported **last** from `app/globals.css`. That ordering does
two jobs, and moving the import breaks both:

1. **Token takeover.** Custom properties resolve at use time, not declaration
   time. The `:root` block here outranks the earlier ones in `base-theme.css` and
   `explore-feed.css`, so every existing `var(--ink)`, `var(--accent)`,
   `var(--line)` in those files repaints itself with no edit.
2. **Surface overrides.** Equal-specificity rules win by source order, so the
   surface rules override the older ones without `!important`.

The only `!important` is in the secondary-button group, and only because
`.ghost-button` in `base-theme.css` already declares `background`/`color` that way.

---

## 3. Tokens

Three layers. **Component rules reference layer 2 or 3 only** — never a raw
primitive, so a palette change stays a one-line change.

### Layer 1 — primitives

| Group | Tokens | Notes |
|---|---|---|
| Blue ramp | `--blue-50` … `--blue-900` | Built around `#1769ff`, already the app's brand blue |
| Cool neutrals | `--mist-0` … `--mist-400` | Faint blue cast — white reads as daylight, not warm paper |
| Text ramp | `--ink-900` `--ink-700` `--ink-500` `--ink-400` | Measured, see §6 |
| State | `--state-success` `--state-danger` `--state-warning` | |

### Layer 2 — semantic

| Purpose | Tokens |
|---|---|
| Glass weights | `--glass-1` (.58) · `--glass-2` (.74) · `--glass-3` (.86) · `--glass-tint` · `--glass-sunk` |
| Glass edges | `--glass-line` · `--glass-line-soft` · `--glass-sheen` (inner top highlight) |
| Blur | `--blur-sm` 8px · `--blur-md` 16px · `--blur-lg` 24px — each with `saturate()` |
| Elevation | `--elev-1` … `--elev-4` · `--ring` (focus) |
| Radius | `--r-xs` 6 · `--r-sm` 9 · `--r-md` 12 · `--r-lg` 16 · `--r-xl` 20 · `--r-pill` |
| Roles | `--surface` `--text` `--text-soft` `--border` `--brand` `--brand-strong` `--ease` |

Higher glass number = more opaque = reads as closer to the viewer. That is the
whole depth model; use it instead of inventing alpha values.

**On radii:** the scale tops out at 20px for a reason. `--r-pill` is only for
controls that are genuinely capsule-shaped — the toolbar search field, the filter
trigger, the sort segmented control, status badges. Rounding cards and panels to
capsules is what made the reverted attempt look like a toy.

### Layer 3 — legacy remap

`--ink` `--paper` `--panel` `--line` `--muted` `--accent` `--accent-dark`
`--green` `--danger` `--shadow` — the names the older stylesheets already call,
repointed at layer 2. **Don't add new usages.** They exist so the pre-existing
files repaint themselves; new code goes straight to layer 2.

---

## 4. The one rule that matters most

> **Frosted glass is for layers that float over content. Content surfaces get
> soft elevation instead.**

| | Treatment | Examples |
|---|---|---|
| **Floating** | `--glass-2/3` + blur + `--elev-3/4` + `--glass-line` + `--glass-sheen` | site header, explore toolbar, jobs tab bar, editor topbar, dropdowns, modals, scrims, toasts, the sticky project rail |
| **Content** | `--glass-2` + `--elev-1` + `--border`, **no blur** | feed cards, creator cards, job rows, meta cards, settings cards |
| **Sunk** | `--glass-sunk` + `--glass-line-soft` | read-only notes, hints, empty states |

Why: dozens of simultaneous `backdrop-filter`s in a grid cost real frames, and
blur under 12px text is exactly what makes a glass UI read as *cluttered* and
*low contrast* — both on the negative list.

Ready-made classes for new markup: `.glass-panel` · `.glass-card` · `.glass-sunk`
· `.glass-pill` · `.glass-field`.

### Surfaces that must NOT get the glass treatment

- **`.hire-banner`** — a full-bleed photo with white type over a dark scrim.
  Giving it a translucent white surface makes its heading vanish. It gets an
  inset wash only. The same caution applies to any future photo-backed banner.
- **Anything with light text on a dark or image background.** Check the text
  colour before you touch the background.

---

## 5. Composition

- **Ground.** The blue → white gradient plus four soft blooms lives in one
  multi-layer `background` on `<body>`. It is *not* positioned pseudo-elements —
  those get caught in a stacking context with the sticky header (`z-index: 30`)
  or a modal. Blue is felt at the top of the page and around the margins, then
  settles to white behind the content and returns as a whisper at the bottom.
- **Routes must not paint an opaque background over it.** Every full-width white
  bar — `.toolbar`, `.jobs-tabs`, `.editor-topbar` — cut a visible hard band
  across the gradient before it was converted. If you add a bar, make it glass.
- **Depth order.** ground → content card (`--elev-1`) → sticky bar → floating
  panel (`--elev-3`) → modal (`--elev-4`).
- **Project detail page** is the one dark room: a case study reads better with
  the work lit against a dark ground. It stays dark but sits at the bottom of the
  blue ramp, so it belongs to this palette rather than looking like a different
  product.
- **Motion.** One easing curve, `--ease`. Hovers lift 1–2px over 180–220ms.

---

## 6. Hard constraints (from the negative prompt)

| Ruled out | The rule | Enforced by |
|---|---|---|
| Harsh shadows | **Blue-tinted, two-stop, ≤ .13 alpha.** Never `rgba(0,0,0,…)`. | `--elev-1…4` |
| Sharp edges | **No square corners**; `--r-xs` (6px) is the floor. Capsules only where a control is genuinely capsule-shaped. | `--r-*` |
| Low contrast | Body text uses `--ink-900`/`--ink-700`. `--ink-500` is the **lightest step allowed to carry prose**. | text ramp |
| Overly bright | Saturated blue only on primary actions. Active filters are a soft `--blue-100` chip, not a solid slab. | `--brand` usage |
| Cluttered | Blur reserved for floating layers (§4). | — |

### Measured contrast

Verified against white and against `--glass-2` over the bluest part of the ground
(`#f4f8fe`):

| Pair | On white | On glass over blue |
|---|---|---|
| `--ink-900` | 17.8:1 | 16.7:1 |
| `--ink-700` | 12.2:1 | 11.4:1 |
| `--ink-500` | 6.0:1 | 5.7:1 |
| `--ink-400` | 3.7:1 | — |
| white on `--brand` | 4.7:1 | |
| white on `--blue-800` (active tab) | 13.5:1 | |
| `--brand-strong` on `--blue-100` chip | 5.6:1 | |

**`--ink-400` is below AA (4.5:1) for normal text.** It is a decorative /
large-text step only — never use it for text that carries meaning.

Accessibility guards in the file — keep them working:
`@supports not (backdrop-filter)` → near-opaque fallback ·
`prefers-reduced-transparency` → solid surfaces, blur off ·
`prefers-reduced-motion` → transitions and lifts off · `@media print` → flat white.

---

## 7. Narrow viewports

Below 720px: blur radii drop (`--blur-lg` 24 → 18px — a wide blur on a 390px
screen swallows the background), the ground switches to
`background-attachment: scroll` (a fixed attachment repaints the gradient on every
scroll frame on mobile), and dialogs go full-bleed as bottom sheets.

---

## 8. Verifying a change

The reverted first attempt shipped with clean CSS, a clean build and no visual
check, and it was wrong. **Look at the page.** There is a harness pattern that
works without a backend:

1. `npx next dev -p 3141`
2. Point headless Edge at a route:
   `msedge --headless=new --screenshot=out.png --window-size=1440,900 http://localhost:3141/`
3. For content that needs Supabase, build a static HTML page that `<link>`s the
   stylesheets from `styles/` in `globals.css` order and uses the real class
   names with `data:` URI artwork. That also lets you test glass over artwork,
   which is the only way to tell whether the frosting actually works.

## 9. Checklist for new UI

1. Floating or content? Pick the treatment from §4.
2. Does the surface have light text or a photo behind it? If so, §4's exclusion
   list applies — do not give it a translucent white background.
3. Colour, radius, shadow, blur → a layer-2 token. If none fits, add one here
   rather than a literal in a feature stylesheet.
4. No new hex literals in feature stylesheets. Existing ones are legacy —
   convert them when you touch that rule anyway.
5. Interactive? It needs `:hover` and a `:focus-visible` ring.
6. Screenshot it at 1440 and at 390 before calling it done.
