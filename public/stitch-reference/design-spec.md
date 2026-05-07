# FreeSites Design System v1.0 — Stitch Export

## How to use this spec

Copy the `<style>` block below verbatim into every generated site's `<head>`.
At the top of the `:root`, override `--accent` and `--accent-l` with the
vertical-specific values. Do NOT add any custom CSS outside of what is provided —
all visual decisions are handled by the design system classes.

---

## Vertical Accent Overrides

| Vertical    | `--accent` | `--accent-l` |
|-------------|------------|--------------|
| Plumbing    | `#1d4ed8`  | `#2563eb`    |
| Electrical  | `#b45309`  | `#d97706`    |
| HVAC        | `#0369a1`  | `#0284c7`    |
| Roofing     | `#c2410c`  | `#ea580c`    |
| Church      | `#6d28d9`  | `#7c3aed`    |

---

## CSS Design Tokens & Component Library

```css
/* =====================================================
   FreeSites Design System v1.0
   Copy this entire block into <style>.
   Override --accent / --accent-l per vertical only.
   ===================================================== */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  /* ── Override per vertical ── */
  --accent:   #4f46e5;
  --accent-l: #6366f1;

  /* ── Fixed palette ── */
  --navy:        #0f172a;
  --navy-2:      #1e293b;
  --orange:      #f97316;
  --orange-l:    #fb923c;
  --green:       #16a34a;
  --red:         #dc2626;
  --bg:          #f8fafc;
  --border:      #e2e8f0;
  --text:        #0f172a;
  --text-muted:  #64748b;
  --white:       #ffffff;

  /* ── Radii ── */
  --r-card: 12px;
  --r-btn:  8px;
  --r-pill: 9999px;
}

/* ── Reset ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-size: 15px; line-height: 1.6;
  color: var(--text); background: var(--bg);
}
img { max-width: 100%; display: block; }
a   { color: inherit; text-decoration: none; }

/* ── Type scale ── */
h1 { font-size: 2.75rem; font-weight: 800; line-height: 1.15; }
h2 { font-size: 1.5rem;  font-weight: 700; line-height: 1.3;  }
h3 { font-size: 1.1rem;  font-weight: 600; }
p  { color: var(--text-muted); }

/* ── Header ── */
.fs-header {
  position: sticky; top: 0; z-index: 100;
  background: var(--navy);
  height: 60px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,.25);
}
.fs-header__logo {
  display: flex; align-items: center; gap: 10px;
  font-size: 1.125rem; font-weight: 700; color: var(--white);
}
.fs-header__logo img { height: 40px; width: auto; }
.fs-header__nav { display: flex; align-items: center; gap: 10px; }

/* ── Buttons ── */
.fs-btn {
  display: inline-flex; align-items: center; justify-content: center;
  gap: 6px; padding: 10px 20px;
  border-radius: var(--r-btn);
  font-size: 0.9rem; font-weight: 600;
  cursor: pointer; border: none; white-space: nowrap;
  transition: transform .15s, box-shadow .15s;
  text-decoration: none;
}
.fs-btn:hover { transform: translateY(-1px); }

.fs-btn--primary {
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-l) 100%);
  color: var(--white);
  box-shadow: 0 4px 12px rgba(0,0,0,.2);
}
.fs-btn--primary:hover { box-shadow: 0 6px 18px rgba(0,0,0,.28); }

.fs-btn--cta {
  background: linear-gradient(135deg, var(--orange) 0%, var(--orange-l) 100%);
  color: var(--white);
  font-size: 1rem; font-weight: 700; padding: 14px 28px;
  box-shadow: 0 4px 14px rgba(249,115,22,.4);
}
.fs-btn--cta:hover { box-shadow: 0 8px 20px rgba(249,115,22,.45); }

.fs-btn--ghost {
  background: rgba(255,255,255,.12);
  color: var(--white);
  border: 1px solid rgba(255,255,255,.3);
}
.fs-btn--ghost:hover { background: rgba(255,255,255,.2); }

.fs-btn--emergency {
  background: var(--red); color: var(--white);
  font-size: 1.1rem; font-weight: 700; padding: 16px 32px;
  box-shadow: 0 4px 14px rgba(220,38,38,.4);
}
.fs-btn--emergency:hover { box-shadow: 0 8px 20px rgba(220,38,38,.5); }

/* ── Hero ── */
.fs-hero {
  background: var(--navy);
  background-image:
    radial-gradient(ellipse at 20% 100%, rgba(79,70,229,.3) 0%, transparent 60%),
    radial-gradient(ellipse at 85% 10%,  rgba(249,115,22,.18) 0%, transparent 55%);
  padding: 80px 24px 72px;
  text-align: center;
}
.fs-hero__eyebrow {
  display: inline-flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,.1);
  border: 1px solid rgba(255,255,255,.2);
  color: rgba(255,255,255,.8);
  font-size: 0.75rem; font-weight: 600; letter-spacing: .06em; text-transform: uppercase;
  padding: 6px 14px; border-radius: var(--r-pill);
  margin-bottom: 20px;
}
.fs-hero h1 { color: var(--white); margin-bottom: 16px; }
.fs-hero__sub {
  font-size: 1.1rem; color: rgba(255,255,255,.7);
  max-width: 560px; margin: 0 auto 32px;
}
.fs-hero__actions { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }
.fs-gradient-text {
  background: linear-gradient(135deg, #fff 0%, #a5b4fc 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}

/* ── Trust Strip ── */
.fs-trust {
  background: var(--white); border-bottom: 1px solid var(--border);
  padding: 20px 24px;
  display: flex; justify-content: center; flex-wrap: wrap; gap: 28px;
}
.fs-trust__item {
  display: flex; align-items: center; gap: 8px;
  font-size: 0.875rem; font-weight: 600; color: var(--text);
}
.fs-trust__icon { font-size: 1.2rem; }

/* ── Sections ── */
.fs-section { padding: 64px 24px; max-width: 1100px; margin: 0 auto; }

.fs-section--dark  { background: var(--navy);   padding: 64px 24px; }
.fs-section--dark p { color: rgba(255,255,255,.7); }
.fs-section--dark h2 { color: var(--white); }

.fs-section--light { background: var(--white);  padding: 64px 24px; }
.fs-section--bg    { background: var(--bg);     padding: 64px 24px; }
.fs-section--accent-bg { background: linear-gradient(135deg, var(--accent) 0%, var(--accent-l) 100%); padding: 64px 24px; }
.fs-section--accent-bg h2,
.fs-section--accent-bg p { color: var(--white); }

.fs-section__inner { max-width: 1100px; margin: 0 auto; }

.fs-section__label {
  font-size: 0.75rem; font-weight: 700; letter-spacing: .08em;
  text-transform: uppercase; color: var(--accent); margin-bottom: 8px;
}
.fs-section--dark .fs-section__label { color: rgba(255,255,255,.6); }
.fs-section__title { margin-bottom: 12px; }
.fs-section__sub {
  font-size: 1rem; color: var(--text-muted); max-width: 560px; margin-bottom: 40px;
}

/* ── Emergency Section ── */
.fs-emergency {
  background: var(--red); padding: 64px 24px; text-align: center; color: var(--white);
}
.fs-emergency__inner { max-width: 680px; margin: 0 auto; }
.fs-emergency h2 { color: var(--white); font-size: 2rem; margin-bottom: 12px; }
.fs-emergency p  { color: rgba(255,255,255,.85); margin-bottom: 28px; }
.fs-emergency__response { font-size: 1.25rem; font-weight: 700; margin-bottom: 28px; color: var(--white); }

/* Floating mobile CTA */
.fs-mobile-cta {
  display: none;
  position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
  padding: 12px 16px; background: var(--red);
}
.fs-mobile-cta a {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; color: var(--white); font-weight: 700; font-size: 1rem;
}
@media (max-width: 640px) { .fs-mobile-cta { display: block; } }

/* ── Card Grid ── */
.fs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
}
.fs-card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r-card); padding: 24px;
  box-shadow: 0 4px 16px rgba(0,0,0,.06);
  transition: box-shadow .15s, transform .15s;
}
.fs-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,.1); transform: translateY(-2px); }
.fs-card--featured { border-color: var(--accent); border-width: 2px; }
.fs-card__icon {
  width: 40px; height: 40px; border-radius: 8px;
  background: linear-gradient(135deg, var(--accent) 0%, var(--accent-l) 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; margin-bottom: 14px;
}
.fs-card__title { font-size: 1rem; font-weight: 600; margin-bottom: 6px; color: var(--text); }
.fs-card__body  { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

/* ── Testimonials ── */
.fs-testimonial {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r-card); padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,.05);
}
.fs-testimonial__stars  { color: #f59e0b; font-size: 1.1rem; margin-bottom: 10px; }
.fs-testimonial__text   { font-style: italic; color: var(--text); margin-bottom: 14px; }
.fs-testimonial__author { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
.fs-rating-hero         { font-size: 1.5rem; font-weight: 700; color: var(--text); margin-bottom: 28px; }

/* ── Contact ── */
.fs-contact-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px; margin-top: 32px;
}
.fs-contact-item {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r-card); padding: 20px 24px;
}
.fs-contact-item__label {
  font-size: 0.75rem; font-weight: 700; letter-spacing: .06em;
  text-transform: uppercase; color: var(--text-muted); margin-bottom: 6px;
}
.fs-contact-item__value { font-weight: 600; color: var(--text); }

/* ── Hours ── */
.fs-hours { width: 100%; border-collapse: collapse; margin-top: 8px; }
.fs-hours td { padding: 4px 8px; font-size: 0.875rem; }
.fs-hours td:first-child { font-weight: 600; color: var(--text); }
.fs-hours td:last-child  { color: var(--text-muted); }

/* ── Service Areas ── */
.fs-areas { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
.fs-areas__pill {
  background: var(--white); border: 1px solid var(--border);
  border-radius: var(--r-pill); padding: 6px 16px;
  font-size: 0.875rem; font-weight: 500; color: var(--text);
}

/* ── Footer ── */
.fs-footer {
  background: var(--navy-2, #1e293b); color: rgba(255,255,255,.55);
  padding: 32px 24px; text-align: center; font-size: 0.8rem;
}
.fs-footer__name { font-weight: 700; color: var(--white); margin-bottom: 8px; }
.fs-footer__social { display: flex; justify-content: center; gap: 16px; margin: 12px 0; }
.fs-footer__social a { color: rgba(255,255,255,.55); }
.fs-footer__social a:hover { color: var(--white); }
.fs-founder-badge { margin-top: 12px; font-size: 0.7rem; color: rgba(255,255,255,.35); }

/* ── Responsive ── */
@media (max-width: 640px) {
  h1 { font-size: 1.75rem; }
  .fs-hero  { padding: 52px 16px 44px; }
  .fs-section { padding: 44px 16px; }
  .fs-section--dark, .fs-section--light,
  .fs-section--bg, .fs-section--accent-bg,
  .fs-emergency { padding: 44px 16px; }
  .fs-card  { padding: 18px 16px; }
  .fs-trust { gap: 16px; }
  .fs-header { padding: 0 16px; }
  .fs-header__nav .fs-btn--ghost { display: none; }
}
```

