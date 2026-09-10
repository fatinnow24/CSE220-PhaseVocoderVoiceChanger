# Design Language: Checklist Design — Check every detail, ship better work

> Extracted from `https://www.checklist.design/` on August 26, 2026
> 988 elements analyzed

This document describes the complete design language of the website. It is structured for AI/LLM consumption — use it to faithfully recreate the visual design in any framework.

## Color Palette

### Primary Colors

| Role | Hex | RGB | HSL | Usage Count |
|------|-----|-----|-----|-------------|
| Primary | `#684d95` | rgb(104, 77, 149) | hsl(263, 32%, 44%) | 1 |
| Secondary | `#26211c` | rgb(38, 33, 28) | hsl(30, 15%, 13%) | 140 |
| Accent | `#f0ead8` | rgb(240, 234, 216) | hsl(45, 44%, 89%) | 8 |

### Neutral Colors

| Hex | HSL | Usage Count |
|-----|-----|-------------|
| `#000000` | hsl(0, 0%, 0%) | 1800 |
| `#ffffff` | hsl(0, 0%, 100%) | 84 |
| `#57534e` | hsl(33, 5%, 32%) | 16 |
| `#f4f3ee` | hsl(50, 21%, 95%) | 4 |
| `#79716b` | hsl(26, 6%, 45%) | 4 |

### Background Colors

Used on large-area elements: `#f4f3ee`, `#f0ead8`, `#dce6f0`, `#e5e3e8`, `#f0e3db`, `#e3e8e4`, `#ffffff`, `#000000`

### Text Colors

Text color palette: `#000000`, `#26211c`, `#050403`, `#ffffff`, `#57534e`, `#79716b`

### Full Color Inventory

| Hex | Contexts | Count |
|-----|----------|-------|
| `#000000` | text, border, background | 1800 |
| `#26211c` | text, border, background | 140 |
| `#ffffff` | background, text, border | 84 |
| `#57534e` | text, border | 16 |
| `#dce6f0` | background | 9 |
| `#f0ead8` | background | 8 |
| `#f4f3ee` | background, border | 4 |
| `#79716b` | text, border | 4 |
| `#684d95` | background | 1 |

## Typography

### Font Families

- **TT Hoves** — used for all (982 elements)
- **Relative Book** — used for body (6 elements)

### Type Scale

| Size (px) | Size (rem) | Weight | Line Height | Letter Spacing | Used On |
|-----------|------------|--------|-------------|----------------|---------|
| 60px | 3.75rem | 600 | 66px | normal | h1 |
| 48px | 3rem | 600 | 50.4px | -2.4px | h2 |
| 36px | 2.25rem | 600 | 39.6px | normal | h2 |
| 32px | 2rem | 600 | 40px | -0.64px | h3 |
| 30px | 1.875rem | 600 | 36px | normal | h3 |
| 24px | 1.5rem | 700 | 36px | -0.6px | a, svg, path |
| 20px | 1.25rem | 600 | 27.5px | -0.4px | span |
| 18px | 1.125rem | 500 | 28px | normal | span, p, input, button |
| 16px | 1rem | 400 | 24px | normal | html, head, meta, link |
| 15px | 0.9375rem | 400 | 20.625px | normal | span |
| 14px | 0.875rem | 500 | 20px | normal | a, button, svg, path |
| 12px | 0.75rem | 500 | 16px | normal | a, span, svg, path |

### Heading Scale

```css
h1 { font-size: 60px; font-weight: 600; line-height: 66px; }
h2 { font-size: 48px; font-weight: 600; line-height: 50.4px; }
h2 { font-size: 36px; font-weight: 600; line-height: 39.6px; }
h3 { font-size: 32px; font-weight: 600; line-height: 40px; }
h3 { font-size: 30px; font-weight: 600; line-height: 36px; }
h4 { font-size: 16px; font-weight: 400; line-height: 24px; }
```

### Body Text

```css
body { font-size: 16px; font-weight: 400; line-height: 24px; }
```

### Font Weights in Use

`400` (867x), `500` (91x), `600` (27x), `700` (3x)

## Spacing

**Base unit:** 2px

| Token | Value | Rem |
|-------|-------|-----|
| spacing-2 | 2px | 0.125rem |
| spacing-80 | 80px | 5rem |
| spacing-96 | 96px | 6rem |
| spacing-312 | 312px | 19.5rem |
| spacing-336 | 336px | 21rem |
| spacing-362 | 362px | 22.625rem |

