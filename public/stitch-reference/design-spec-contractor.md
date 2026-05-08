---
name: Trades Pro
colors:
  surface: '#f8f9fa'
  surface-dim: '#e9ecef'
  surface-bright: '#ffffff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3f5'
  surface-container: '#e9ecef'
  surface-container-high: '#dee2e6'
  surface-container-highest: '#ced4da'
  on-surface: '#0d0d0d'
  on-surface-variant: '#2c2c2c'
  inverse-surface: '#1a1a1a'
  inverse-on-surface: '#f8f9fa'
  outline: '#6c757d'
  outline-variant: '#adb5bd'
  primary: '#0a2342'
  on-primary: '#ffffff'
  primary-container: '#1a3a5c'
  on-primary-container: '#cfe2ff'
  inverse-primary: '#a8c7fa'
  secondary: '#ff6b00'
  on-secondary: '#ffffff'
  secondary-container: '#fff0e0'
  on-secondary-container: '#cc5500'
  tertiary: '#1a1a1a'
  on-tertiary: '#ffffff'
  tertiary-container: '#2c2c2c'
  on-tertiary-container: '#e0e0e0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  background: '#f8f9fa'
  on-background: '#0d0d0d'
  surface-variant: '#dee2e6'
  emergency: '#d62828'
  on-emergency: '#ffffff'
  trust-green: '#2d6a4f'
  on-trust-green: '#ffffff'
typography:
  h1:
    fontFamily: Barlow Condensed
    fontSize: 72px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: -0.01em
    textTransform: uppercase
  h2:
    fontFamily: Barlow Condensed
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.01em
    textTransform: uppercase
  h3:
    fontFamily: Barlow Condensed
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  phone:
    fontFamily: Barlow Condensed
    fontSize: 42px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Source Sans 3
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Source Sans 3
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-caps:
    fontFamily: Source Sans 3
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.1em
    textTransform: uppercase
rounded:
  sm: 0.25rem
  DEFAULT: 0.375rem
  md: 0.5rem
  lg: 0.75rem
  xl: 1rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1200px
  gutter: 24px
  margin-page: 48px
  stack-sm: 16px
  stack-md: 40px
  stack-lg: 72px
---

## Brand & Style

Trades Pro is built for home services contractors — plumbers, electricians, HVAC technicians, roofers, and general handymen. The design system communicates **strength, reliability, and immediate action**. This is not a decorative brand. Every element earns its place by making the business easier to trust and easier to contact.

The aesthetic is **Bold Industrial** — high contrast, structural, no-nonsense. It borrows from safety signage, utility vehicles, and work gear: the things contractors actually use every day. The primary colors are deep navy and safety orange, two colors that together signal professionalism and urgency in the trades world.

The #1 design goal: **make the phone number impossible to ignore.** On mobile, a sticky header with the phone number visible at all times is mandatory. Second goal: establish trust fast — license badges, insurance confirmation, years in business, and Google review stars should appear above the fold.

## Colors

