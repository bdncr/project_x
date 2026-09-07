# Project X — дизайн систем (Glass theme)

Энэ бол төслийн **заавал баримтлах** визуал чиглэл. Шинэ UI нэмэх, хуучныг засах бүрд
энэ баримтыг эх загвар гэж үзнэ. Диаграммуудтай адилаар: **энэ баримт код руу
зөрчилдвөл, баримтыг зөв гэж үзэж кодыг нь тааруулна.**

Эх файл: [`styles/glass-theme.css`](../styles/glass-theme.css) — бүх токен тэндээс
уншигдана. `app/globals.css` дотор **хамгийн сүүлд** import хийгддэг.

---

## 1. The direction

> Mobile app UI, glassmorphism aesthetic with frosted glass panels, soft lighting,
> a gradient color palette transitioning from blue to white, layered composition
> with depth, modern and clean mood, high detail rendering technique.
> `--ar 9:16 --style raw --stylize 250`

**Explicitly ruled out** (the negative prompt, treated as hard constraints):
low contrast · harsh shadows · cluttered layout · overly bright colors ·
sharp edges · watermark · low resolution · distorted elements.

Each of those maps to a rule the tokens already enforce — see §6.

---

## 2. How the theme is wired

`glass-theme.css` is imported **last** from `app/globals.css`. That ordering does two
jobs, and moving the import breaks both:

1. **Token takeover.** Custom properties resolve at use time, not at declaration
   time. The `:root` block in `glass-theme.css` outranks the earlier ones in
   `base-theme.css` and `explore-feed.css`, so every existing `var(--ink)`,
   `var(--accent)`, `var(--line)` in those files repaints itself with no edit.
2. **Surface overrides.** Equal-specificity rules win by source order, so the
   surface rules override the older ones without `!important`.

The one place `!important` appears is the secondary-button group, and only because
`.ghost-button` in `base-theme.css` already declares `background`/`color` that way.

---

## 3. Tokens

Three layers. **Component rules reference layer 2 or 3 only** — never a raw
primitive, so a palette change stays a one-line change.

### Layer 1 — primitives

| Group | Tokens | Notes |
|---|---|---|
| Blue ramp | `--blue-50` … `--blue-900` | Built around `#1769ff`, which was already the app's brand blue |
| Cool neutrals | `--mist-0` … `--mist-400` | Slight blue cast — white reads as daylight, not the old warm paper |
| Text ramp | `--ink-900` `--ink-700` `--ink-500` `--ink-400` | Contrast-checked, see §6 |
| State | `--state-success` `--state-danger` `--state-warning` | |

### Layer 2 — semantic

| Purpose | Tokens |
|---|---|
| Glass weights | `--glass-1` (0.52) · `--glass-2` (0.68) · `--glass-3` (0.82) · `--glass-tint` · `--glass-sunk` |
| Glass edges | `--glass-line` · `--glass-line-soft` · `--glass-sheen` (inner top highlight) |
| Blur | `--blur-sm` (10px) · `--blur-md` (18px) · `--blur-lg` (30px) — all with `saturate()` |
| Elevation | `--elev-1` … `--elev-4` · `--ring` (focus) |
| Radius | `--r-xs` 8 · `--r-sm` 12 · `--r-md` 16 · `--r-lg` 22 · `--r-xl` 28 · `--r-pill` |
| Roles | `--surface` `--text` `--text-soft` `--border` `--brand` `--brand-strong` `--ease` |

Higher glass number = more opaque = reads as closer to the viewer. That is the
whole depth model; use it instead of inventing new alpha values.

### Layer 3 — legacy remap

`--ink` `--paper` `--panel` `--line` `--muted` `--accent` `--accent-dark` `--green`
`--danger` `--shadow` — the names the older stylesheets already call, repointed at
layer 2. **Don't add new usages of these.** They exist so the pre-existing files
repaint themselves; new code goes straight to layer 2.

---

## 4. The one rule that matters most

