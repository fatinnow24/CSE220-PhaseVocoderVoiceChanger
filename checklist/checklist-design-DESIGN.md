---
version: alpha
name: "Checklist Design — Warm Neutral Reference"
description: "Checklist Design uses a warm off-white cream background (#f4f3ee) as its global surface, with a single custom typeface (TT Hoves) spanning all typographic roles from 60px display to 12px labels. Category sections are distinguished by soft pastel tints (warm beige for Mobile, cool blue for Web App, muted lavender for Website) applied to large rounded cards (24px radius). Navigation and body text are near-black (#26211c), while a purple primary (#684d95) is reserved for interactive accents. The layout is centered, generous, and scannable. a reference library for UI design checklists."
colors:
  background-cream: "#f4f3ee"
  category-components: "#f0e3db"
  category-flows: "#e3e8e4"
  category-mobile: "#f0ead8"
  category-pages: "#e5e3e8"
  category-web-app: "#dce6f0"
  purple-primary: "#684d95"
  white-surface: "#ffffff"
  dark-text: "#26211c"
  pure-black: "#000000"
  secondary-text: "#57534e"
  border-subtle: "#6b7280"
typography:
  display-hero:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "60px"
    fontWeight: "600"
    lineHeight: "66px"
  section-heading:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: "600"
    lineHeight: "40px"
  card-title:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "20px"
    fontWeight: "600"
    lineHeight: "27.5px"
  body-default:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-medium:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: "500"
    lineHeight: "24px"
  label-small:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "16px"
  caption:
    fontFamily: "TT Hoves, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "20px"
  relative-label:
    fontFamily: "Relative Book, sans-serif"
    fontSize: "14px"
    fontWeight: "500"
    lineHeight: "20px"
rounded:
  radius-sm: "8px"
  radius-md: "12px"
  radius-lg: "24px"
  radius-2xl: "16px"
  radius-3xl: "24px"
  radius-pill: "9999px"
spacing:
  space-1: "4px"
  space-2: "8px"
  space-3: "12px"
  space-4: "16px"
  space-6: "24px"
  space-10: "40px"
  space-16: "64px"
  space-20: "80px"
  space-24: "96px"
---

## Overview