- **Primary Navy (#0a2342):** Used for headers, footers, nav, and primary buttons. Deep, authoritative, trusted.
- **Safety Orange (#ff6b00):** Used for CTAs, emergency call buttons, highlights, and accent elements. High visibility, urgency, action.
- **Emergency Red (#d62828):** Reserved exclusively for 24/7 emergency service badges and emergency call buttons. Never use for decorative purposes.
- **Trust Green (#2d6a4f):** Used only for trust badges — "Licensed," "Insured," "Guaranteed." Signals safety and compliance.
- **Backgrounds:** Light gray (#f8f9fa) for page background. Pure white (#ffffff) for cards and content panels. This separation gives content clear definition without heavy borders.
- **Text:** Near-black (#0d0d0d) for maximum readability. Never use pure black or gray text on orange backgrounds — always use white.

## Typography

Dramatic contrast between condensed, uppercase headline muscle and clean readable body text.

- **Headlines (Barlow Condensed):** All major headings should be uppercase, condensed, and heavy. Barlow Condensed at 800 weight gives the visual weight of a contractor's truck decal — confident, no-frills, immediately readable at a distance. H1 at 72px acts as a shout. Use it for hero headlines like "WE FIX IT RIGHT THE FIRST TIME."
- **Phone Numbers:** Always set in Barlow Condensed at the largest available size. The phone number is the most important element on any contractor website. Treat it like a headline.
- **Body (Source Sans 3):** Clean, neutral, highly legible for service descriptions, FAQs, and trust copy. Pairs with Barlow Condensed without competing.
- **Labels:** Source Sans 3 uppercase with wide letter spacing for section labels, badge text, and category tags.

## Layout & Spacing

- **Rhythm:** 8px base unit.
- **Grid:** 12-column grid, 24px gutters. Tighter than editorial — contractor sites are functional, not gallery-like.
- **Mobile-First:** Design every section as if the user is on a phone in a driveway looking for a plumber. Thumb-friendly tap targets (48px minimum). Phone number always in the top right of the sticky nav.
- **Sections:** Large stack-lg (72px) gaps between major sections. Each section should feel like a standalone argument for hiring this contractor — don't crowd them.

## Elevation & Depth

- **Cards:** Light drop shadow with navy tint (rgba(10,35,66,0.12)) at 0 4px 16px. On hover, shadow deepens to 0 8px 24px — simulating physical lift.
- **Buttons:** Primary orange CTA buttons use a warm shadow (rgba(255,107,0,0.35)) to make them appear to glow slightly — reinforcing urgency.
- **Hero Section:** Full-width dark navy or image overlay. White text on navy reads instantly. Never use light backgrounds for the hero on a contractor site.

## Shapes

Functional, no-nonsense geometry. Slight rounding softens without going soft.

- **Buttons:** 6px radius. Solid, chunky, clickable. Pill shapes are too playful for trades.
- **Cards:** 12px radius. Enough to feel modern without losing structural authority.
- **Badges (Licensed, Insured, etc.):** 4px radius or full pill — these are the exception where pill shapes work, as they echo real-world certification badges.
- **Emergency CTA:** Zero radius — hard corners signal urgency and seriousness. This button should look like a switch you flip in an emergency.

## Components

### Sticky Navigation
Navy background. Logo left. Phone number right — always visible, large, Barlow Condensed. On mobile, phone number becomes a tap-to-call button. "Get a Free Quote" CTA button in orange sits next to the phone number on desktop.

### Hero Section
Full-width dark overlay (navy or dark image). Large Barlow Condensed h1 in white. Subheadline in Source Sans 3 at 20px. Two buttons: primary orange "Call Now" and secondary white-outline "Get Free Estimate." Phone number displayed large below buttons. Trust badges row immediately below hero.

### Trust Badges Row
Horizontal strip of 4–5 badge cards on white background immediately below hero. Each badge: icon + bold label. Examples: "Licensed & Insured," "24/7 Emergency," "Free Estimates," "5-Star Rated," "X Years in Business." Use Trust Green for badge backgrounds or navy with white text.

### Services Grid
3-column card grid. Each card: service icon (bold, simple), service name in h3, 1–2 sentence description. Navy top border accent on each card. Orange hover state.

### Google Reviews Section
Star rating displayed large in orange. Total review count. 2–3 quote cards with reviewer name and star rating. "Read All Reviews" link to Google Business Profile.

### Quote Request Form
Simple, high-contrast form. Navy background. White input fields. Orange submit button. Fields: Name, Phone, Service Needed (dropdown), Best Time to Call. Keep it short — contractors want phone calls, not form fills.

### Footer
Navy background. Logo and tagline. Service area list. Quick links. Phone number large in orange. License number displayed (builds trust). Copyright line.

### Buttons
- **Primary (CTA):** Orange (#ff6b00) background, white text, Barlow Condensed bold, 6px radius, warm orange shadow.
- **Emergency:** Red (#d62828) background, white text, 0px radius, no shadow — hard and urgent.
- **Secondary:** Navy outline, navy text on white backgrounds. White outline, white text on dark backgrounds.
- **Disabled:** Gray (#ced4da) background, medium gray text.

### Input Fields
White background, 2px solid border in outline-variant (#adb5bd). On focus: 2px navy border with subtle navy outer glow. Error state: red border. Placeholder text in outline color.

### Cards
White background, rounded-lg (12px), ambient navy shadow. No borders. On hover: shadow deepens, slight translateY(-2px) lift.

### Service Area Chips
Source Sans 3 label-caps. Light gray background (#e9ecef). 4px radius. Used for listing service areas (cities, zip codes) in footer or dedicated service area section.
