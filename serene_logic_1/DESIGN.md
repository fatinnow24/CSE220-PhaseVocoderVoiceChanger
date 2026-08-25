---
name: Serene Logic
colors:
  surface: '#121413'
  surface-dim: '#121413'
  surface-bright: '#383939'
  surface-container-lowest: '#0d0f0e'
  surface-container-low: '#1a1c1b'
  surface-container: '#1e201f'
  surface-container-high: '#292a29'
  surface-container-highest: '#333534'
  on-surface: '#e3e2e1'
  on-surface-variant: '#c1c8c5'
  inverse-surface: '#e3e2e1'
  inverse-on-surface: '#2f3130'
  outline: '#8b928f'
  outline-variant: '#414846'
  surface-tint: '#a9cec4'
  primary: '#aacfc4'
  on-primary: '#13362f'
  primary-container: '#8fb3a9'
  on-primary-container: '#24463e'
  inverse-primary: '#43655c'
  secondary: '#95ceec'
  on-secondary: '#003547'
  secondary-container: '#034f68'
  on-secondary-container: '#87c0dd'
  tertiary: '#f0bbb1'
  on-tertiary: '#492721'
  tertiary-container: '#d2a097'
  on-tertiary-container: '#5a3630'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#c5eadf'
  primary-fixed-dim: '#a9cec4'
  on-primary-fixed: '#00201a'
  on-primary-fixed-variant: '#2b4d45'
  secondary-fixed: '#c0e8ff'
  secondary-fixed-dim: '#95ceec'
  on-secondary-fixed: '#001e2b'
  on-secondary-fixed-variant: '#004d66'
  tertiary-fixed: '#ffdad4'
  tertiary-fixed-dim: '#efbab1'
  on-tertiary-fixed: '#30130e'
  on-tertiary-fixed-variant: '#623d36'
  background: '#121413'
  on-background: '#e3e2e1'
  surface-variant: '#333534'
  surface-charcoal: '#121417'
  surface-navy: '#1A1F26'
  sage-muted: '#3D524C'
  blue-muted: '#2E4756'
typography:
  display:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  title-md:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-padding: 24px
  gutter: 16px
  card-gap: 20px
  section-margin: 32px
---

## Brand & Style

This design system is a sophisticated evolution of the original aesthetic, adapted for high-end low-light environments. It transitions from an "airy" feel to a **"Deep Focus"** atmosphere, utilizing **Modern Minimalism** with a focus on depth and tonal layering. The brand personality remains calm and professional, but moves toward a more technical, immersive experience.

The visual style is defined by **Tonal Layers** and **Glassmorphic** accents. Instead of the "no-border" philosophy of the light mode, this system uses subtle inner-glows and varying surface luminosities to establish hierarchy. The emotional response is one of "Quiet Authority"—a workspace that feels private, focused, and gentle on the eyes for extended productivity.

## Colors

The palette is optimized for dark mode accessibility, replacing the high-luminance light backgrounds with a hierarchy of deep charcoals and muted navies.

- **Primary (Sage Green):** Shifted to a desaturated, lighter tint (`#8FB3A9`) to ensure it "pops" against dark surfaces without causing eye strain.
- **Secondary (Sky Blue):** Adjusted to a more crystalline, luminous tone (`#7CB5D2`) to maintain visibility in data visualizations.
- **Background:** A deep, neutral charcoal (`#121417`) serves as the base canvas.
- **Surfaces:** Components use a slightly lifted dark navy (`#1A1F26`) to create a perceptible difference between the background and the interface elements.
- **Typography:** High-contrast off-whites and cool grays are used to ensure maximum readability while avoiding the harshness of pure white text.

## Typography

**Manrope** remains the typographic anchor, providing a geometric but friendly structure. In this dark variant, font weights for body text are slightly lighter to prevent "ink bleed" (the visual spreading of light text on dark backgrounds).

- **Hierarchy:** High-level headers use the primary color or pure white (`#FFFFFF`) to draw the eye.
- **Reading Comfort:** Body text uses an off-white tint (`#E2E8F0`) to reduce contrast-induced fatigue.
- **Contextual Labels:** Captions and labels use a muted gray (`#94A3B8`) to provide structure without competing with primary content.

## Layout & Spacing

The layout follows a **Fluid Content Model** that respects the dark-mode need for breathing room. Dark interfaces can feel "heavy," so generous spacing is vital.

- **12-Column Grid:** Desktop views utilize a standard 12-column grid with 16px gutters.
- **Negative Space:** Increased margins between sections (32px) ensure that the dark surfaces don't blend into a single monolithic block.
- **Mobile Stack:** Single column with 24px horizontal padding to ensure clear separation from the device bezel.

## Elevation & Depth

In the absence of heavy shadows, elevation is communicated through **Tonal Stepping**.

- **Level 0 (Base):** Background (`#121417`).
- **Level 1 (Cards):** Surface Navy (`#1A1F26`).
- **Level 2 (Active/Modals):** A lighter navy (`#262C36`) with a subtle 1px "inner glow" border (10% white) to define the edge.
- **Shadows:** Shadows are rarely used, but when necessary, they are high-spread, low-opacity blacks (`rgba(0,0,0,0.4)`) used to block out background content behind modals.
- **Interactive Depth:** Hover states are signaled by increasing the surface brightness rather than adding a shadow.

## Shapes

The shape language remains consistently **Rounded**, maintaining the friendly and approachable logic of the original system.

- **Primary Containers:** 1rem (16px) corner radius for most cards and containers.
- **Sub-elements:** 0.5rem (8px) for input fields and smaller nested components.
- **Buttons:** 1rem (16px) or fully pill-shaped for high-priority CTAs to maintain a "tactile" and modern feel.

## Components

- **Cards:** Use the Surface Navy fill. Instead of shadows, use a very subtle `1px` stroke of `#2D3748` to define boundaries against the base background.
- **Input Fields:** Darkened backgrounds (`#0F172A`) with an inset look. Focus states use a `2px` primary sage glow.
- **Buttons:**
    - *Primary:* Solid Sage Green (`#8FB3A9`) with dark navy text for maximum contrast.
    - *Secondary:* Ghost style with a Sky Blue border and text.
- **Chips & Tags:** Pill-shaped. Active chips use a 20% opacity primary tint with solid primary text to create a "glowing" effect.
- **Lists:** Separated by thin, low-opacity dividers (`rgba(255, 255, 255, 0.05)`).
- **Data Viz:** Charts should use the Secondary Sky Blue and Primary Sage Green. In dark mode, these colors should have a subtle gradient from the base color to a slightly more transparent version at the bottom.