---

## HTML Component Patterns

Reference patterns for each section. Claude assembles these with business data.

### Header
```html
<header class="fs-header">
  <div class="fs-header__logo">
    <!-- if logoUrl: <img src="{{logoUrl}}" alt="{{businessName}} logo"> -->
    <span>{{businessName}}</span>
  </div>
  <nav class="fs-header__nav">
    <a href="tel:{{phone}}" class="fs-btn fs-btn--primary">📞 {{phone}}</a>
    <!-- if bookingUrl: <a href="{{bookingUrl}}" class="fs-btn fs-btn--ghost">Book Online</a> -->
  </nav>
</header>
```

### Hero
```html
<section class="fs-hero">
  <div class="fs-hero__eyebrow">{{eyebrow pill text}}</div>
  <h1>{{headline}} <span class="fs-gradient-text">{{gradient portion}}</span></h1>
  <p class="fs-hero__sub">{{tagline}}</p>
  <div class="fs-hero__actions">
    <a href="tel:{{phone}}" class="fs-btn fs-btn--cta">📞 Call Now</a>
    <!-- if bookingUrl: <a href="{{bookingUrl}}" class="fs-btn fs-btn--ghost">Book Appointment</a> -->
  </div>
</section>
```

### Trust Strip
```html
<div class="fs-trust">
  <div class="fs-trust__item"><span class="fs-trust__icon">🏆</span> {{yearsInBusiness}} Years Experience</div>
  <div class="fs-trust__item"><span class="fs-trust__icon">✅</span> Licensed &amp; Insured</div>
  <div class="fs-trust__item"><span class="fs-trust__icon">📍</span> Locally Owned</div>
  <!-- if emergency24x7: -->
  <div class="fs-trust__item"><span class="fs-trust__icon">🚨</span> 24/7 Emergency Service</div>
</div>
```