> **Frosted glass is for layers that float over content. Content surfaces get
> soft elevation instead.**

| | Treatment | Examples |
|---|---|---|
| **Floating** | `--glass-3` + `--blur-lg` + `--elev-3/4` + `--glass-line` + `--glass-sheen` | header, dropdown menus, modals, scrims, toasts, popovers, the sticky project rail |
| **Content** | `--glass-2` + `--elev-1` + `--border`, **no blur** | feed cards, creator cards, job rows, meta cards, settings cards |
| **Sunk** | `--glass-sunk` + `--glass-line-soft` | read-only notes, hints, disabled states, empty states |

Why: dozens of simultaneous `backdrop-filter`s in a grid cost real frames, and blur
under 11–13px text is exactly what makes a glass UI read as *cluttered* and
*low contrast* — both on the negative list.

Ready-made classes for new markup, so the recipe isn't re-derived:
`.glass-panel` · `.glass-card` · `.glass-sunk` · `.glass-pill` · `.glass-field`.

---

## 5. Composition

- **Ground.** The blue → white gradient plus three soft blooms lives in one
  multi-layer `background` on `<body>`. It is *not* a stack of positioned
  pseudo-elements — that would get caught in a stacking context with the sticky
  header (`z-index: 30`) or a modal. Routes must not paint an opaque background
  over it; the ones that used to (`.profile-page`, `.manage-section`,
  `.case-light-section`) now hand it back or use `--glass-tint`.
- **Depth order.** ground → content card (`--elev-1`) → sticky/raised
  (`--elev-2/3`) → floating panel (`--elev-3`) → modal (`--elev-4`).
- **Project detail page** is the one deep-blue room: a case study reads better with
  the work lit against a dark ground. It stays dark but sits at the bottom of the
  blue ramp (`--blue-900`) rather than near-black, so it belongs to this palette.
- **Motion.** One easing curve, `--ease`. Hovers lift 1–2px, 180–220ms. Nothing
  bounces.

---

## 6. Hard constraints (from the negative prompt)

| Ruled out | The rule | Enforced by |
|---|---|---|
| Harsh shadows | Shadows are **blue-tinted, two-stop, ≤ .14 alpha**. Never `rgba(0,0,0,…)`. | `--elev-1…4` |
| Sharp edges | **No square corners.** `--r-xs` (8px) is the floor, not zero. | `--r-*` |
| Low contrast | Body text uses `--ink-900`/`--ink-700`. `--ink-500` (~5.4:1 on white) is the **lightest step allowed to carry prose**; `--ink-400` is for non-essential meta only. | text ramp |
| Overly bright | Saturated blue appears only on primary actions and active states. Everything else is glass, mist or ink. | `--brand` usage |
| Cluttered | Blur is reserved for floating layers (§4). | — |

Accessibility guards already in the file — keep them working:
`@supports not (backdrop-filter)` → near-opaque fallback ·
`prefers-reduced-transparency` → solid surfaces, blur off ·
`prefers-reduced-motion` → transitions and lifts off · `@media print` → flat white.

---

## 7. Mobile first (9:16)

The direction was drawn portrait, and that is where it has to hold up first.
Below 720px: blur radii drop (`--blur-lg` 30 → 20px — a 30px blur on a 390px screen
swallows the whole background), the ground switches to `background-attachment: scroll`
(a fixed attachment repaints the gradient every scroll frame on mobile), and dialogs
go full-bleed as bottom sheets with a soft top lip.

---

## 8. Checklist for new UI

1. Is this floating or content? Pick the treatment from §4.
2. Colour, radius, shadow, blur → a layer-2 token. If none fits, add one to
   `glass-theme.css` rather than a literal in a feature stylesheet.
3. No new hex literals in feature stylesheets. The pre-existing ones are legacy —
   convert them when you touch that rule anyway.
4. Interactive? It needs `:hover` and a `:focus-visible` ring.
5. Check it at 390px wide before calling it done.