## Border Radii

| Label | Value | Count |
|-------|-------|-------|
| sm | 4px | 1 |
| md | 10px | 1 |
| lg | 16px | 53 |
| xl | 24px | 22 |
| full | 9999px | 1 |

## Box Shadows

**sm** — blur: 0px
```css
box-shadow: rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.04) 0px 1px 2px 0px;
```

**md** — blur: 12px
```css
box-shadow: rgba(0, 0, 0, 0.2) 0px 4px 12px 0px;
```

## CSS Custom Properties

### Colors

```css
--primary: #684D95;
--primary-hover: #563f7b;
--border: rgba(107, 114, 128, .3);
--text-secondary: rgba(107, 114, 128, .8);
```

### Typography

```css
--text-main: #1F1F2C;
--font-main: "TT Hoves", Arial, sans-serif;
```

### Radii

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 24px;
```

### Other

```css
--background: #F4F3EE;
--surface: #FFFFFF;
--success: #10B981;
--danger: #EF4444;
```

### Semantic

```css
success: [object Object];
warning: [object Object];
error: [object Object];
info: [object Object];
```

## Breakpoints

| Name | Value | Type |
|------|-------|------|
| sm | 700px | max-width |

## Transitions & Animations

**Easing functions:** `[object Object]`, `[object Object]`

**Durations:** `0.3s`, `0.15s`, `0.2s`

### Common Transitions

```css
transition: all;
transition: color 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.3s cubic-bezier(0.4, 0, 0.2, 1), fill 0.3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.3s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.3s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.3s cubic-bezier(0.4, 0, 0.2, 1);
transition: color 0.15s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), outline-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), text-decoration-color 0.15s cubic-bezier(0.4, 0, 0.2, 1), fill 0.15s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-from 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-via 0.15s cubic-bezier(0.4, 0, 0.2, 1), --tw-gradient-to 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1), translate 0.15s cubic-bezier(0.4, 0, 0.2, 1), scale 0.15s cubic-bezier(0.4, 0, 0.2, 1), rotate 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: opacity 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
transition: 0.2s cubic-bezier(0, 0, 0.2, 1);
```

### Keyframe Animations

**spin**
```css
@keyframes spin {
  100% { transform: rotate(360deg); }
}
```

**pulse**
```css
@keyframes pulse {
  50% { opacity: 0.5; }
}
```

## Component Patterns

Detected UI component patterns and their most common styles:

### Buttons (6 instances)

```css
.button {
  background-color: oklab(0 0 0 / 0.06);
  color: oklab(0.251622 0.00462651 0.0110142 / 0.4);
  font-size: 16px;
  font-weight: 500;
  padding-top: 6px;
  padding-right: 6px;
  border-radius: 12px;
}
```

### Inputs (1 instances)

```css
.input {
  background-color: rgb(255, 255, 255);
  color: rgb(38, 33, 28);
  border-color: oklab(0 0 0 / 0.1);
  border-radius: 12px;
  font-size: 18px;
  padding-top: 8px;
  padding-right: 20px;
}
```

### Links (199 instances)

```css
.link {
  color: rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 400;
}
```

### Footer (1 instances)

```css
.foote {
  color: rgb(0, 0, 0);
  padding-top: 0px;
  padding-bottom: 0px;
  font-size: 16px;
}
```

## Component Clusters

Reusable component instances grouped by DOM structure and style similarity:

### Button — 2 instances, 1 variant

**Variant 1** (2 instances)

```css
  background: rgba(0, 0, 0, 0);
  color: oklab(0.251622 0.00462651 0.0110142 / 0.6);
  padding: 4px 10px 4px 10px;
  border-radius: 24px;
  border: 0px solid oklab(0.251622 0.00462651 0.0110142 / 0.6);
  font-size: 14px;
  font-weight: 500;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgba(0, 0, 0, 0);
  color: oklab(0.251622 0.00462651 0.0110142 / 0.7);
  padding: 6px 6px 6px 6px;
  border-radius: 0px;
  border: 0px solid oklab(0.251622 0.00462651 0.0110142 / 0.7);
  font-size: 16px;
  font-weight: 500;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: oklab(0 0 0 / 0.06);
  color: rgb(0, 0, 0);
  padding: 16px 20px 16px 20px;
  border-radius: 12px;
  border: 0px solid rgb(0, 0, 0);
  font-size: 16px;
  font-weight: 500;
