import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ContentJson } from '../schemas/content.schema';
import { mapContentToPromptPayload } from '../mappers/prompt.mapper';

// ---------------------------------------------------------------------------
// loadDesignSpec — loads the Stitch design spec for the given vertical.
// Contractor verticals share one spec; church uses a separate editorial spec.
// Returns null if the file is missing so generation degrades gracefully.
// ---------------------------------------------------------------------------

const DESIGN_SPEC_DIR = path.join(process.cwd(), 'public', 'stitch-reference');

const DESIGN_SPEC_FILES: Record<string, string> = {
  plumbing:   'design-spec-contractor.md',   // Trades Pro: navy + orange, Barlow Condensed
  hvac:       'design-spec-contractor.md',   // Trades Pro: navy + orange, Barlow Condensed
  electrical: 'design-spec-industrial.md',   // Industrial Reliability: charcoal + orange, Montserrat, sharp
  roofing:    'design-spec-industrial.md',   // Industrial Reliability: charcoal + orange, Montserrat, sharp
  church:     'design-spec-church.md',       // Midnight Editorial: serif Bodoni Moda, editorial
};

export function loadDesignSpec(verticalType: string): string | null {
  const filename = DESIGN_SPEC_FILES[verticalType] ?? 'design-spec-contractor.md';
  try {
    return fs.readFileSync(path.join(DESIGN_SPEC_DIR, filename), 'utf-8');
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// extractDesignSystemBlocks — converts a Stitch markdown export into CSS that
// gets force-injected into every generated site.
//
// The Stitch format uses YAML frontmatter for design tokens (colors, typography,
// spacing, radii). We parse those tokens in code and generate:
//   1. CSS custom properties  (:root { --primary: ...; })
//   2. Typography rules       (h1 { font-family: ...; })
//   3. Full .fs-* component library driven by those variables
//
// This guarantees the exact Stitch design is applied regardless of what CSS
// Claude writes — our post-processor replaces Claude's <style> with this output.
// ---------------------------------------------------------------------------

export interface DesignSystemBlocks {
  css: string | null;
  patterns: string | null;
}

// --- Internal types ---------------------------------------------------------

interface TypographyEntry {
  fontFamily?: string;
  fontSize?: string;
  fontWeight?: string;
  lineHeight?: string;
  letterSpacing?: string;
  textTransform?: string;
}

interface StitchTokens {
  name: string;
  colors: Record<string, string>;
  typography: Record<string, TypographyEntry>;
  rounded: Record<string, string>;
  spacing: Record<string, string>;
}

// --- YAML frontmatter parser ------------------------------------------------

function parseStitchFrontmatter(markdown: string): StitchTokens | null {
  const fmMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) return null;

  const lines = fmMatch[1].split('\n');
  const tokens: StitchTokens = { name: '', colors: {}, typography: {}, rounded: {}, spacing: {} };

  let section: keyof StitchTokens | null = null;
  let typographyKey: string | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const indent = line.search(/\S/);
    const content = line.trim();
    const colonAt = content.indexOf(':');
    if (colonAt === -1) continue;
    const key = content.slice(0, colonAt).trim();
    const val = content.slice(colonAt + 1).trim().replace(/^['"]|['"]$/g, '');

    if (indent === 0) {
      typographyKey = null;
      if (key === 'name') { tokens.name = val; section = null; }
      else if (key === 'colors' || key === 'typography' || key === 'rounded' || key === 'spacing') {
        section = key as keyof StitchTokens;
      }
    } else if (indent === 2) {
      if (section === 'colors')   { if (val) tokens.colors[key] = val; }
      else if (section === 'rounded')  { if (val) tokens.rounded[key] = val; }
      else if (section === 'spacing')  { if (val) tokens.spacing[key] = val; }
      else if (section === 'typography') {
        if (!val) { typographyKey = key; tokens.typography[key] = {}; }
      }
    } else if (indent === 4 && section === 'typography' && typographyKey) {
      (tokens.typography[typographyKey] as Record<string, string>)[key] = val;
    }
  }

  return tokens;
}

// --- CSS generator ----------------------------------------------------------

function buildCssFromTokens(tokens: StitchTokens): string {
  const c = tokens.colors;
  const r = tokens.rounded;

  // Resolve CSS variable values from Stitch token names
  const primary    = c['primary']              ?? '#0f172a';
  const primaryC   = c['primary-container']    ?? '#1e293b';
  const cta        = c['secondary-container']  ?? c['secondary'] ?? '#ff6b00';
  const ctaDark    = c['on-secondary-container'] ?? '#904d00';
  const emergency  = c['emergency']            ?? c['error']     ?? '#dc2626';
  const trust      = c['trust-green']          ?? '#2d6a4f';
  const bg         = c['background']           ?? c['surface']   ?? '#f8f9fa';
  const surface    = c['surface-container-lowest'] ?? '#ffffff';
  const surface2   = c['surface-container-low']    ?? c['surface-container'] ?? '#f3f3f3';
  const surface3   = c['surface-container-high']   ?? '#e8e8e8';
  const border     = c['outline-variant']      ?? '#c4c7c7';
  const text       = c['on-surface']           ?? c['on-background'] ?? '#0d0d0d';
  const textMuted  = c['on-surface-variant']   ?? '#6c757d';

  const rBtn       = r['DEFAULT'] ?? r['md'] ?? '0.375rem';
  const rCard      = r['lg']      ?? r['xl'] ?? '0.75rem';
  const rBadge     = r['sm']      ?? '0.25rem';
  const isSharp    = rBtn === '0px' || rBtn === '0';
  const rEmergency = isSharp ? '0px' : rBtn;

  // Headline and body fonts
  const t = tokens.typography;
  const headEntry  = t['h1'] ?? t['display-xl'];
  const headFont   = headEntry?.fontFamily ?? 'Inter';
  const bodyEntry  = t['body-md'] ?? t['body-lg'];
  const bodyFont   = bodyEntry?.fontFamily ?? 'Inter';
  const h1Size     = headEntry?.fontSize   ?? '3rem';
  const h1Weight   = headEntry?.fontWeight ?? '800';
  const h1Line     = headEntry?.lineHeight ?? '1.1';
  const h1Letter   = headEntry?.letterSpacing ? `letter-spacing:${headEntry.letterSpacing};` : '';
  const h1Case     = headEntry?.textTransform ? `text-transform:${headEntry.textTransform};` : '';
  const h2Entry    = t['h2'] ?? t['headline-lg'];
  const h2Size     = h2Entry?.fontSize   ?? '2.25rem';
  const h2Weight   = h2Entry?.fontWeight ?? '700';
  const h2Line     = h2Entry?.lineHeight ?? '1.2';
  const h2Letter   = h2Entry?.letterSpacing ? `letter-spacing:${h2Entry.letterSpacing};` : '';
  const h2Case     = h2Entry?.textTransform ? `text-transform:${h2Entry.textTransform};` : '';
  const h3Entry    = t['h3'] ?? t['headline-md'];
  const h3Size     = h3Entry?.fontSize   ?? '1.5rem';
  const h3Weight   = h3Entry?.fontWeight ?? '700';

  // Shadow style: hard offset for sharp designs, soft ambient for rounded ones
  const cardShadow  = isSharp
    ? '0 0 0 2px var(--primary)'
    : '0 4px 16px rgba(0,0,0,.08)';
  const cardHover   = isSharp
    ? 'transform:translate(-3px,-3px);box-shadow:5px 5px 0 var(--primary);'
    : 'transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.12);';
  const btnShadow   = isSharp
    ? '4px 4px 0 var(--cta-dark)'
    : '0 4px 14px rgba(0,0,0,.25)';
  const btnHover    = isSharp
    ? 'transform:translate(-2px,-2px);box-shadow:6px 6px 0 var(--cta-dark);'
    : 'transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.3);';
  const headerBorder = isSharp ? `border-bottom:3px solid ${cta};` : '';

  // Google Fonts import
  const fonts = [...new Set([headFont, bodyFont])];
  const fontImport = fonts
    .map(f => `family=${encodeURIComponent(f)}:wght@400;500;600;700;800;900`)
    .join('&');

  return `@import url('https://fonts.googleapis.com/css2?${fontImport}&display=swap');

:root {
  --primary:    ${primary};
  --primary-c:  ${primaryC};
  --cta:        ${cta};
  --cta-dark:   ${ctaDark};
  --emergency:  ${emergency};
  --trust:      ${trust};
  --bg:         ${bg};
  --surface:    ${surface};
  --surface-2:  ${surface2};
  --surface-3:  ${surface3};
  --border:     ${border};
  --text:       ${text};
  --text-muted: ${textMuted};
  --white:      #ffffff;
  --r-btn:      ${rBtn};
  --r-card:     ${rCard};
  --r-badge:    ${rBadge};
  --r-pill:     9999px;
  --r-emergency:${rEmergency};
}

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'${bodyFont}',system-ui,sans-serif;font-size:16px;line-height:1.5;color:var(--text);background:var(--bg);}
img{max-width:100%;display:block;}
a{color:inherit;text-decoration:none;}

h1{font-family:'${headFont}',sans-serif;font-size:${h1Size};font-weight:${h1Weight};line-height:${h1Line};${h1Letter}${h1Case}}
h2{font-family:'${headFont}',sans-serif;font-size:${h2Size};font-weight:${h2Weight};line-height:${h2Line};${h2Letter}${h2Case}}
h3{font-family:'${headFont}',sans-serif;font-size:${h3Size};font-weight:${h3Weight};line-height:1.3;}
p{color:var(--text-muted);line-height:1.6;}

.fs-header{position:sticky;top:0;z-index:100;background:var(--primary);height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;box-shadow:0 2px 8px rgba(0,0,0,.3);${headerBorder}}
.fs-header__logo{display:flex;align-items:center;gap:12px;font-family:'${headFont}',sans-serif;font-size:1.25rem;font-weight:800;color:var(--white);}
.fs-header__logo img{height:40px;width:auto;}
.fs-header__nav{display:flex;align-items:center;gap:10px;}

.fs-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:14px 24px;border-radius:var(--r-btn);font-family:'${headFont}',sans-serif;font-size:1rem;font-weight:700;cursor:pointer;border:none;white-space:nowrap;transition:transform .12s,box-shadow .12s;text-decoration:none;}
.fs-btn--primary{background:var(--cta);color:var(--white);box-shadow:${btnShadow};}
.fs-btn--primary:hover{${btnHover}}
.fs-btn--secondary{background:transparent;color:var(--white);border:2px solid var(--white);}
.fs-btn--secondary:hover{background:rgba(255,255,255,.1);}
.fs-btn--dark{background:var(--primary);color:var(--white);border:2px solid var(--primary);}
.fs-btn--dark:hover{opacity:.85;}
.fs-btn--phone{background:var(--cta);color:var(--white);font-family:'${headFont}',sans-serif;font-size:1.1rem;font-weight:800;padding:10px 20px;border-radius:var(--r-btn);}
.fs-btn--emergency{background:var(--emergency);color:var(--white);border-radius:var(--r-emergency);font-size:1.1rem;font-weight:700;padding:16px 32px;}
.fs-btn--emergency:hover{opacity:.9;transform:translateY(-1px);}
.fs-btn--ghost{background:rgba(255,255,255,.1);color:var(--white);border:1px solid rgba(255,255,255,.35);}
.fs-btn--ghost:hover{background:rgba(255,255,255,.2);}

.fs-hero{background:var(--primary);padding:80px 24px 72px;}
.fs-hero__inner{max-width:1200px;margin:0 auto;}
.fs-hero h1{color:var(--white);margin-bottom:20px;}
.fs-hero__sub{font-size:18px;color:rgba(255,255,255,.72);max-width:620px;margin-bottom:32px;}
.fs-hero__phone{font-family:'${headFont}',sans-serif;font-size:2.25rem;font-weight:800;color:var(--cta);margin-bottom:24px;display:block;}
.fs-hero__actions{display:flex;gap:14px;flex-wrap:wrap;}
.fs-hero__times{font-size:1rem;color:rgba(255,255,255,.75);margin-top:28px;font-weight:500;}

.fs-trust{background:var(--surface);border-bottom:2px solid var(--border);padding:20px 24px;display:flex;justify-content:center;flex-wrap:wrap;gap:24px;}
.fs-trust__item{display:flex;align-items:center;gap:8px;font-size:.875rem;font-weight:700;color:var(--text);}
.fs-trust__badge{background:var(--primary);color:var(--white);padding:3px 10px;border-radius:var(--r-badge);font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;}
.fs-trust__badge--cta{background:var(--cta);color:var(--white);}
.fs-trust__badge--trust{background:var(--trust);color:var(--white);}
.fs-trust__icon{font-size:1.2rem;}

.fs-section{padding:72px 24px;}
.fs-section__inner{max-width:1200px;margin:0 auto;}
.fs-section--dark{background:var(--primary);padding:72px 24px;}
.fs-section--dark h2,.fs-section--dark h3{color:var(--white);}
.fs-section--dark p{color:rgba(255,255,255,.7);}
.fs-section--light{background:var(--surface);padding:72px 24px;}
.fs-section--bg{background:var(--bg);padding:72px 24px;}
.fs-section__label{font-size:12px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--cta);margin-bottom:10px;display:block;}
.fs-section--dark .fs-section__label{color:rgba(255,255,255,.6);}
.fs-section__title{margin-bottom:14px;}
.fs-section__sub{font-size:18px;max-width:600px;margin-bottom:44px;}

.fs-emergency{background:var(--emergency);padding:64px 24px;text-align:center;}
.fs-emergency__inner{max-width:700px;margin:0 auto;}
.fs-emergency h2{color:var(--white);font-size:2.5rem;margin-bottom:12px;}
.fs-emergency p{color:rgba(255,255,255,.9);font-size:18px;margin-bottom:24px;}
.fs-emergency__response{font-family:'${headFont}',sans-serif;font-size:1.25rem;font-weight:700;color:var(--white);margin-bottom:28px;}

.fs-mobile-cta{display:none;position:fixed;bottom:0;left:0;right:0;z-index:200;background:var(--emergency);}
.fs-mobile-cta a{display:flex;align-items:center;justify-content:center;gap:10px;color:var(--white);font-family:'${headFont}',sans-serif;font-size:1.1rem;font-weight:800;padding:14px 16px;}
@media(max-width:640px){.fs-mobile-cta{display:block;}}

.fs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:20px;}
.fs-card{background:var(--surface);border-radius:var(--r-card);padding:28px 24px;box-shadow:${cardShadow};transition:box-shadow .15s,transform .15s;}
.fs-card:hover{${cardHover}}
.fs-card--featured{outline:3px solid var(--cta);}
.fs-card__icon{font-size:2rem;margin-bottom:14px;}
.fs-card__title{font-family:'${headFont}',sans-serif;font-size:1.15rem;font-weight:700;margin-bottom:8px;color:var(--text);}
.fs-card__body{font-size:15px;color:var(--text-muted);line-height:1.5;}

.fs-testimonial{background:var(--surface);border-radius:var(--r-card);padding:24px;box-shadow:${cardShadow};}
.fs-testimonial__stars{color:var(--cta);font-size:1.1rem;margin-bottom:10px;}
.fs-testimonial__text{font-size:16px;font-style:italic;color:var(--text);margin-bottom:14px;line-height:1.6;}
.fs-testimonial__author{font-size:.8rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;}
.fs-rating-hero{font-family:'${headFont}',sans-serif;font-size:2rem;font-weight:800;color:var(--cta);margin-bottom:28px;}

.fs-contact-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:20px;margin-top:32px;}
.fs-contact-item{background:var(--surface);border-radius:var(--r-card);padding:20px 24px;box-shadow:${cardShadow};}
.fs-contact-item__label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:8px;}
.fs-contact-item__value{font-weight:700;color:var(--text);}

.fs-hours{width:100%;border-collapse:collapse;}
.fs-hours td{padding:4px 0;font-size:.875rem;}
.fs-hours td:first-child{font-weight:700;color:var(--text);padding-right:12px;}
.fs-hours td:last-child{color:var(--text-muted);}

.fs-areas{display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;}
.fs-areas__pill{background:var(--surface-2);border-radius:var(--r-badge);padding:6px 14px;font-size:.8rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text);}

.fs-footer{background:var(--primary);color:rgba(255,255,255,.55);padding:48px 24px;}
.fs-footer__inner{max-width:1200px;margin:0 auto;display:flex;flex-wrap:wrap;gap:32px;justify-content:space-between;}
.fs-footer__name{font-family:'${headFont}',sans-serif;font-size:1.35rem;font-weight:800;color:var(--white);margin-bottom:8px;}
.fs-footer__phone{font-family:'${headFont}',sans-serif;font-size:1.75rem;font-weight:800;color:var(--cta);}
.fs-footer__social{display:flex;gap:16px;margin:12px 0;}
.fs-footer__social a{color:rgba(255,255,255,.55);font-size:.875rem;}
.fs-footer__social a:hover{color:var(--white);}
.fs-footer__bottom{text-align:center;padding-top:24px;border-top:1px solid rgba(255,255,255,.1);font-size:.8rem;margin-top:24px;width:100%;}
.fs-founder-badge{margin-top:12px;font-size:.7rem;color:rgba(255,255,255,.3);}

@media(max-width:768px){
  h1{font-size:2.25rem;}h2{font-size:1.75rem;}
  .fs-hero,.fs-section,.fs-section--dark,.fs-section--light,.fs-section--bg,.fs-emergency{padding:48px 16px;}
  .fs-hero__phone{font-size:1.75rem;}
  .fs-card{padding:20px 16px;}
  .fs-trust{gap:16px;}
  .fs-header{padding:0 16px;}
  .fs-footer__inner{flex-direction:column;}
}`;
}

// --- Public API -------------------------------------------------------------

export function extractDesignSystemBlocks(markdown: string): DesignSystemBlocks {
  // Original Stitch format: YAML frontmatter with design tokens
  const tokens = parseStitchFrontmatter(markdown);
  if (tokens) {
    const css = buildCssFromTokens(tokens);
    // Surface the prose Components section so Claude knows what patterns to use
    const patternsMatch = markdown.match(/## Components([\s\S]*)$/);
    const patterns = patternsMatch ? patternsMatch[1].trim() : null;
    return { css, patterns };
  }

  // Fallback: legacy ```css block format
  const cssMatch = markdown.match(/```css\n([\s\S]*?)\n```/);
  const css = cssMatch ? cssMatch[1].trim() : null;
  const patternsMatch = markdown.match(/## HTML Component Patterns([\s\S]*)$/);
  const patterns = patternsMatch ? patternsMatch[1].trim() : null;
  return { css, patterns };
}

const PLACEHOLDER = '{{CONTENT_JSON}}';

// Resolved once at module load so every call shares the same base path.
// Override via PROMPTS_DIR env var (e.g. in a test harness).
function getTemplatesDir(): string {
  return process.env.PROMPTS_DIR ?? path.join(process.cwd(), 'src', 'prompts');
}

// ---------------------------------------------------------------------------
// loadRawTemplate — reads the .txt file for the given vertical.
// Throws with a clear path if the file is missing rather than letting
// Node bubble up an opaque ENOENT.
// ---------------------------------------------------------------------------

export function loadRawTemplate(
  verticalType: 'plumbing' | 'electrical' | 'hvac' | 'roofing' | 'church',
): string {
  const filePath = path.join(getTemplatesDir(), `${verticalType}.txt`);
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    throw new Error(
      `Prompt template not found for vertical "${verticalType}". ` +
      `Expected file at: ${filePath}`,
    );
  }
}

// ---------------------------------------------------------------------------
// computeTemplateHash — short SHA-256 prefix used in generation logs so
// operators can correlate output quality with specific template versions
// without storing the full template text in every log line.
// ---------------------------------------------------------------------------

export function computeTemplateHash(template: string): string {
  return crypto.createHash('sha256').update(template).digest('hex').slice(0, 12);
}

// ---------------------------------------------------------------------------
// AssembledPrompt — the template split at {{CONTENT_JSON}} into a static
// prefix and the dynamic payload. Keeping them separate lets the Claude
// service send them as distinct content blocks so the static prefix can be
// marked for prompt caching. The payload changes per client; the prefix is
// identical for every client on the same vertical.
// ---------------------------------------------------------------------------

export interface AssembledPrompt {
  verticalType: 'plumbing' | 'electrical' | 'hvac' | 'roofing' | 'church';
  templateHash: string;
  templatePrefix: string;  // static — safe to cache across clients
  payloadJson: string;     // dynamic — changes per client
  templateSuffix: string;  // content after the placeholder (usually empty)
}

// ---------------------------------------------------------------------------
// assemblePrompt — validates the template, maps the canonical content to the
// flat prompt payload, and returns the split parts ready for the Claude call.
// ---------------------------------------------------------------------------

export function assemblePrompt(content: ContentJson): AssembledPrompt {
  const { verticalType } = content;
  const rawTemplate = loadRawTemplate(verticalType);

  const occurrences = rawTemplate.split(PLACEHOLDER).length - 1;
  if (occurrences === 0) {
    throw new Error(
      `Prompt template for "${verticalType}" is missing the ${PLACEHOLDER} placeholder`,
    );
  }
  if (occurrences > 1) {
    throw new Error(
      `Prompt template for "${verticalType}" contains ${occurrences} occurrences ` +
      `of ${PLACEHOLDER} — expected exactly 1`,
    );
  }

  const templateHash = computeTemplateHash(rawTemplate);
  const payload = mapContentToPromptPayload(content);
  const payloadJson = JSON.stringify(payload, null, 2);

  const splitIdx = rawTemplate.indexOf(PLACEHOLDER);
  const templatePrefix = rawTemplate.slice(0, splitIdx);
  const templateSuffix = rawTemplate.slice(splitIdx + PLACEHOLDER.length);

  return { verticalType, templateHash, templatePrefix, payloadJson, templateSuffix };
}