Checklist Design uses a warm off-white cream background (#f4f3ee) as its global surface, with a single custom typeface (TT Hoves) spanning all typographic roles from 60px display to 12px labels. Category sections are distinguished by soft pastel tints (warm beige for Mobile, cool blue for Web App, muted lavender for Website) applied to large rounded cards (24px radius). Navigation and body text are near-black (#26211c), while a purple primary (#684d95) is reserved for interactive accents. The layout is centered, generous, and scannable. a reference library for UI design checklists.

**Signature traits:**
- Dual typeface system: Pairs TT Hoves, Arial, sans-serif and Relative Book, sans-serif across the type hierarchy.
- Soft, rounded geometry: Generous corner rounding up to 9999px.

## Colors

The palette uses 12 validated color tokens across 1 theme profile. Semantic roles stay attached to observed usage so generation agents can choose accents without inventing new color meaning.

**Semantic naming:**
- **surface-background** maps to `background-cream`: Role "background" is grounded by usage context "Global page background and primary surface; CSS var --background, --color-cream, --color-background".
- **content-text** maps to `dark-text`: Role "text" is grounded by usage context "Primary heading and body text color; CSS var --color-dark".
- **action-text** maps to `pure-black`: Role "text" is grounded by usage context "Link and icon color at highest contrast; most frequent CSSOM hit (1331)".
- **action-background** maps to `purple-primary`: Role "background" is grounded by usage context "Brand accent, CTA buttons, interactive highlights; CSS var --primary".

### Text Scale
- **Dark Text** (#26211c): Primary heading and body text color; CSS var --color-dark. Role: text. {authored: rgb(38, 33, 28), space: rgb}
- **Pure Black** (#000000): Link and icon color at highest contrast; most frequent CSSOM hit (1331). Role: text. {authored: rgb(0, 0, 0), space: rgb}
- **Secondary Text** (#57534e): Muted secondary text and captions; CSS var --color-gray-600. Role: text. {authored: rgb(87, 83, 78), space: rgb}

### Interactive
- **Border Subtle** (#6b7280): Hairline borders and dividers at 30% opacity; CSS var --border. Role: border.

### Surface & Shadows
- **Background Cream** (#f4f3ee): Global page background and primary surface; CSS var --background, --color-cream, --color-background. Role: background. {authored: rgb(244, 243, 238), space: rgb}
- **Category Components** (#f0e3db): Components category card background tint; CSS var --color-cat-components. Role: background. {authored: rgb(240, 227, 219), space: rgb}
- **Category Flows** (#e3e8e4): Flows category card background tint; CSS var --color-cat-flows. Role: background. {authored: rgb(227, 232, 228), space: rgb}
- **Category Mobile** (#f0ead8): Mobile app category card background tint; CSS var --color-cat-mobile. Role: background. {authored: rgb(240, 234, 216), space: rgb}
- **Category Pages** (#e5e3e8): Website/pages category card background tint; CSS var --color-cat-pages. Role: background. {authored: rgb(229, 227, 232), space: rgb}
- **Category Web App** (#dce6f0): Web app category card background tint; CSS var --color-cat-webapp. Role: background. {authored: rgb(220, 230, 240), space: rgb}
- **Purple Primary** (#684d95): Brand accent, CTA buttons, interactive highlights; CSS var --primary. Role: background. {authored: rgb(104, 77, 149), space: rgb}
- **White Surface** (#ffffff): Card chip backgrounds and modal surfaces; CSS var --surface, --color-white. Role: background. {authored: rgb(255, 255, 255), space: rgb}

## Typography

Typography uses TT Hoves, Arial, sans-serif, Relative Book, sans-serif across extracted hierarchy roles. Keep hierarchy mapped to these token rows before adding decorative type styles.

Mixes TT Hoves, Arial, sans-serif and Relative Book, sans-serif for visual contrast. Weight range spans semi-bold, regular, medium. Sizes range from 12px to 60px.

### Font Roles
- **Headline Font**: TT Hoves
- **Body Font**: TT Hoves

### Type Scale Evidence
| Role | Font | Size | Weight | Line Height | Letter Spacing | Stack / Features | Notes |
|------|------|------|--------|-------------|----------------|------------------|-------|
| Hero headline — 'Check every detail, ship better work.' Probe-confirmed at 60px/w600 | TT Hoves, Arial, sans-serif | 60px | 600 | 66px | -3% | TT Hoves, Arial, sans-serif | Extracted token |
| Category section titles (Mobile app, Web app, Website) | TT Hoves, Arial, sans-serif | 32px | 600 | 40px | -3% | TT Hoves, Arial, sans-serif | Extracted token |
| Sub-section or card headings | TT Hoves, Arial, sans-serif | 20px | 600 | 27.5px | -1% | TT Hoves, Arial, sans-serif | Extracted token |
| Primary body text, navigation links, chip labels — most frequent CSSOM tuple (×807) | TT Hoves, Arial, sans-serif | 16px | 400 | 24px | -1% | TT Hoves, Arial, sans-serif | Extracted token |
| Emphasized body text, nav active states | TT Hoves, Arial, sans-serif | 16px | 500 | 24px | -1% | TT Hoves, Arial, sans-serif | Extracted token |
| Small labels, badges, metadata tags | TT Hoves, Arial, sans-serif | 12px | 500 | 16px | -1% | TT Hoves, Arial, sans-serif | Extracted token |
| Subtitle text, secondary descriptions | TT Hoves, Arial, sans-serif | 14px | 400 | 20px | -1% | TT Hoves, Arial, sans-serif | Extracted token |
| Special label usage — 'Agent skill' / 'Figma skill' tool badges | Relative Book, sans-serif | 14px | 500 | 20px | -1% | Relative Book, sans-serif | Extracted token |

## Layout

Responsive system uses 1 breakpoint tier(s): mobile.

This system uses a 4px base grid with scale values 4, 8, 12, 16, 24, 32, 40, 64, 80, 96.

### Responsive Strategy
- **mobile (<= 700px)**: Constrain layout for small viewports and prioritize vertical stacking.

### Spacing System
| Token | Value | Px | Notes |
|------|-------|----|-------|
| space-1 | 4px | 4 | Mapped to --spacing |
| space-2 | 8px | 8 | Extracted spacing token |
| space-3 | 12px | 12 | Extracted spacing token |
| space-4 | 16px | 16 | Extracted spacing token |
| space-6 | 24px | 24 | Extracted spacing token |
| space-10 | 40px | 40 | Extracted spacing token |
| space-16 | 64px | 64 | Extracted spacing token |
| space-20 | 80px | 80 | Extracted spacing token |
| space-24 | 96px | 96 | Extracted spacing token |

## Elevation & Depth

Keep depth flat unless validated shadow or interaction evidence appears in the extraction payload. Do not invent shadows beyond this evidence boundary.

### Shadow Evidence
| Shadow Token | Layers | Details |
|--------------|--------|---------|
| n/a | 0 | No validated shadow payload |

### Interaction Signals
| Theme | Signal | Evidence |
|-------|--------|----------|
| Light | outline-color | rgb(0, 0, 0) ; oklab(0.251625 0.00462955 0.0110119 / 0.8) ; rgb(38, 33, 28) |
| Light | outline-width | 3px |
| Light | outline-offset | 0px |
| Light | transform | matrix(1, 0, 0, 1, 0, -0.5) ; matrix(1, 0, 0, 1, -1, -0.5) ; matrix(1, 0, 0, 1, 0, 0) |

## Shapes

Shape language maps directly to rounded tokens. Keep component corners consistent with the role mapping below before introducing bespoke geometry.

### Radius Roles
| Token | Value | Px | Role Mapping |
|------|-------|----|--------------|
| radius-sm | 8px | 8 | Control corner |
| radius-md | 12px | 12 | Control corner |
| radius-2xl | 16px | 16 | Card corner |
| radius-lg | 24px | 24 | Large surface corner |
| radius-pill | 9999px | 9999 | Large surface corner |

### Geometry Evidence
| Radius Token | Shape | Units |
|--------------|-------|-------|
| radius-sm | 8px | px |
| radius-md | 12px | px |
| radius-lg | 24px | px |
| radius-2xl | 16px | px |
| radius-3xl | 24px | px |
| radius-pill | 9999px | px |

## Components

(none detected)

## Do's and Don'ts

Guardrails protect Dual typeface system, Soft, rounded geometry without adding unsupported visual claims.

| Do | Don't |
|----|---------|
| Do maintain consistent spacing using the base grid | Don't make unsupported claims about absent visual features |
| Do maintain WCAG AA contrast ratios (4.5:1 for normal text) | Don't mix rounded and sharp corners in the same view |
| Do use the primary color only for the single most important action per screen |  |
| Do verify evidence before writing new design-system guidance |  |

## Responsive Evidence

### Breakpoints
| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | <= 700px | (max-width: 700px) |

## Agent Prompt Guide

### Example Component Prompts
- Create button component using validated primary color role and spacing tokens.
- Create card component with mapped radius role and evidence-backed elevation.
- Create form input component using inferred typography hierarchy and border roles.

### Iteration Guide
1. Start with extracted palette and typography roles only.
2. Map spacing and radius directly from token tables before visual polish.
3. Apply component patterns one section at a time and compare against source intent.
4. Keep elevation claims tied to explicit evidence in output.
5. Iterate with smallest diffs and re-check section hierarchy after each change.