```

### Input — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(255, 255, 255);
  color: rgb(38, 33, 28);
  padding: 8px 20px 8px 20px;
  border-radius: 12px;
  border: 1px solid oklab(0 0 0 / 0.1);
  font-size: 18px;
  font-weight: 400;
```

### Button — 1 instance, 1 variant

**Variant 1** (1 instance)

```css
  background: rgb(104, 77, 149);
  color: rgb(255, 255, 255);
  padding: 16px 24px 16px 24px;
  border-radius: 12px;
  border: 0px solid rgb(255, 255, 255);
  font-size: 18px;
  font-weight: 500;
```

## Layout System

**3 grid containers** and **241 flex containers** detected.

### Container Widths

| Max Width | Padding |
|-----------|---------|
| 1200px | 8px |
| 512px | 0px |
| 100% | 0px |

### Grid Column Patterns

| Columns | Usage Count |
|---------|-------------|
| 6-column | 1x |
| 5-column | 1x |
| 3-column | 1x |

### Grid Templates

```css
grid-template-columns: 211.188px 211.203px 211.203px 211.203px 211.188px;
gap: 24px;
grid-template-columns: 190.656px 190.672px 190.672px 190.656px 190.672px 190.672px;
gap: 8px;
grid-template-columns: 376px 376px 376px;
gap: 12px;
```

### Flex Patterns

| Direction/Wrap | Count |
|----------------|-------|
| column/nowrap | 34x |
| row/nowrap | 200x |
| row/wrap | 7x |

**Gap values:** `10px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `4px`, `4px 16px`, `6px`, `8px`

## Accessibility (WCAG 2.1)

**Overall Score: 100%** — 1 passing, 0 failing color pairs

### Passing Color Pairs

| Foreground | Background | Ratio | Level |
|------------|------------|-------|-------|
| `#ffffff` | `#684d95` | 6.81:1 | AAA |

## Design System Score

**Overall: 94/100 (Grade: A)**

| Category | Score |
|----------|-------|
| Color Discipline | 100/100 |
| Typography Consistency | 90/100 |
| Spacing System | 100/100 |
| Shadow Consistency | 100/100 |
| Border Radius Consistency | 90/100 |
| Accessibility | 100/100 |
| CSS Tokenization | 75/100 |

**Strengths:** Tight, disciplined color palette, Consistent typography system, Well-defined spacing scale, Clean elevation system, Consistent border radii, Strong accessibility compliance, Good CSS variable tokenization

**Issues:**
- 766 duplicate CSS declarations

## Z-Index Map

**1 unique z-index values** across 1 layers.

| Layer | Range | Elements |
|-------|-------|----------|
| sticky | 50,50 | header.s.t.i.c.k.y. .t.o.p.-.0. .z.-.5.0. .t.r.a.n.s.i.t.i.o.n.-.c.o.l.o.r.s. .d.u.r.a.t.i.o.n.-.3.0.0. .b.o.r.d.e.r.-.b. .b.g.-.[.#.f.4.f.3.e.e.]. .b.o.r.d.e.r.-.b.l.a.c.k./.[.0...0.6.] |

## SVG Icons

**13 unique SVG icons** detected. Dominant style: **outlined**.

| Size Class | Count |
|------------|-------|
| xs | 5 |
| sm | 4 |
| md | 4 |

**Icon colors:** `#26211c`, `currentColor`, `#1abcfe`, `#0acf83`, `#ff7262`, `#f24e1e`, `#a259ff`, `rgb(0, 0, 0)`, `#1ABCFE`, `#0ACF83`

## Font Files

| Family | Source | Weights | Styles |
|--------|--------|---------|--------|
| TT Hoves | self-hosted | 400, 500, 600 | normal |
| Relative Book | self-hosted | 400 | normal |

## Image Style Patterns

| Pattern | Count | Key Styles |
|---------|-------|------------|
| thumbnail | 175 | objectFit: fill, borderRadius: 0px, shape: square |
| gallery | 1 | objectFit: fill, borderRadius: 0px, shape: square |
| general | 1 | objectFit: fill, borderRadius: 10px, shape: rounded |

**Aspect ratios:** 1:1 (175x), 2:3 (1x), 7.42:1 (1x)

## Quick Start

To recreate this design in a new project:

1. **Install fonts:** Add `TT Hoves` from Google Fonts or your font provider
2. **Import CSS variables:** Copy `variables.css` into your project
3. **Tailwind users:** Use the generated `tailwind.config.js` to extend your theme
4. **Design tokens:** Import `uiextractor-tokens.json` for tooling integration