### Emergency Section (only when emergency24x7 is true)
```html
<section class="fs-emergency">
  <div class="fs-emergency__inner">
    <h2>24/7 Emergency Service</h2>
    <p>{{urgency message}}</p>
    <div class="fs-emergency__response">⚡ {{emergencyResponseTime}}</div>
    <a href="tel:{{emergencyPhone}}" class="fs-btn fs-btn--emergency">📞 {{emergencyPhone}}</a>
  </div>
</section>
<div class="fs-mobile-cta">
  <a href="tel:{{emergencyPhone}}">🚨 Emergency? Call Now — {{emergencyPhone}}</a>
</div>
```

### Section wrapper (light background)
```html
<section class="fs-section--light">
  <div class="fs-section__inner fs-section">
    <div class="fs-section__label">{{label}}</div>
    <h2 class="fs-section__title">{{title}}</h2>
    <p class="fs-section__sub">{{subtitle}}</p>
    <!-- content -->
  </div>
</section>
```

### Section wrapper (dark background)
```html
<section class="fs-section--dark">
  <div class="fs-section__inner fs-section">
    <!-- content -->
  </div>
</section>
```

### Service Card Grid
```html
<div class="fs-grid">
  <div class="fs-card"><!-- or fs-card fs-card--featured for highlighted -->
    <div class="fs-card__icon">🔧</div>
    <div class="fs-card__title">{{service name}}</div>
    <p class="fs-card__body">{{service description}}</p>
  </div>
</div>
```

