---
name: Industrial Reliability
colors:
  surface: '#f9f9f9'
  surface-dim: '#dadada'
  surface-bright: '#f9f9f9'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f3'
  surface-container: '#eeeeee'
  surface-container-high: '#e8e8e8'
  surface-container-highest: '#e2e2e2'
  on-surface: '#1a1c1c'
  on-surface-variant: '#444748'
  inverse-surface: '#2f3131'
  inverse-on-surface: '#f1f1f1'
  outline: '#747878'
  outline-variant: '#c4c7c7'
  surface-tint: '#5f5e5e'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#1c1b1b'
  on-primary-container: '#858383'
  inverse-primary: '#c8c6c5'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fd8b00'
  on-secondary-container: '#603100'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#1c1b1a'
  on-tertiary-container: '#868382'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e5e2e1'
  primary-fixed-dim: '#c8c6c5'
  on-primary-fixed: '#1c1b1b'
  on-primary-fixed-variant: '#474746'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#e6e2df'
  tertiary-fixed-dim: '#cac6c4'
  on-tertiary-fixed: '#1c1b1a'
  on-tertiary-fixed-variant: '#484645'
  background: '#f9f9f9'
  on-background: '#1a1c1c'
  surface-variant: '#e2e2e2'
typography:
  display-xl:
    fontFamily: Montserrat
    fontSize: 64px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 40px
    fontWeight: '800'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
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
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1.2'
spacing:
  base: 8px
  section-padding: 80px
  gutter: 24px
  container-max: 1280px
---

## Brand & Style

This design system is engineered to evoke the durability of heavy machinery and the precision of expert craftsmanship. It adopts a **High-Contrast / Modern Industrial** aesthetic, prioritizing utility and authority over decorative flair. The visual language communicates a "get it done right the first time" philosophy, targeting homeowners who value expertise, transparency, and rapid response.

The brand personality is grounded in "working man" energy — strong, direct, and unshakeable. By utilizing heavy weights and a rigid structural grid, the interface feels like a high-end tool rather than a generic service site. Every element is designed to build high trust through clarity and immediate visual impact.

## Colors

The palette is rooted in industrial safety and high-visibility standards.

- **Primary (Deep Charcoal):** Used for headers, footers, and primary containers to provide a heavy, grounded foundation.
- **Secondary (Safety Orange #fd8b00):** Reserved strictly for critical actions, alerts, and highlighting expertise. It demands attention against the charcoal background.
- **Neutral Backgrounds:** Crisp white (#FFFFFF) for content areas. Light gray (#f3f3f3) to distinguish service tiers or sections.
- **Utility Colors:** Success green and error red used sparingly but with high saturation for clear status communication.

## Typography

Typography is built for legibility at a glance.

- **Headlines (Montserrat):** Heaviest weights (ExtraBold 800 and Black 900). Geometric, architectural, confident. Use uppercase for Display and Label styles.
- **Body (Inter):** Clean, neutral balance to aggressive headlines. Ensures technical details and pricing are easily digestible.
- **Hierarchy:** Maintain large scale-steps between headlines and body text for a clear "Information First" hierarchy.

## Layout & Spacing

Fixed Grid model for desktop. 12-column structure with 24px gutters. Strict 8px base unit.

- **Sections:** 80px+ vertical padding for high-priority service blocks.
- **Alignment:** Hard left-alignment throughout — no-nonsense, direct.
- **Density:** Generous margins between services, tight internal padding within cards.

## Elevation & Depth

Avoids soft, ethereal shadows. Uses **Bold Borders** and **Tonal Layering** instead.

- **Borders:** All primary components feature solid 2px or 3px border in Deep Charcoal.
- **Hard Shadows:** 4px offset shadow at 100% opacity on hover — no blur. Simulates physical button press.
- **Contrast Stacking:** Safety Orange on Deep Charcoal is the primary method for visual prominence.

## Shapes

**Sharp (0px radius) throughout.** Intentionally avoids rounded corners to align with the physical world of construction and hardware.

- **Buttons & Inputs:** Sharp 90-degree angles.
- **Cards:** No corner radius; defined by heavy 2px borders.
- **Iconography:** Thick-stroke, blocky icons only. No thin or illustrative line work.

## Components

### Buttons
Primary: Safety Orange background, black text, minimum 56px height, uppercase Montserrat Bold. Hard-offset shadow on hover simulates physical switch.

### Service Cards
White background, 2px Charcoal border. Bold icon top-left, Headline-MD title, "Get Quote" button at bottom.

### Trust Badges & Star Ratings
Star ratings in Safety Orange. Trust badges ("Licensed & Insured") styled as heavy-bordered Stamps or Plates — mimicking physical decals on work trucks.

### Contact & Lead Forms
Large high-contrast input fields, labels inside top border. Full-width submit button for maximum prominence.

### Emergency Status Banner
Pulsing "Hazard" style banner at top of viewport for emergency services. Safety Orange with high-contrast black text or stripes. Never dismissable on emergency service pages.
