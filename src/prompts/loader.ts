import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { ContentJson } from '../schemas/content.schema';
import { mapContentToPromptPayload } from '../mappers/prompt.mapper';

// ---------------------------------------------------------------------------
// loadDesignSpec — reads the Stitch-exported design spec from its well-known
// location. Returns null if the file has not been placed yet so generation
// degrades gracefully rather than throwing.
// ---------------------------------------------------------------------------

const DESIGN_SPEC_PATH = path.join(process.cwd(), 'public', 'stitch-reference', 'design-spec.md');

export function loadDesignSpec(): string | null {
  try {
    return fs.readFileSync(DESIGN_SPEC_PATH, 'utf-8');
  } catch {
    return null;
  }
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
