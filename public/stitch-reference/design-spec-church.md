---
name: Midnight Editorial
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fd'
  on-secondary-container: '#57657b'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#271901'
  on-tertiary-container: '#98805d'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#d5e3fd'
  secondary-fixed-dim: '#b9c7e0'
  on-secondary-fixed: '#0d1c2f'
  on-secondary-fixed-variant: '#3a485c'
  tertiary-fixed: '#fcdeb5'
  tertiary-fixed-dim: '#dec29a'
  on-tertiary-fixed: '#271901'
  on-tertiary-fixed-variant: '#574425'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  h1:
    fontFamily: Bodoni Moda
    fontSize: 72px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  h2:
    fontFamily: Bodoni Moda
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  h3:
    fontFamily: Bodoni Moda
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: 0.1em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 32px
  margin-page: 64px
  stack-sm: 16px
  stack-md: 32px
  stack-lg: 80px
---

## Brand & Style

The design system is anchored in a high-contrast, editorial aesthetic that balances the authority of traditional broadsheet journalism with the precision of modern high-end SaaS. It is designed to evoke feelings of prestige, intellectual depth, and unwavering reliability.

The style is a blend of **Minimalism** and **High-Contrast Boldness**. It utilizes expansive white space to allow content to breathe, while employing aggressive typographic scales to establish a clear information hierarchy. The interface prioritizes clarity and "quiet luxury," avoiding unnecessary decorative flourishes in favor of structural integrity and premium finishes.

## Colors

The color palette centers on a deep, authoritative Midnight Navy (#0F172A) used for primary actions and key structural elements. This is contrasted against "Crisp White" surfaces to maintain a clean, editorial feel.

- **Primary:** The core navy is used for high-weight text and primary call-to-actions.
- **Neutrals:** A sophisticated range of cool grays provides soft backgrounds and subtle borders, ensuring the interface feels layered without becoming cluttered.
- **Surface Strategy:** Use absolute white (#FFFFFF) for main content cards and containers to create a "printed page" effect against the slightly softer neutral background (#F8FAFC).

## Typography

This design system utilizes a dramatic typographic contrast to achieve its editorial tone.

- **Headlines:** Use **Bodoni Moda** for all major headings. Its high stroke contrast and vertical stress provide a luxurious, fashion-forward editorial feel. H1 elements should be set at an oversized scale to act as a visual anchor.
- **Body:** Use **Inter** for all functional and long-form text. It provides a neutral, highly readable counterpoint to the expressive serif headlines.
- **Labels:** Use Inter in uppercase with increased letter spacing for category tags, small captions, and overlines to create a modern, architectural feel.

## Layout & Spacing

The layout follows a **Fixed Grid** philosophy for desktop, centered within the viewport to mimic a magazine spread.

- **Rhythm:** An 8px base unit governs all dimensions.
- **Grid:** A 12-column grid with generous 32px gutters.
- **Verticality:** Use "Stack" spacing for vertical sections. Large stack-lg (80px+) gaps should separate major content blocks.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layering** rather than heavy borders.

- **Surface Depth:** The primary background is the light neutral. Content sits on top in pure white "sheets."
- **Shadow Signature:** Shadows are deep but highly diffused. Use a primary navy tint in the shadow color (#0F172A at 15% opacity) with a large blur radius (30px+) and a significant vertical offset.
- **Interaction:** On hover, shadows should intensify and expand.

## Shapes

The shape language is **Rounded**, striking a balance between sharp print edges and modern digital softness.

- **Standard Elements:** Buttons and input fields use 0.5rem (8px) radius.
- **Large Containers:** Cards and large sections use 1rem (16px) radius.
- **Exceptions:** Do not use pill shapes or circular buttons unless for icon-only actions.

## Components

### Buttons
Primary buttons feature Midnight Navy background with white text and a "Deep Drop" shadow. Secondary buttons use a crisp 1px navy border with no fill.

### Input Fields
Light gray border (#E2E8F0) that darkens to Midnight Navy on focus, with a subtle 2px outer glow.

### Cards
Pure white with rounded-lg (16px) radius. No borders — defined by Ambient Shadow only.

### Chips & Tags
Use label-caps typography. Light gray background, no shadow.

### Lists
Wide horizontal rules in very light neutral. Generous vertical padding (24px+) between items.
