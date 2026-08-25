---
name: Serene Logic
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#414846'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#727976'
  outline-variant: '#c1c8c5'
  surface-tint: '#49645d'
  primary: '#49645d'
  on-primary: '#ffffff'
  primary-container: '#a7c4bc'
  on-primary-container: '#37524c'
  inverse-primary: '#afcdc5'
  secondary: '#396477'
  on-secondary: '#ffffff'
  secondary-container: '#bae6fd'
  on-secondary-container: '#3d687c'
  tertiary: '#5a5f62'
  on-tertiary: '#ffffff'
  tertiary-container: '#babec2'
  on-tertiary-container: '#484d50'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cbe9e0'
  primary-fixed-dim: '#afcdc5'
  on-primary-fixed: '#04201b'
  on-primary-fixed-variant: '#314c46'
  secondary-fixed: '#bee9ff'
  secondary-fixed-dim: '#a1cde3'
  on-secondary-fixed: '#001f2a'
  on-secondary-fixed-variant: '#1e4c5f'
  tertiary-fixed: '#dfe3e7'
  tertiary-fixed-dim: '#c3c7cb'
  on-tertiary-fixed: '#171c1f'
  on-tertiary-fixed-variant: '#43474b'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
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

This design system is built on the principles of **Soft Minimalism** and **Organic Professionalism**. It prioritizes cognitive ease by utilizing a "no-border" philosophy, where hierarchy is defined through subtle tonal shifts and soft, ambient shadows rather than harsh lines. 

The aesthetic is designed to feel approachable yet highly organized, evoking feelings of calm productivity and clarity. It is particularly suited for health, wellness, and productivity applications where the user needs to feel focused and unhurried. The visual mood is airy and breathable, leaning heavily on generous whitespace and a "squishy" tactile quality in its interactive elements.

## Colors

The palette is anchored in nature-inspired tones. 
- **Primary (Sage Green):** Used for success states, primary progress indicators, and subtle accents that ground the UI.
- **Secondary (Sky Blue):** Primarily used for high-interest data visualizations and large interactive surfaces to create a sense of openness.
- **Background & Surface:** We use a cool off-white (`#F8FAFC`) for the main canvas to allow the pure white (`#FFFFFF`) component cards to "float" with maximum clarity.
- **Typography:** Deep slate neutrals are used instead of pure black to maintain the soft aesthetic while ensuring high legibility.

## Typography

**Manrope** is selected for its geometric yet warm character. It offers excellent legibility in data-heavy views while maintaining the modern, balanced look required for a soft UI.

- **Headlines:** Use tighter letter-spacing and heavier weights to create focal points.
- **Body Text:** Ample line-height (1.5x) is essential to preserve the "airy" feel of the design system.
- **Labels:** Small, all-caps labels are used sparingly for category headers to provide organizational structure without adding visual bulk.

## Layout & Spacing

The layout follows a **Fluid Content Model** within a 12-column grid for desktop and a single-column stack for mobile. 

- **Soft Grid:** Layout is driven by inner-padding rather than external borders.
- **Safe Margins:** A minimum of 24px side-padding is maintained on mobile to prevent the UI from feeling cramped.
- **Spacing Rhythm:** Based on an 8px base unit. Component internal padding should default to 16px or 24px to ensure the "Large Card" aesthetic feels intentional.
- **Data Viz:** Fluid charts should span the full width of their parent container, using the gutter width (16px) as the consistent gap between data bars.

## Elevation & Depth

Depth is the primary driver of hierarchy in this design system. We use **Ambient Shadows** exclusively.

- **Base Layer:** Background (`#F8FAFC`).
- **Level 1 (Cards/Buttons):** Pure white surfaces with a very soft, diffused shadow: `0px 10px 30px rgba(0, 0, 0, 0.04)`.
- **Level 2 (Active/Floating):** Used for modals or active states. A slightly more pronounced shadow with a hint of the primary color: `0px 20px 40px rgba(167, 196, 188, 0.15)`.
- **Inner Depth (Inputs):** Subtle inset shadows can be used for input fields or toggle tracks to give a "stamped" appearance into the surface.

## Shapes

The shape language is consistently **Rounded**. Sharp corners are strictly prohibited as they conflict with the soft brand personality.

- **Primary Cards:** Use `rounded-xl` (1.5rem / 24px) to create a friendly, tablet-like feel.
- **Interactive Elements (Buttons/Toggles):** Use `rounded-lg` (1rem / 16px).
- **Icons & Small Tags:** Use `rounded-lg` or full circles (pill-shaped) for a playful touch.

## Components

- **Cards:** The core container. Cards must never have borders. They rely on white fills against the off-white background and soft shadows. Use internal padding of 24px.
- **Toggle Buttons:** Designed as a "track and pill" system. The track has a subtle inset shadow, and the active pill uses the Primary Sage color.
- **Fluid Data Viz:** Charts use rounded-cap bars and soft gradients. Bars should have high-contrast textures (like diagonal hatching) to signify active states without relying solely on color.
- **Interactive Icons:** Icons are housed within soft-colored circles (e.g., Sky Blue or Sage Green at 10-15% opacity) to make them feel like distinct, touchable targets.
- **Input Fields:** Flat, colored backgrounds (`#F1F5F9`) with no borders. Focus states are indicated by a subtle glow shadow rather than a stroke.
- **Action Chips:** Small, pill-shaped elements used for filtering. When active, they take on the Primary color with white text.