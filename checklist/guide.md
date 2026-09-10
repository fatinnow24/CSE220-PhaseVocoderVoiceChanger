# Checklist Design — Working Guide & Lessons Learned

> Source: https://www.checklist.design/
> Goal: replicate its exact warm "cuteness" on the app (test bed = a Physics Live Exam page in the playground).

This file is the **source of truth**. Read it before touching anything styled after checklist.design.
It logs every mistake made, the user's correction, and the final winning choices — so the mistakes are never repeated.

---

## 1. FAILURES I MADE, AND WHAT THE USER CORRECTED

These happened in order on the exam mock. Each one the user had to call out. Do NOT repeat them.

### Fault 1 — I put hairlines/borders everywhere
I styled cards, option rows, buttons, the navbar, modals, badges with visible borders.
**User:** "on the original website there is no borders. those borders you did is destroying the website."
**Fix:** removed all borders (border-style: none on every component).

### Fault 2 — I replaced borders with soft shadows to create separation
I introduced a tiered shadow stack. The guide's original line ("no deep shaders") hinted at this but I over-rotated.
**User:** "also remove the shadow thing. those are also destroying the vibe."
**Fix:** fully flat. No borders AND no box-shadows anywhere. Separation is color-only.

### Fault 3 — I used a dark saturated purple `#684d95` as solid fills
Buttons, the brand tile, the active palette square, selected badges all got big solid dark-violet fills.
**User:** "the dark purple color is destroying the theme."
**Fix:** accent becomes a soft lavender FILL with the deep violet kept only as tiny ink/outline accents. Never drop heavy dark violet on large areas.

### Fault 4 — even a mid lavender `#a89bd6` was still too dark
I softened to a medium lavender, which the user still found too dark.
**User:** pointed at the pale pill container around "Physics · Live mock exam" and said: use THAT soft purple; "the one you chose still is too dark."
**Fix:** accent fill = pale lavender `#e4def2`, identical family to the pill. Deep violet only as text on it.

### Fault 5 — (layout) the original exam layout was rejected up front
**User:** "also the current layout is trash."
**Fix:** rebuilt the layout using the better-layout skill: importance order (question leads in DOM + column order), group-with-space not lines, controls distinct from content, collapse late (920px), no fixed widths on text.

---

## 2. THE USER'S WINNING CHOICES (the target)

- Replicate checklist.design's **exact cuteness** on the app.
- Test bed = a **live exam page** (question paper + palette + timer + results).
- **Fully flat**: mostly NO borders, NO shadows. Use soft pastel tints + white surfaces for separation.
- **Soft lavender** accent, pale — matching the eyebrow pill container, not a dark purple.
- Layout should be airy, spaced per the original site, buttons matched to original spacing.

---

## 3. FINAL DESIGN SYSTEM (current, working)

### Palette
- Page background: `#f4f3ee` (warm cream)
- Surface: `#ffffff`
- Ink: `#26211c`  ·  body text at ~80% = `rgba(38,33,28,.8)`
- Secondary text: `#57534e`
- Pastel category tints (checklist Mobile/Webapp/Website/Design-system/Flows):
  - cream `#f0ead8` · blue `#dce6f0` · lavender `#e5e3e8` · peach `#f0e3db` · green `#e3e8e4`

### Accent (the soft purple — DO NOT darken)
- Fill: `--primary: #e4def2` (pale lavender, === the pill container tone)
- Fill hover: `#d8d0ed` · Fill active: `#c9bde4`
- Text/ink on the fill: `--on-primary: #3a2c5e` (deep violet) — the only place deep violet appears
- Outline / small accent text: `--focus: #5a4a85`
- Soft tint (selected states, eyebrow): `--primary-soft: rgba(192,180,228,.26)`
- Dark theme equivalents keep the same pale-lavender fill + dark on-primary.

### Type
One geometric sans for everything (TT Hoves is commercial → stand-in: **Outfit**, weights 400/500/600/700). Mono (Fira Code) only inside literal formula/code blocks.
- Hero 60px/600 · section 32px · card 20px/600 · body 16px/400 · labels 12px · subtitle 14px · buttons 14–18px/500
- Letter-spacing tight (`-0.01em` to `-0.02em`) on display sizes.

### Shape & elevation
- Radii: 8 / 12 / 16 / 24 / 9999(pill). No mixing rounded + sharp in one view.
- **BORDERS: none. SHADOWS: none.** Interactive state = soft lavender fill + tiny translateY, NOT a ring/border/shadow.
- Top-level separation is purely color: cream page / white cards / pastel-tinted panels.

### Spacing (match the original)
- Card padding `40px` · options ~`19px 22px` · CTA buttons ~`13–22px`, radius `12px` · tool chips `4px 14px` pill · grid gaps `16–26px` · base unit `2px`. Tight but airy. Inter-group gap ≥ 2× intra-group.

### Layout (better-layout principles baked in)
- Sticky header floats on the cream (no border/shadow). Brand + chips + timer + one primary CTA.
- Centered hero: eyebrow pill → H1 → muted subtitle.
- Content row, importance order (question leads). Palette card sticky on the side, stacked below on mobile.
- Collapse late (~920px). Controls have background shapes so they read as controls. No fixed widths on text containers.

---

## 4. HARD RULES (violating any = regression)

1. **NO borders.** Reset every component's border-style to none.
2. **NO shadows.** Don't reintroduce drop shadows to fake depth/separation.
3. **Separation = color only.** White surfaces on cream, pastel tints on cream.
4. **Accent = pale soft lavender.** `#e4def2` family. Deep violet `#3a2c5e` is TEXT on it, never solid fills. If the accent reads "dark purple," it's wrong.
5. **Single accent per screen.** Purple/lavender on the one primary action + active state only.
6. **One geometric sans** for every role (mono only for literal formulas).
7. **Match original spacing** — don't tighten buttons or gaps arbitrarily.

---

## 5. WHEN TO RECONSIDER

- If a control reads too faint without borders/shadows, deepen the surface's **tint contrast** (or the lavender fill slightly) — never reintroduce borders/shadows.
- Cute = soft, warm, pale, airy, flat. If a change adds weight/darkness/depth, it's contrary to the vibe.