### Testimonial Grid
```html
<!-- if googleRating: -->
<p class="fs-rating-hero">⭐ {{googleRating}} Stars — {{reviewCount}} Google Reviews</p>
<div class="fs-grid">
  <div class="fs-testimonial">
    <div class="fs-testimonial__stars">★★★★★</div>
    <p class="fs-testimonial__text">"{{reviewText}}"</p>
    <div class="fs-testimonial__author">— {{authorName}} · {{source}}</div>
  </div>
</div>
```

### Contact Grid
```html
<div class="fs-contact-grid">
  <div class="fs-contact-item">
    <div class="fs-contact-item__label">Phone</div>
    <div class="fs-contact-item__value"><a href="tel:{{phone}}">{{phone}}</a></div>
  </div>
  <div class="fs-contact-item">
    <div class="fs-contact-item__label">Email</div>
    <div class="fs-contact-item__value"><a href="mailto:{{email}}">{{email}}</a></div>
  </div>
  <div class="fs-contact-item">
    <div class="fs-contact-item__label">Address</div>
    <div class="fs-contact-item__value">{{address}}</div>
  </div>
  <div class="fs-contact-item">
    <div class="fs-contact-item__label">Hours</div>
    <div class="fs-contact-item__value">
      <table class="fs-hours">
        <!-- one <tr><td>Day</td><td>Hours</td></tr> per entry -->
      </table>
    </div>
  </div>
</div>
```

### Service Areas
```html
<div class="fs-areas">
  <span class="fs-areas__pill">{{area}}</span>
</div>
```

### Footer
```html
<footer class="fs-footer">
  <div class="fs-footer__name">{{businessName}}</div>
  <!-- if licenseNumber: <div>License #{{licenseNumber}}</div> -->
  <!-- if social links: -->
  <div class="fs-footer__social">
    <a href="{{url}}">Facebook</a>
  </div>
  <div>© {{year}} {{businessName}}. All rights reserved.</div>
  <!-- if showFounderBadge: -->
  <div class="fs-founder-badge">FreeSites Founding Member · Est. 2026</div>
</footer>
```
